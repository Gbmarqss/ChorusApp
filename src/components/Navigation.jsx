import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Clock, Settings, User, LogOut, Music2, PlusCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Navigation() {
    const location = useLocation();
    const navigate = useNavigate();
    const { user, signOut, isAdmin } = useAuth();

    const isActive = (path) => location.pathname === path;

    const handleLogout = async () => {
        await signOut();
        navigate('/login');
    };

    const NavItem = ({ to, icon: Icon, label, mobileOnly = false, desktopOnly = false }) => (
        <Link
            to={to}
            className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                ${mobileOnly ? 'md:hidden flex-col gap-1 text-[10px] px-2 py-2' : ''}
                ${desktopOnly ? 'hidden md:flex' : ''}
                ${isActive(to) 
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/20' 
                    : 'text-slate-400 hover:text-white hover:bg-white/5'}
            `}
        >
            <Icon size={mobileOnly ? 24 : 20} />
            <span className={mobileOnly ? 'font-medium' : 'font-semibold'}>{label}</span>
        </Link>
    );

    return (
        <>
            {/* DESKTOP SIDEBAR */}
            <aside className="hidden md:flex fixed left-0 top-0 h-screen w-64 bg-[#0f172a] border-r border-blue-900/30 flex-col z-50">
                <div className="p-6">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-blue-600/20">
                            <Music2 className="text-white" size={24} />
                        </div>
                        <span className="text-xl font-bold text-white tracking-tight">ChorusApp</span>
                    </div>

                    <div className="space-y-2">
                        <NavItem to="/" icon={Home} label="Início" />
                        <NavItem to="/historico" icon={Clock} label="Histórico" />
                        {isAdmin && <NavItem to="/settings" icon={Settings} label="Configurações" />}
                    </div>
                </div>

                <div className="mt-auto p-6 border-t border-blue-900/30">
                    <Link to="/profile" className="flex items-center gap-3 mb-4 p-2 rounded-xl hover:bg-white/5 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-indigo-500 flex items-center justify-center text-white font-bold">
                            {user?.name?.charAt(0)}
                        </div>
                        <div className="flex-1 overflow-hidden">
                            <p className="text-sm font-bold text-white truncate">{user?.name?.split(' ')[0]}</p>
                            <p className="text-xs text-slate-400 truncate capitalize">{user?.role}</p>
                        </div>
                    </Link>
                    <button 
                        onClick={handleLogout}
                        className="w-full flex items-center gap-2 text-slate-400 hover:text-red-400 transition-colors p-2 text-sm font-medium"
                    >
                        <LogOut size={18} /> Sair
                    </button>
                </div>
            </aside>

            {/* MOBILE BOTTOM NAV */}
            <nav className="md:hidden fixed bottom-0 left-0 w-full bg-[#0f172a]/95 backdrop-blur-lg border-t border-blue-900/30 z-50 pb-safe">
                <div className="flex justify-around items-center px-2 py-2">
                    <NavItem to="/" icon={Home} label="Início" mobileOnly />
                    <NavItem to="/historico" icon={Clock} label="Histórico" mobileOnly />
                    
                    {/* Botão Central de Ação (Mobile) */}
                    {isAdmin && (
                        <div className="relative -top-5">
                            <Link to="/wizard" className="w-14 h-14 bg-blue-600 rounded-full flex items-center justify-center text-white shadow-lg shadow-blue-600/40 border-4 border-[#020617]">
                                <PlusCircle size={28} />
                            </Link>
                        </div>
                    )}

                    {isAdmin ? (
                        <NavItem to="/settings" icon={Settings} label="Config" mobileOnly />
                    ) : (
                         <div className="w-12"></div> // Espaçador se não for admin
                    )}
                    
                    <NavItem to="/profile" icon={User} label="Perfil" mobileOnly />
                </div>
            </nav>
        </>
    );
}