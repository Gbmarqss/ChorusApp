import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../supabaseClient';
import { Lock, Eye, EyeOff, CheckCircle } from 'lucide-react';
import { useToast } from '../components/ui/Toast';

const ChangePassword = () => {
    const navigate = useNavigate();
    const { user, refreshProfile } = useAuth();
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const [formData, setFormData] = useState({
        newPassword: '',
        confirmPassword: ''
    });

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.newPassword !== formData.confirmPassword) {
            toast.error('As senhas não coincidem');
            return;
        }

        if (formData.newPassword.length < 8) {
            toast.error('A senha deve ter no mínimo 8 caracteres');
            return;
        }

        setLoading(true);

        try {
            // 1. Atualizar senha no Supabase Auth
            const { error: authError } = await supabase.auth.updateUser({
                password: formData.newPassword
            });

            if (authError) throw authError;

            // 2. Atualizar flag must_change_password na tabela users
            const { error: updateError } = await supabase
                .from('users')
                .update({
                    must_change_password: false,
                    password_changed_at: new Date().toISOString()
                })
                .eq('id', user.id);

            if (updateError) throw updateError;

            await refreshProfile();
            toast.success('Senha alterada com sucesso!');
            navigate('/');

        } catch (error) {
            console.error('Error changing password:', error);
            toast.error(`Erro ao alterar senha: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-slate-900 flex items-center justify-center p-4">
            <div className="w-full max-w-md">
                <div className="bg-slate-900/50 backdrop-blur-xl border border-blue-500/20 rounded-2xl shadow-2xl p-8">
                    <div className="text-center mb-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-500/10 rounded-full mb-4">
                            <Lock className="w-8 h-8 text-blue-400" />
                        </div>
                        <h1 className="text-3xl font-bold text-white mb-2">Alterar Senha</h1>
                        <p className="text-slate-400">
                            Por segurança, você precisa alterar sua senha temporária
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Nova Senha
                            </label>
                            <div className="relative">
                                <input
                                    type={showPassword ? 'text' : 'password'}
                                    value={formData.newPassword}
                                    onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all pr-12"
                                    placeholder="Mínimo 8 caracteres"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                                >
                                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Confirmar Nova Senha
                            </label>
                            <div className="relative">
                                <input
                                    type={showConfirm ? 'text' : 'password'}
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 outline-none transition-all pr-12"
                                    placeholder="Digite a senha novamente"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm(!showConfirm)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                                >
                                    {showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
                                </button>
                            </div>
                        </div>

                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                            <p className="text-sm text-blue-300 flex items-start gap-2">
                                <CheckCircle size={16} className="mt-0.5 flex-shrink-0" />
                                <span>A senha deve ter no mínimo 8 caracteres</span>
                            </p>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-200 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Alterando...' : 'Alterar Senha'}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default ChangePassword;
