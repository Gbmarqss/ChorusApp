import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Music2, Home, Calendar, Users, LogOut, User, Menu, X, Clock, LayoutGrid } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export default function Navigation() {
    const navigate = useNavigate();
    const location = useLocation();
    const { user, signOut } = useAuth();
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleLogout = async () => {
        try {
            await signOut();
            navigate('/login');
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const isActive = (path) => location.pathname === path;
    const closeMenu = () => setIsMenuOpen(false);

    return (
        <nav className="sticky top-0 z-50 bg-[#0f172a]/95 backdrop-blur-md border-b border-blue-900/30 shadow-lg">
            <div className="max-w-7xl mx-auto px-4 md:px-6">
                <div className="flex items-center justify-between h-16">
                    {/* Logo & Brand */}
                    <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity" onClick={closeMenu}>
                        <img
                            src="/favicon.jpg"
                            alt="Logo"
                            className="w-10 h-10 rounded-lg object-cover border border-blue-500/30"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                            }}
                        />
                        {/* Fallback Icon if image fails */}
                        <div className="w-10 h-10 bg-blue-600 rounded-lg hidden items-center justify-center">
                            <Music2 size={24} className="text-white" />
                        </div>
                        <span className="text-xl font-bold text-white tracking-tight">ChorusApp</span>
                    </Link>

                    {/* Desktop Menu */}
                    <div className="hidden md:flex items-center gap-2">
                        <Link
                            to="/"
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${isActive('/') ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <Home size={18} />
                            Home
                        </Link>

                        <Link
                            to="/historico"
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${isActive('/historico') ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                        >
                            <Clock size={18} />
                            Histórico
                        </Link>

                        {user?.role === 'admin' && (
                            <>
                                <Link
                                    to="/users"
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${isActive('/users') ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <Users size={18} />
                                    Equipe
                                </Link>
                                <Link
                                    to="/ministries"
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${isActive('/ministries') ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
                                >
                                    <LayoutGrid size={18} />
                                    Ministérios
                                </Link>
                            </>
                        )}
                    </div>

                    {/* User Actions (Desktop) */}
                    <div className="hidden md:flex items-center gap-3 ml-4">
                        {user && (
                            <>
                                <Link
                                    to="/profile"
                                    className={`flex items-center gap-3 px-3 py-2 rounded-xl transition-all ${isActive('/profile') ? 'bg-slate-800 text-white' : 'hover:bg-slate-800 text-slate-400 hover:text-white'}`}
                                >
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
                                        {user.name?.charAt(0)}
                                    </div>
                                    <div className="text-sm">
                                        <p className="font-bold leading-none">{user.name?.split(' ')[0]}</p>
                                        <p className="text-[10px] opacity-60 uppercase">{user.role}</p>
                                    </div>
                                </Link>

                                <button
                                    onClick={handleLogout}
                                    className="p-2.5 rounded-xl hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition-colors border border-transparent hover:border-red-500/20"
                                    title="Sair"
                                >
                                    <LogOut size={20} />
                                </button>
                            </>
                        )}
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        className="md:hidden p-2 text-slate-400 hover:text-white transition-colors"
                        onClick={() => setIsMenuOpen(!isMenuOpen)}
                    >
                        {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Menu Dropdown */}
            {isMenuOpen && (
                <div className="md:hidden bg-[#0f172a] border-t border-blue-900/30 animate-slide-in">
                    <div className="px-4 py-4 space-y-2">
                        <Link
                            to="/"
                            onClick={closeMenu}
                            className={`block p-3 rounded-xl transition-colors flex items-center gap-3 ${isActive('/') ? 'bg-blue-900/20 text-blue-400 font-bold' : 'text-slate-400 hover:bg-white/5'}`}
                        >
                            <Home size={20} /> Home
                        </Link>

                        <Link
                            to="/historico"
                            onClick={closeMenu}
                            className={`block p-3 rounded-xl transition-colors flex items-center gap-3 ${isActive('/historico') ? 'bg-blue-900/20 text-blue-400 font-bold' : 'text-slate-400 hover:bg-white/5'}`}
                        >
                            <Clock size={20} /> Histórico
                        </Link>

                        {user?.role === 'admin' && (
                            <>
                                <Link
                                    to="/users"
                                    onClick={closeMenu}
                                    className={`block p-3 rounded-xl transition-colors flex items-center gap-3 ${isActive('/users') ? 'bg-blue-900/20 text-blue-400 font-bold' : 'text-slate-400 hover:bg-white/5'}`}
                                >
                                    <Users size={20} /> Equipe
                                </Link>
                                <Link
                                    to="/ministries"
                                    onClick={closeMenu}
                                    className={`block p-3 rounded-xl transition-colors flex items-center gap-3 ${isActive('/ministries') ? 'bg-blue-900/20 text-blue-400 font-bold' : 'text-slate-400 hover:bg-white/5'}`}
                                >
                                    <LayoutGrid size={20} /> Ministérios
                                </Link>
                            </>
                        )}

                        <div className="h-px bg-blue-900/30 my-2"></div>

                        <Link
                            to="/profile"
                            onClick={closeMenu}
                            className={`block p-3 rounded-xl transition-colors flex items-center gap-3 ${isActive('/profile') ? 'bg-blue-900/20 text-blue-400 font-bold' : 'text-slate-400 hover:bg-white/5'}`}
                        >
                            <User size={20} /> Meu Perfil ({user?.name?.split(' ')[0]})
                        </Link>

                        <button
                            onClick={() => { handleLogout(); closeMenu(); }}
                            className="w-full text-left p-3 rounded-xl transition-colors flex items-center gap-3 text-red-400 hover:bg-red-900/10"
                        >
                            <LogOut size={20} /> Sair
                        </button>
                    </div>
                </div>
            )}
        </nav>
    );
}
