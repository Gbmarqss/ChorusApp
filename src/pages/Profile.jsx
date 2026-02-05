import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import { User, Mail, Shield, Briefcase, Save, Edit2, CheckCircle, AlertTriangle } from 'lucide-react';
import { useToast } from '../components/ui/Toast';
import Input from '../components/ui/Input';

export default function Profile() {
    const { user, refreshProfile } = useAuth();
    const toast = useToast();

    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        name: ''
    });

    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || ''
            });
        }
    }, [user]);

    if (!user) return null;

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error('O nome não pode ficar vazio.');
            return;
        }

        setIsSaving(true);
        try {
            const { error } = await supabase
                .from('users')
                .update({ name: formData.name.trim() })
                .eq('id', user.id);

            if (error) throw error;

            await refreshProfile();
            toast.success('Perfil atualizado com sucesso!');
            setIsEditing(false);

        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Erro ao atualizar perfil.');
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up pb-20">
            <h1 className="text-3xl font-bold text-white mb-8">Meu Perfil</h1>

            <div className="bg-[#0f172a] border border-blue-900/30 rounded-3xl p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-blue-900/40 to-indigo-900/40"></div>

                <div className="relative flex flex-col items-center -mt-4 mb-6">
                    <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-3xl font-bold text-white border-4 border-[#0f172a] shadow-lg mb-4">
                        {user.name?.charAt(0).toUpperCase()}
                    </div>
                    
                    {!isEditing ? (
                        <div className="flex items-center gap-2">
                            <h2 className="text-2xl font-bold text-white">{user.name}</h2>
                            <button 
                                onClick={() => setIsEditing(true)}
                                className="p-1.5 text-slate-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            >
                                <Edit2 size={16} />
                            </button>
                        </div>
                    ) : (
                        <div className="w-full max-w-xs animate-fade-in">
                            <Input 
                                value={formData.name}
                                onChange={(e) => setFormData({...formData, name: e.target.value})}
                                placeholder="Seu nome"
                                icon={User}
                            />
                            <div className="flex justify-center gap-3 mt-4">
                                <button 
                                    onClick={() => setIsEditing(false)}
                                    className="px-4 py-2 rounded-lg text-sm font-bold text-slate-400 hover:text-white hover:bg-slate-800"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={handleSave}
                                    disabled={isSaving}
                                    className="px-4 py-2 rounded-lg text-sm font-bold bg-blue-600 text-white hover:bg-blue-500 flex items-center gap-2"
                                >
                                    {isSaving ? 'Salvando...' : <><Save size={16} /> Salvar</>}
                                </button>
                            </div>
                        </div>
                    )}
                    
                    <span className="px-3 py-1 rounded-full bg-blue-900/30 text-blue-300 text-xs font-bold border border-blue-500/30 mt-2 uppercase tracking-wider">
                        {user.role}
                    </span>
                </div>

                <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-[#020617]/50 border border-blue-900/20 flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-blue-900/20 text-blue-400">
                            <Mail size={20} />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-slate-400 font-bold uppercase">Email</p>
                            <p className="text-slate-200">{user.email}</p>
                        </div>
                        <LockInfo />
                    </div>

                    <div className="p-4 rounded-2xl bg-[#020617]/50 border border-blue-900/20 flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-purple-900/20 text-purple-400">
                            <Briefcase size={20} />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-slate-400 font-bold uppercase">Ministério</p>
                            <p className="text-slate-200">{user.ministry?.name || 'Nenhum ministério vinculado'}</p>
                        </div>
                        <LockInfo />
                    </div>

                    <div className="p-4 rounded-2xl bg-[#020617]/50 border border-blue-900/20 flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-emerald-900/20 text-emerald-400">
                            <Shield size={20} />
                        </div>
                        <div className="flex-1">
                            <p className="text-xs text-slate-400 font-bold uppercase">Permissões</p>
                            <p className="text-slate-200">
                                {user.role === 'superadmin' ? 'Acesso Total (SuperAdmin)' :
                                 user.role === 'admin' ? 'Administrador' :
                                 user.role === 'leader' ? 'Líder de Ministério' : 'Membro da Equipe'}
                            </p>
                        </div>
                        <LockInfo />
                    </div>
                </div>
            </div>
        </div>
    );
}

const LockInfo = () => (
    <div className="group relative">
        <div className="p-2 text-slate-600 cursor-help">
            <Shield size={14} />
        </div>
        <div className="absolute right-0 top-full mt-2 w-48 p-2 bg-slate-800 text-xs text-slate-300 rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 border border-slate-700">
            Esta informação só pode ser alterada por um administrador.
        </div>
    </div>
);
