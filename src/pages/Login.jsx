import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, LogIn, AlertCircle, ArrowRight } from 'lucide-react';

export default function Login() {
    const navigate = useNavigate();
    const { signIn } = useAuth();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email || !password) {
            setError('Preencha todos os campos');
            return;
        }

        setLoading(true);

        try {
            await signIn(email, password);
            navigate('/');
        } catch (err) {
            console.error('Login error:', err);
            if (err.message.includes('Invalid login credentials')) {
                setError('Credenciais inválidas. Verifique email e senha.');
            } else {
                setError('Erro ao entrar. Tente novamente.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 relative overflow-hidden">
            {/* Background Decorations */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[100px]"></div>
                <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-emerald-500/5 rounded-full blur-[100px]"></div>
            </div>

            <div className="w-full max-w-md z-10 animate-fade-in-up">

                {/* Brand */}
                <div className="text-center mb-10">
                    <div className="inline-flex items-center justify-center w-24 h-24 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-3xl mb-6 shadow-xl shadow-blue-500/20 overflow-hidden transform hover:scale-105 transition-transform duration-500">
                        <img
                            src="/favicon.jpg"
                            alt="Logo ChorusApp"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                                e.target.parentElement.innerHTML = '<span class="text-4xl text-white">🎵</span>';
                            }}
                        />
                    </div>
                    <h1 className="text-4xl font-bold text-white tracking-tight">ChorusApp</h1>
                    <p className="text-slate-400 mt-2 text-lg">Bem-vindo de volta.</p>
                </div>

                {/* Card */}
                <div className="bg-[#0f172a]/80 backdrop-blur-xl border border-blue-900/30 rounded-3xl p-8 shadow-2xl">

                    {error && (
                        <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 animate-shake">
                            <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={20} />
                            <p className="text-red-400 text-sm font-medium">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2 ml-1">Email Corporativo</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Mail className="text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
                                </div>
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="block w-full pl-12 pr-4 py-4 bg-[#020617] border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="seu@email.com"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <div>
                            <div className="flex justify-between items-center mb-2 ml-1">
                                <label className="block text-xs font-bold text-slate-400 uppercase">Senha</label>
                                <Link to="/forgot-password" className="text-xs text-blue-400 hover:text-blue-300 transition-colors">
                                    Esqueceu a senha?
                                </Link>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                    <Lock className="text-slate-500 group-focus-within:text-blue-500 transition-colors" size={20} />
                                </div>
                                <input
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="block w-full pl-12 pr-4 py-4 bg-[#020617] border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="••••••••"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20 ${loading
                                ? 'bg-slate-700 cursor-not-allowed opacity-70'
                                : 'bg-blue-600 hover:bg-blue-500 transform hover:-translate-y-0.5'
                                }`}
                        >
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <>
                                    Entrar <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 pt-6 border-t border-slate-800 text-center">
                        <p className="text-slate-400 text-sm">
                            Primeiro acesso?{' '}
                            <Link to="/register" className="text-blue-400 hover:text-blue-300 font-bold transition-colors">
                                Ativar Conta (Convite)
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
