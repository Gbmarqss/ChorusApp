import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import {
    Save, ArrowLeft, CheckCircle, Clock, AlertTriangle,
    Share2, Trash2, User, Lock, Unlock, Eye, Edit2,
    Calendar, Check, X, Shield, Users
} from 'lucide-react';
import { MINISTERIOS_DEFAULT } from '../logic';
import Toast from '../components/Toast';
import Modal from '../components/ui/Modal';

export default function PreScaleEditor() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Data States
    const [preSchedule, setPreSchedule] = useState(null);
    const [approvals, setApprovals] = useState([]);
    const [ministries, setMinistries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // UI States
    const [editingSlot, setEditingSlot] = useState(null);
    const [manualEntryMode, setManualEntryMode] = useState(false); // Track if user wants to type custom name
    const [availableVolunteers, setAvailableVolunteers] = useState({}); // Availability map from wizard

    // Load Data
    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);

            // 1. Fetch PreSchedule
            const { data: schedule, error: schedError } = await supabase
                .from('pre_schedules')
                .select('*')
                .eq('id', id)
                .single();

            if (schedError) throw schedError;

            // 2. Fetch Ministries
            const { data: mins, error: minError } = await supabase
                .from('ministries')
                .select('*');

            if (minError) throw minError;

            // 3. Fetch Existing Approvals
            // FIX: Explicitly specify foreign keys to avoid PGRST201 ambiguity
            const { data: apps, error: appError } = await supabase
                .from('approvals')
                .select('*, ministry:ministries!ministry_id(name), approver:users!approved_by(name)')
                .eq('pre_schedule_id', id);

            if (appError) throw appError;

            setPreSchedule(schedule);
            setMinistries(mins);
            setApprovals(apps);
            setAvailableVolunteers(schedule.availability || {}); // Load availability suggestions

        } catch (err) {
            console.error('Error loading data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleApprove = async (ministryId) => {
        if (!user) return;

        try {
            const { error } = await supabase
                .from('approvals')
                .insert({
                    pre_schedule_id: id,
                    ministry_id: ministryId,
                    approved_by: user.id
                });

            if (error) throw error;

            // Refresh approvals
            // FIX: Explicitly specify foreign keys to avoid PGRST201 ambiguity
            const { data: apps } = await supabase
                .from('approvals')
                .select('*, ministry:ministries!ministry_id(name), approver:users!approved_by(name)')
                .eq('pre_schedule_id', id);

            setApprovals(apps);

        } catch (err) {
            console.error('Error approving:', err);
            alert('Erro ao aprovar: ' + err.message);
        }
    };

    const handleRevoke = async (ministryId) => {
        try {
            const { error } = await supabase
                .from('approvals')
                .delete()
                .eq('pre_schedule_id', id)
                .eq('ministry_id', ministryId);

            if (error) throw error;

            setApprovals(approvals.filter(a => a.ministry_id !== ministryId));
        } catch (err) {
            console.error('Error revoking:', err);
        }
    };

    // Modals & Toast
    const [toast, setToast] = useState(null);
    const [modal, setModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => { } });

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
    };

    const handlePublish = async () => {
        // Validation: Verify if all ministries approved
        const allApproved = ministries.every(m => approvals.some(a => a.ministry_id === m.id));

        if (!allApproved) {
            showToast('Todos os ministérios precisam aprovar antes de publicar.', 'error');
            return;
        }

        setModal({
            isOpen: true,
            title: 'Publicar Escala',
            message: 'Tem certeza? Isso tornará a escala pública e visível para todos.',
            type: 'success', // or 'info'
            onConfirm: executePublish
        });
    };

    const executePublish = async () => {
        setLoading(true);
        try {
            // 1. Create Final Schedule
            const { data: finalSchedule, error: pubError } = await supabase
                .from('schedules')
                .insert({
                    title: preSchedule.title,
                    data: preSchedule.data,
                    created_by: user.id,
                    status: 'published',
                    published_at: new Date(),
                    valid_from: new Date(), // MVP simplification
                    valid_until: new Date() // MVP simplification
                })
                .select()
                .single();

            if (pubError) throw pubError;

            // 2. Update Pre-Schedule Status
            const { error: updateError } = await supabase
                .from('pre_schedules')
                .update({ status: 'published' })
                .eq('id', id);

            if (updateError) throw updateError;

            // 3. Redirect to Public View
            showToast('Escala publicada com sucesso!');
            setTimeout(() => navigate(`/public/${finalSchedule.id}`), 1000);

        } catch (err) {
            console.error('Error publishing:', err);
            showToast('Erro ao publicar: ' + err.message, 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateSlot = async (index, newValue) => {
        // Enforce default string if empty
        const finalValue = newValue && newValue.trim() !== '' ? newValue : 'Não designado';

        // Deep clone data
        const newData = [...preSchedule.data];
        newData[index].Voluntario = finalValue;

        // Optimistic Update
        setPreSchedule({ ...preSchedule, data: newData });
        setEditingSlot(null);

        // Save to DB
        try {
            const { error } = await supabase
                .from('pre_schedules')
                .update({ data: newData })
                .eq('id', id);

            if (error) throw error;
        } catch (err) {
            console.error('Error saving slot:', err);
            alert('Erro ao salvar alteração');
        }
    };

    // Derived States
    const groupedData = preSchedule?.data?.reduce((acc, item) => {
        if (!acc[item.Data]) acc[item.Data] = [];
        acc[item.Data].push(item);
        return acc;
    }, {}) || {};

    const getApprovalStatus = (ministryName) => {
        const ministry = ministries.find(m => m.name === ministryName);
        if (!ministry) return null;

        const approval = approvals.find(a => a.ministry_id === ministry.id);
        return {
            isApproved: !!approval,
            data: approval,
            ministryId: ministry.id
        };
    };

    // User List for Dropdown
    const [allUsers, setAllUsers] = useState([]);

    useEffect(() => {
        const fetchUsers = async () => {
            const { data } = await supabase.from('users').select('id, name').order('name');
            setAllUsers(data || []);
        };
        fetchUsers();
    }, []);

    if (loading) return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white">
            <div className="text-center">
                <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
                <h2 className="text-2xl font-bold mb-2">Erro ao carregar escala</h2>
                <p className="text-slate-400">{error}</p>
                <button onClick={() => navigate('/')} className="mt-6 px-6 py-2 bg-blue-600 rounded-lg">Voltar</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#020617] text-white flex flex-col h-screen overflow-hidden">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <Modal
                isOpen={modal.isOpen}
                onClose={() => setModal({ ...modal, isOpen: false })}
                onConfirm={modal.onConfirm}
                title={modal.title}
                message={modal.message}
                type={modal.type}
            />

            {/* 1. Top Header */}
            <header className="h-16 border-b border-blue-900/30 bg-[#0f172a] px-6 flex items-center justify-between shadow-lg z-20">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/')} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold flex items-center gap-2">
                            {preSchedule.title}
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-blue-900/40 text-blue-300 border border-blue-500/30 font-extrabold uppercase tracking-wider">
                                {preSchedule.status === 'draft' ? 'Rascunho' : preSchedule.status}
                            </span>
                        </h1>
                        <p className="text-xs text-slate-500">
                            Criado por <strong>{preSchedule.created_by === user.id ? 'Você' : 'Outro Admin'}</strong> em {new Date(preSchedule.created_at).toLocaleDateString()}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button className="px-4 py-2 rounded-xl bg-blue-900/20 text-blue-300 hover:bg-blue-900/40 border border-blue-500/30 text-sm font-bold flex items-center gap-2">
                        <Share2 size={16} /> Compartilhar
                    </button>
                    <button
                        onClick={handlePublish}
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/20 text-sm font-bold flex items-center gap-2"
                    >
                        <Check size={18} /> Publicar Escala
                    </button>
                </div>
            </header>

            {/* 2. Main Layout (Sidebar + Grid) */}
            <div className="flex-1 flex overflow-hidden">
                {/* Sidebar - Progress */}
                <aside className="w-80 bg-[#0f172a]/50 border-r border-blue-900/30 p-6 overflow-y-auto hidden md:block">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-6 flex items-center gap-2">
                        <Shield size={14} /> Aprovações
                    </h3>

                    <div className="space-y-4">
                        {ministries.map(min => {
                            const status = getApprovalStatus(min.name);
                            const isApproved = status?.isApproved;
                            const approvalData = status?.data;

                            return (
                                <div key={min.id} className={`p-4 rounded-xl border transition-all ${isApproved ? 'bg-emerald-900/10 border-emerald-500/30' : 'bg-[#020617] border-blue-900/30'}`}>
                                    <div className="flex justify-between items-start mb-2">
                                        <span className="font-bold text-sm text-slate-200">{min.name}</span>
                                        {isApproved ? <CheckCircle size={16} className="text-emerald-400" /> : <Clock size={16} className="text-slate-500" />}
                                    </div>

                                    {isApproved ? (
                                        <div className="text-xs text-slate-500">
                                            <p>Aprovado por <span className="text-emerald-300">{approvalData?.approver?.name || 'Admin'}</span></p>
                                            <p className="mt-1 opacity-60">{new Date(approvalData.approved_at).toLocaleDateString()}</p>
                                            {(user.role === 'admin' || user.id === approvalData.approved_by) && (
                                                <button
                                                    onClick={() => handleRevoke(min.id)}
                                                    className="mt-3 text-red-400 hover:text-red-300 text-[10px] font-bold flex items-center gap-1"
                                                >
                                                    <X size={10} /> REVOGAR
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <div className="mt-3">
                                            <button
                                                onClick={() => handleApprove(min.id)}
                                                className="w-full py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md"
                                            >
                                                Aprovar {min.name}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </aside>

                {/* Main Content - Grid */}
                <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-[#020617] relative">
                    <div className="max-w-6xl mx-auto space-y-8 pb-20">
                        {Object.keys(groupedData).map(date => (
                            <div key={date} className="bg-[#0f172a] rounded-2xl border border-blue-900/30 overflow-hidden shadow-xl">
                                <div className="p-3 bg-gradient-to-r from-blue-900/40 to-indigo-900/40 border-b border-blue-900/30 flex items-center justify-center">
                                    <h3 className="font-bold text-slate-200 uppercase tracking-widest text-sm flex items-center gap-2">
                                        <Calendar size={14} className="text-blue-400" /> {date}
                                    </h3>
                                </div>
                                <div className="divide-y divide-blue-900/10">
                                    {groupedData[date].map((slot, idx) => {
                                        // Find true index in original array
                                        const globalIndex = preSchedule.data.indexOf(slot);
                                        const ministryName = slot.AreaOriginal || 'OUTROS';
                                        const status = getApprovalStatus(ministryName);
                                        const isLocked = status?.isApproved;

                                        return (
                                            <div key={idx} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
                                                <div className="flex-1">
                                                    <p className="text-xs font-bold text-slate-500 uppercase mb-1">{slot.Funcao}</p>
                                                    {editingSlot === globalIndex ? (
                                                        <div className="flex flex-col gap-2 min-w-[200px]">
                                                            <div className="flex gap-1">
                                                                <select
                                                                    autoFocus
                                                                    className="w-full bg-[#020617] border border-blue-500 rounded-lg px-2 py-1.5 text-sm outline-none text-white appearance-none cursor-pointer hover:bg-[#0f172a] transition-colors"
                                                                    defaultValue={
                                                                        allUsers.some(u => u.name === slot.Voluntario) || slot.Voluntario === 'Não designado'
                                                                            ? slot.Voluntario === 'Não designado' ? '' : slot.Voluntario
                                                                            : 'MANUAL_ENTRY'
                                                                    }
                                                                    onChange={(e) => {
                                                                        if (e.target.value === 'MANUAL_ENTRY') {
                                                                            // Force trigger manual mode if needed, effectively handled by default value logic visually
                                                                            // But here we might want to just set a temporary state if we want hybrid
                                                                            // For now, simpler: If 'MANUAL_ENTRY' is selected, we could swap to input?
                                                                            // Let's try a hybrid approach:
                                                                            // If they pick "Outro/Manual", we clear the slot to let them type? 
                                                                            // Or simpler: Just render Input if the value isn't in the list?
                                                                        }
                                                                        handleUpdateSlot(globalIndex, e.target.value)
                                                                    }}
                                                                    onBlur={() => {
                                                                        // Only close if we are NOT in manual mode? 
                                                                        // Actually, let's change the UI: Select AND a Button to toggle "Manual"
                                                                    }}
                                                                >
                                                                    <option value="" className="text-slate-500 italic">Não designado</option>
                                                                    <optgroup label="Voluntários Cadastrados">
                                                                        {allUsers.map(user => (
                                                                            <option key={user.id} value={user.name}>{user.name}</option>
                                                                        ))}
                                                                    </optgroup>
                                                                    {/* Availability Suggestions */}
                                                                    {(() => {
                                                                        const areaKey = slot.AreaOriginal || 'OUTROS';
                                                                        const suggestions = availableVolunteers[slot.Data]?.[areaKey] || [];
                                                                        const uniqueSuggestions = suggestions.filter(name =>
                                                                            !allUsers.some(u => u.name === name) && name !== 'Não designado'
                                                                        );

                                                                        if (uniqueSuggestions.length > 0) {
                                                                            return (
                                                                                <optgroup label="📋 Sugestões (Disponíveis)">
                                                                                    {uniqueSuggestions.map(name => (
                                                                                        <option key={name} value={name} className="text-green-300">{name}</option>
                                                                                    ))}
                                                                                </optgroup>
                                                                            );
                                                                        }
                                                                        return null;
                                                                    })()}
                                                                    <option value="MANUAL_ENTRY" className="text-yellow-400 font-bold">✎ Digitar outro nome...</option>
                                                                </select>
                                                            </div>

                                                            {/* Manual Input Mode - only if the current value is NOT in the list and NOT empty/default */}
                                                            {(slot.Voluntario === 'MANUAL_ENTRY' || (!allUsers.some(u => u.name === slot.Voluntario) && slot.Voluntario !== 'Não designado')) && (
                                                                <input
                                                                    autoFocus
                                                                    placeholder="Digite o nome..."
                                                                    className="w-full bg-[#0f172a] border border-yellow-500/50 text-yellow-100 px-2 py-1.5 rounded-lg text-sm outline-none animate-fade-in"
                                                                    defaultValue={slot.Voluntario === 'MANUAL_ENTRY' ? '' : slot.Voluntario}
                                                                    onBlur={(e) => {
                                                                        handleUpdateSlot(globalIndex, e.target.value);
                                                                        setEditingSlot(null);
                                                                    }}
                                                                    onKeyDown={(e) => {
                                                                        if (e.key === 'Enter') {
                                                                            handleUpdateSlot(globalIndex, e.currentTarget.value);
                                                                            setEditingSlot(null);
                                                                        }
                                                                    }}
                                                                />
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="flex items-center gap-2">
                                                            <span className={`text-sm font-medium ${slot.Voluntario === 'Não designado' ? 'text-red-400 opacity-80' : 'text-slate-200'}`}>
                                                                {slot.Voluntario}
                                                            </span>
                                                            {!isLocked && (
                                                                <button
                                                                    onClick={() => setEditingSlot(globalIndex)}
                                                                    className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-blue-400 transition-all"
                                                                >
                                                                    <Edit2 size={12} />
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <span className={`px-2 py-1 rounded-md text-[10px] font-bold border ${isLocked ? 'bg-emerald-900/20 text-emerald-400 border-emerald-500/30' : 'bg-slate-800 text-slate-500 border-slate-700'}`}>
                                                        {ministryName}
                                                    </span>
                                                    {isLocked && <Lock size={14} className="text-emerald-500/50" />}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        ))}
                    </div>
                </main>
            </div>
        </div>
    );
}
