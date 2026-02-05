import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import {
    Save, ArrowLeft, CheckCircle, AlertTriangle,
    Eye, Edit2, Calendar, Lock, ArrowRightLeft
} from 'lucide-react';
import Toast from '../components/Toast';
import Modal from '../components/ui/Modal';

export default function EditPublishedSchedule() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuth();

    // Data States
    const [schedule, setSchedule] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [allUsers, setAllUsers] = useState([]);

    // UI States
    const [editingSlot, setEditingSlot] = useState(null);
    const [toast, setToast] = useState(null);

    // Load Data
    useEffect(() => {
        loadData();
    }, [id]);

    const loadData = async () => {
        try {
            setLoading(true);

            // 1. Fetch Schedule
            const { data: sched, error: schedError } = await supabase
                .from('schedules')
                .select('*')
                .eq('id', id)
                .single();

            if (schedError) throw schedError;

            // 2. Fetch Users for Dropdown
            const { data: users, error: usersError } = await supabase
                .from('users')
                .select('id, name')
                .order('name');

            if (usersError) throw usersError;

            setSchedule(sched);
            setAllUsers(users || []);

        } catch (err) {
            console.error('Error loading data:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
    };

    const handleUpdateSlot = async (index, newValue) => {
        // Enforce default string
        const finalValue = newValue && newValue.trim() !== '' ? newValue : 'Não designado';

        // Deep clone data
        const newData = [...schedule.data];
        const slot = newData[index];

        // SUBSTITUTION LOGIC
        // If we are changing the name, and we haven't tracked original yet:
        if (slot.Voluntario !== finalValue) {
            if (!slot.original_volunteer) {
                // First change: Store the original
                slot.original_volunteer = slot.Voluntario;
            } else if (slot.original_volunteer === finalValue) {
                // We are reverting to original: Clear the tracking
                delete slot.original_volunteer;
            }
        }

        slot.Voluntario = finalValue;

        // Optimistic Update
        setSchedule({ ...schedule, data: newData });
        setEditingSlot(null);

        // Save to DB
        try {
            const { error } = await supabase
                .from('schedules')
                .update({ data: newData })
                .eq('id', id);

            if (error) throw error;
            showToast('Alteração salva (Ao Vivo)', 'success');
        } catch (err) {
            console.error('Error saving slot:', err);
            showToast('Erro ao salvar: ' + err.message, 'error');
            // Revert would go here in stricter app
        }
    };

    // Grouping
    const groupedData = schedule?.data?.reduce((acc, item) => {
        if (!acc[item.Data]) acc[item.Data] = [];
        acc[item.Data].push(item);
        return acc;
    }, {}) || {};

    if (loading) return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center text-white">
            <div className="text-center">
                <AlertTriangle size={48} className="mx-auto text-red-500 mb-4" />
                <p>{error}</p>
                <button onClick={() => navigate('/')} className="mt-4 bg-blue-600 px-4 py-2 rounded">Voltar</button>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#020617] text-white flex flex-col h-screen overflow-hidden">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            {/* Header */}
            <header className="h-16 border-b border-amber-900/30 bg-[#0f172a] px-6 flex items-center justify-between shadow-lg z-20">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate('/')} className="p-2 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-colors">
                        <ArrowLeft size={20} />
                    </button>
                    <div>
                        <h1 className="text-lg font-bold flex items-center gap-2 text-amber-500">
                            {schedule.title}
                            <span className="px-2 py-0.5 rounded-full text-[10px] bg-red-900/40 text-red-300 border border-red-500/30 font-extrabold uppercase tracking-wider flex items-center gap-1">
                                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span> AO VIVO
                            </span>
                        </h1>
                        <p className="text-xs text-slate-500">
                            Modo de Edição Direta &bull; Alterações aparecem imediatamente no link público.
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={() => navigate(`/public/${schedule.id}`)}
                        className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 border border-slate-600 text-sm font-bold flex items-center gap-2"
                    >
                        <Eye size={16} /> Ver Link Público
                    </button>
                </div>
            </header>

            {/* Main Content */}
            <main className="flex-1 p-6 md:p-8 overflow-y-auto bg-[#020617] relative">
                <div className="max-w-4xl mx-auto space-y-8 pb-20">
                    {Object.keys(groupedData).map(date => (
                        <div key={date} className="bg-[#0f172a] rounded-2xl border border-amber-900/20 overflow-hidden shadow-xl">
                            <div className="p-3 bg-gradient-to-r from-amber-900/10 to-red-900/10 border-b border-amber-900/20 flex items-center justify-center">
                                <h3 className="font-bold text-amber-500 uppercase tracking-widest text-sm flex items-center gap-2">
                                    <Calendar size={14} /> {date}
                                </h3>
                            </div>
                            <div className="divide-y divide-amber-900/10">
                                {groupedData[date].map((slot, idx) => {
                                    const globalIndex = schedule.data.indexOf(slot);
                                    const isSubstituted = slot.original_volunteer && slot.original_volunteer !== slot.Voluntario;

                                    return (
                                        <div key={idx} className="p-4 flex items-center justify-between hover:bg-white/5 transition-colors group">
                                            <div className="flex-1">
                                                <p className="text-xs font-bold text-slate-500 uppercase mb-1">{slot.Funcao}</p>

                                                {editingSlot === globalIndex ? (
                                                    <div className="flex flex-col gap-2 min-w-[200px] max-w-sm">
                                                        <div className="flex gap-1">
                                                            <select
                                                                autoFocus
                                                                className="w-full bg-[#020617] border border-amber-500 rounded-lg px-2 py-1.5 text-sm outline-none text-white cursor-pointer"
                                                                defaultValue={
                                                                    allUsers.some(u => u.name === slot.Voluntario) || slot.Voluntario === 'Não designado'
                                                                        ? slot.Voluntario === 'Não designado' ? '' : slot.Voluntario
                                                                        : 'MANUAL_ENTRY'
                                                                }
                                                                onChange={(e) => {
                                                                    if (e.target.value !== 'MANUAL_ENTRY') {
                                                                        handleUpdateSlot(globalIndex, e.target.value);
                                                                    }
                                                                }}
                                                            >
                                                                <option value="" className="text-slate-500 italic">Não designado</option>
                                                                <optgroup label="Voluntários">
                                                                    {allUsers.map(user => (
                                                                        <option key={user.id} value={user.name}>{user.name}</option>
                                                                    ))}
                                                                </optgroup>
                                                                <option value="MANUAL_ENTRY" className="text-amber-400 font-bold">✎ Digitar outro...</option>
                                                            </select>
                                                        </div>
                                                        {/* Force Manual Entry Input if manual or custom value */}
                                                        {(!allUsers.some(u => u.name === slot.Voluntario) && slot.Voluntario !== 'Não designado') && (
                                                            <input
                                                                autoFocus
                                                                placeholder="Digite o nome..."
                                                                className="w-full bg-[#0f172a] border border-amber-500/50 text-amber-100 px-2 py-1.5 rounded-lg text-sm outline-none"
                                                                defaultValue={slot.Voluntario}
                                                                onBlur={(e) => {
                                                                    handleUpdateSlot(globalIndex, e.target.value);
                                                                }}
                                                                onKeyDown={(e) => {
                                                                    if (e.key === 'Enter') handleUpdateSlot(globalIndex, e.currentTarget.value);
                                                                }}
                                                            />
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-3">
                                                        <span className={`text-sm font-medium ${slot.Voluntario === 'Não designado' ? 'text-red-400 opacity-80' : 'text-slate-200'}`}>
                                                            {slot.Voluntario}
                                                        </span>
                                                        <button
                                                            onClick={() => setEditingSlot(globalIndex)}
                                                            className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-amber-400 transition-all"
                                                        >
                                                            <Edit2 size={12} />
                                                        </button>

                                                        {isSubstituted && (
                                                            <span className="text-[10px] text-amber-500 bg-amber-900/20 px-1.5 py-0.5 rounded flex items-center gap-1 border border-amber-500/20">
                                                                <ArrowRightLeft size={10} /> Subst.
                                                            </span>
                                                        )}
                                                    </div>
                                                )}

                                                {isSubstituted && !editingSlot && (
                                                    <p className="text-[10px] text-slate-500 mt-1">
                                                        Original: {slot.original_volunteer}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="ml-4">
                                                <span className="px-2 py-1 rounded-md text-[10px] font-bold bg-slate-800 text-slate-500 border border-slate-700">
                                                    {slot.AreaOriginal || 'Geral'}
                                                </span>
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
    );
}
