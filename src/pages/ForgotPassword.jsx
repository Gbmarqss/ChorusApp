import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, ArrowLeft, AlertCircle, CheckCircle } from 'lucide-react';

export default function ForgotPassword() {
    const { resetPassword } = useAuth();

    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        if (!email) {
            setError('Digite seu email');
            return;
        }

        setLoading(true);

        try {
            await resetPassword(email);
            setSuccess(true);
        } catch (err) {
            console.error('Reset password error:', err);
            setError('Erro ao enviar email de recuperação. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
                <div className="w-full max-w-md">
                    <div className="bg-[#0f172a] border border-green-900/30 rounded-2xl p-8 shadow-2xl">
                        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="text-green-400" size={32} />
                        </div>

                        <h2 className="text-2xl font-bold text-white text-center mb-4">
                            Email Enviado!
                        </h2>

                        <p className="text-gray-400 text-center mb-8">
                            Enviamos um link de recuperação para <strong className="text-white">{email}</strong>.
                            Verifique sua caixa de entrada e spam.
                        </p>

                        <Link
                            to="/login"
                            className="block w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition-colors text-center"
                        >
                            Voltar para o Login
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
            <div className="w-full max-w-md">
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center gap-3 mb-4">
                        <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                            <span className="text-2xl">🎵</span>
                        </div>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">ChorusApp</h1>
                    <p className="text-gray-400">Recuperação de senha</p>
                </div>

                {/* Reset Password Card */}
                <div className="bg-[#0f172a] border border-blue-900/30 rounded-2xl p-8 shadow-2xl">
                    <h2 className="text-2xl font-bold text-white mb-2">Esqueceu a senha?</h2>
                    <p className="text-gray-400 text-sm mb-6">
                        Digite seu email para receber um link de recuperação
                    </p>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-900/20 border border-red-500/50 rounded-lg flex items-start gap-3">
                            <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={20} />
                            <p className="text-red-400 text-sm">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-6">
                        {/* Email */}
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">
                                Email
                            </label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={20} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-11 pr-4 py-3 bg-[#020617] border border-blue-900/30 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 transition-colors"
                                    placeholder="seu@email.com"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <Mail size={20} />
                                    Enviar Link de Recuperação
                                </>
                            )}
                        </button>
                    </form>

                    {/* Back to Login */}
                    <div className="mt-6">
                        <Link
                            to="/login"
                            className="flex items-center justify-center gap-2 text-gray-400 hover:text-white text-sm transition-colors"
                        >
                            <ArrowLeft size={16} />
                            Voltar para o login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
