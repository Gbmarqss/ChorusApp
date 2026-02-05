import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, LayoutGrid, Shield, ChevronRight, Bell, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Settings() {
    const navigate = useNavigate();
    const { user, isAdmin } = useAuth();

    if (!isAdmin) return null;

    const SettingItem = ({ icon: Icon, title, description, to, color }) => (
        <button 
            onClick={() => navigate(to)}
            className="w-full bg-[#0f172a] border border-blue-900/30 p-4 rounded-2xl flex items-center justify-between group hover:border-blue-500/50 transition-all active:scale-98"
        >
            <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color} bg-opacity-10 text-white`}>
                    <Icon size={24} className={color.replace('bg-', 'text-')} />
                </div>
                <div className="text-left">
                    <h3 className="font-bold text-white text-lg">{title}</h3>
                    <p className="text-slate-400 text-sm">{description}</p>
                </div>
            </div>
            <ChevronRight className="text-slate-600 group-hover:text-blue-400 transition-colors" />
        </button>
    );

    return (
        <div className="space-y-6 pb-24 animate-fade-in-up">
            <div>
                <h1 className="text-3xl font-bold text-white mb-2">Configurações</h1>
                <p className="text-slate-400">Gerencie o sistema e as permissões.</p>
            </div>

            <div className="space-y-4">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Gestão de Pessoas</h2>
                <SettingItem 
                    icon={Users}
                    title="Equipe"
                    description="Gerenciar usuários, convites e funções."
                    to="/users"
                    color="bg-blue-500"
                />
                <SettingItem 
                    icon={LayoutGrid}
                    title="Ministérios"
                    description="Criar e editar áreas de atuação e cores."
                    to="/ministries"
                    color="bg-purple-500"
                />
            </div>

            <div className="space-y-4 pt-4">
                <h2 className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">Sistema</h2>
                {/* Placeholder para futuras configs */}
                <div className="opacity-50 pointer-events-none grayscale">
                    <SettingItem 
                        icon={Shield}
                        title="Permissões Globais"
                        description="Em breve: Configurar regras de acesso."
                        to="#"
                        color="bg-emerald-500"
                    />
                </div>
                <div className="opacity-50 pointer-events-none grayscale">
                    <SettingItem 
                        icon={Bell}
                        title="Notificações"
                        description="Em breve: Configurar alertas automáticos."
                        to="#"
                        color="bg-amber-500"
                    />
                </div>
            </div>
        </div>
    );
}
