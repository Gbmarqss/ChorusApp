import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Plus, Trash2, Shield, Users, AlertTriangle, Save, X, CheckCircle } from 'lucide-react';
import Modal from '../components/ui/Modal';

// Simple Toast Component for Notifications
const Toast = ({ message, type = 'success', onClose }) => (
    <div className={`fixed bottom-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in ${type === 'error' ? 'bg-red-900 border border-red-500 text-white' : 'bg-emerald-900 border border-emerald-500 text-white'
        }`}>
        {type === 'error' ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
        <p className="font-bold">{message}</p>
        <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100"><X size={16} /></button>
    </div>
);

export default function Ministries() {
    const [ministries, setMinistries] = useState([]);
    const [loading, setLoading] = useState(true);
    const [newMinistry, setNewMinistry] = useState({ name: '', color: '#3B82F6', description: '' });
    const [isCreating, setIsCreating] = useState(false);
    const [toast, setToast] = useState(null); // { message, type }
    const [modal, setModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => { } });

    useEffect(() => {
        loadMinistries();
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const loadMinistries = async () => {
        try {
            // FIX: Explicitly specify !ministry_id to avoid ambiguity with user_ministries table
            const { data, error } = await supabase
                .from('ministries')
                .select('*, users!ministry_id(count)');

            if (error) throw error;
            // Force strict sync: no hardcoded fallbacks
            setMinistries(data || []);
        } catch (error) {
            console.error('Error loading ministries:', error);
            showToast('Erro ao carregar ministérios.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const handleCreate = async () => {
        if (!newMinistry.name) return;

        try {
            const { data, error } = await supabase
                .from('ministries')
                .insert([newMinistry])
                .select()
                .single();

            if (error) throw error;

            // Refresh list from server to be sure
            await loadMinistries();
            setIsCreating(false);
            setNewMinistry({ name: '', color: '#3B82F6', description: '' });
            showToast('Ministério criado com sucesso!');
        } catch (err) {
            console.error(err);
            showToast('Erro ao criar: ' + err.message, 'error');
        }
    };

    const confirmDelete = (id, count) => {
        if (count > 0) {
            showToast('Não é possível excluir ministério com membros.', 'error');
            return;
        }

        setModal({
            isOpen: true,
            title: 'Excluir Ministério',
            message: 'Tem certeza que deseja excluir este ministério? Essa ação não pode ser desfeita e pode afetar escalas antigas.',
            onConfirm: () => handleDelete(id),
            type: 'danger'
        });
    };

    const handleDelete = async (id) => {
        try {
            const { error } = await supabase
                .from('ministries')
                .delete()
                .eq('id', id);

            if (error) throw error;

            await loadMinistries(); // Reload from source to ensure no ghosts
            showToast('Ministério excluído com sucesso!');
        } catch (err) {
            console.error(err);
            showToast('Erro ao excluir: ' + err.message, 'error');
        }
    };

    return (
        <div className="space-y-8 animate-fade-in-up pb-20">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <Modal
                isOpen={modal.isOpen}
                onClose={() => setModal({ ...modal, isOpen: false })}
                onConfirm={modal.onConfirm}
                title={modal.title}
                message={modal.message}
                type={modal.type}
            />

            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-white">Gerenciar Ministérios</h1>
                    <p className="text-slate-400 mt-1">Configure as áreas de atuação da igreja</p>
                </div>
                <button
                    onClick={() => setIsCreating(true)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-white flex items-center gap-2 shadow-lg hover:shadow-blue-900/20 transition-all"
                >
                    <Plus size={20} /> Novo Ministério
                </button>
            </div>

            {/* Create Form */}
            {isCreating && (
                <div className="bg-[#0f172a] border border-blue-900/30 rounded-2xl p-6 shadow-xl animate-fade-in">
                    <h3 className="text-lg font-bold text-white mb-4">Novo Ministério</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Nome</label>
                            <input
                                type="text"
                                value={newMinistry.name}
                                onChange={e => setNewMinistry({ ...newMinistry, name: e.target.value })}
                                className="w-full bg-[#020617] border border-blue-900/30 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Ex: Louvor"
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Cor da Etiqueta</label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={newMinistry.color}
                                    onChange={e => setNewMinistry({ ...newMinistry, color: e.target.value })}
                                    className="h-11 w-20 bg-transparent cursor-pointer rounded-lg overflow-hidden border border-blue-900/30"
                                />
                                <span className="text-slate-500 text-sm">{newMinistry.color}</span>
                            </div>
                        </div>
                        <div className="md:col-span-2">
                            <label className="block text-xs font-bold text-slate-400 mb-1 uppercase">Descrição</label>
                            <input
                                type="text"
                                value={newMinistry.description}
                                onChange={e => setNewMinistry({ ...newMinistry, description: e.target.value })}
                                className="w-full bg-[#020617] border border-blue-900/30 rounded-lg p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="Breve descrição da função deste ministério"
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-3">
                        <button
                            onClick={() => setIsCreating(false)}
                            className="px-4 py-2 rounded-lg hover:bg-white/10 text-slate-400 font-bold"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleCreate}
                            className="px-6 py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-bold flex items-center gap-2"
                        >
                            <Save size={18} /> Salvar
                        </button>
                    </div>
                </div>
            )}

            {/* List */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {ministries.map(ministry => (
                    <div key={ministry.id} className="bg-[#0f172a] border border-blue-900/30 rounded-2xl p-6 group hover:border-blue-500/30 transition-all duration-300 shadow-lg hover:shadow-2xl hover:-translate-y-1 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: ministry.color }}></div>

                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h3 className="text-xl font-bold text-white">{ministry.name}</h3>
                                <p className="text-sm text-slate-500 mt-1">{ministry.description || 'Sem descrição'}</p>
                            </div>
                            <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                                <Shield size={16} />
                            </div>
                        </div>

                        <div className="flex items-center justify-between pt-4 border-t border-blue-900/10">
                            <div className="flex items-center gap-2 text-slate-400 text-sm">
                                <Users size={16} />
                                <span>{ministry.users?.[0]?.count || 0} membros</span>
                            </div>
                            <button
                                onClick={() => confirmDelete(ministry.id, ministry.users?.[0]?.count)}
                                className="p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors opacity-60 group-hover:opacity-100"
                                title="Excluir Ministério"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))}
            </div>

            {ministries.length === 0 && !loading && (
                <div className="text-center py-20 bg-[#0f172a] rounded-3xl border border-blue-900/30 border-dashed">
                    <p className="text-slate-500">Nenhum ministério encontrado no banco de dados.</p>
                </div>
            )}
        </div>
    );
}
