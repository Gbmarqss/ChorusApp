import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { User, Mail, Shield, Briefcase } from 'lucide-react';

export default function Profile() {
    const { user } = useAuth();

    if (!user) return null;

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-fade-in-up">
            <h1 className="text-3xl font-bold text-white mb-8">Meu Perfil</h1>

            <div className="bg-[#0f172a] border border-blue-900/30 rounded-3xl p-8 shadow-xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-blue-900/40 to-indigo-900/40"></div>

                <div className="relative flex flex-col items-center -mt-4 mb-6">
                    <div className="w-24 h-24 rounded-full bg-blue-600 flex items-center justify-center text-3xl font-bold text-white border-4 border-[#0f172a] shadow-lg mb-4">
                        {user.name?.charAt(0).toUpperCase()}
                    </div>
                    <h2 className="text-2xl font-bold text-white">{user.name}</h2>
                    <span className="px-3 py-1 rounded-full bg-blue-900/30 text-blue-300 text-xs font-bold border border-blue-500/30 mt-2 uppercase tracking-wider">
                        {user.role}
                    </span>
                </div>

                <div className="space-y-4">
                    <div className="p-4 rounded-2xl bg-[#020617]/50 border border-blue-900/20 flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-blue-900/20 text-blue-400">
                            <Mail size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-bold uppercase">Email</p>
                            <p className="text-slate-200">{user.email}</p>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#020617]/50 border border-blue-900/20 flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-purple-900/20 text-purple-400">
                            <Briefcase size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-bold uppercase">Ministério</p>
                            <p className="text-slate-200">{user.ministry_id || 'Nenhum ministério vinculado'}</p>
                        </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-[#020617]/50 border border-blue-900/20 flex items-center gap-4">
                        <div className="p-2 rounded-lg bg-emerald-900/20 text-emerald-400">
                            <Shield size={20} />
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 font-bold uppercase">Permissões</p>
                            <p className="text-slate-200">
                                {user.role === 'admin' ? 'Acesso Total (Admin)' :
                                    user.role === 'leader' ? 'Gerenciar Ministério (Líder)' : 'Visualizar Escalas'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
