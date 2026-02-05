import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, LogIn, AlertCircle, UserPlus } from 'lucide-react';
import Input from '../components/ui/Input';

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
            const result = await signIn(email, password);

            // Verificar se precisa trocar senha
            if (result.mustChangePassword) {
                navigate('/change-password');
            } else {
                navigate('/');
            }
        } catch (err) {
            console.error('Login error:', err);
            if (err.message.includes('Invalid login credentials')) {
                setError('Credenciais inválidas. Verifique email e senha.');
            } else if (err.message.includes('não ativada')) {
                setError(err.message);
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

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <Input
                            label="Email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="seu@email.com"
                            icon={Mail}
                            required
                            disabled={loading}
                        />

                        <Input
                            label="Senha"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Sua senha"
                            icon={Lock}
                            required
                            disabled={loading}
                        />

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 disabled:from-slate-700 disabled:to-slate-600 disabled:cursor-not-allowed text-white font-bold py-4 px-6 rounded-xl transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 flex items-center justify-center gap-2 mt-6"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                    Entrando...
                                </>
                            ) : (
                                <>
                                    <LogIn size={20} />
                                    Entrar
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative my-6">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-slate-700"></div>
                        </div>
                        <div className="relative flex justify-center text-sm">
                            <span className="px-4 bg-[#0f172a] text-slate-400">ou</span>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="mt-6 text-center space-y-4">
                        <Link
                            to="/forgot-password"
                            className="text-sm text-blue-400 hover:text-blue-300 transition-colors block"
                        >
                            Esqueceu sua senha?
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
