import React, { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User, Key, ArrowRight, CheckCircle } from 'lucide-react';
import Input from '../components/ui/Input';
import { useToast } from '../components/ui/Toast';

/**
 * Página de Primeiro Acesso
 * 
 * Fluxo:
 * 1. Usuário recebe código do admin (CHORUS-XXXXX)
 * 2. Preenche: nome, email, código, senha
 * 3. Sistema valida código + email
 * 4. Cria senha no Supabase Auth
 * 5. Ativa conta (is_active = true)
 * 6. Invalida código
 * 7. Redireciona para login
 */

export default function FirstAccess() {
    const navigate = useNavigate();
    const { activateAccount } = useAuth();
    const toast = useToast();
    const [searchParams] = useSearchParams();

    // Pre-fill email se vier da URL
    const emailFromUrl = searchParams.get('email') || '';

    const [formData, setFormData] = useState({
        name: '',
        email: emailFromUrl,
        code: '',
        password: '',
        confirmPassword: '',
    });

    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});
    const [success, setSuccess] = useState(false);

    const handleChange = (field) => (e) => {
        setFormData(prev => ({ ...prev, [field]: e.target.value }));
        // Limpar erro do campo ao digitar
        if (errors[field]) {
            setErrors(prev => ({ ...prev, [field]: '' }));
        }
    };

    const validate = () => {
        const newErrors = {};

        if (!formData.name.trim()) {
            newErrors.name = 'Nome é obrigatório';
        }

        if (!formData.email.trim()) {
            newErrors.email = 'Email é obrigatório';
        } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
            newErrors.email = 'Email inválido';
        }

        if (!formData.code.trim()) {
            newErrors.code = 'Código é obrigatório';
        } else if (!/^CHORUS-\d{5}$/.test(formData.code.toUpperCase())) {
            newErrors.code = 'Código deve estar no formato CHORUS-12345';
        }

        if (!formData.password) {
            newErrors.password = 'Senha é obrigatória';
        } else if (formData.password.length < 6) {
            newErrors.password = 'Senha deve ter no mínimo 6 caracteres';
        }

        if (formData.password !== formData.confirmPassword) {
            newErrors.confirmPassword = 'As senhas não conferem';
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!validate()) return;

        setLoading(true);

        try {
            await activateAccount(
                formData.email,
                formData.code,
                formData.password,
                formData.name
            );

            setSuccess(true);
            toast.success('Conta ativada com sucesso! Redirecionando...');

            setTimeout(() => {
                navigate('/login');
            }, 2000);

        } catch (error) {
            console.error('Activation error:', error);
            toast.error(error.message || 'Erro ao ativar conta. Verifique os dados e tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
                <div className="bg-[#0f172a] border border-emerald-500/30 rounded-2xl p-8 max-w-md w-full text-center animate-scale-in">
                    <div className="mb-6">
                        <CheckCircle size={64} className="text-emerald-400 mx-auto" />
                    </div>
                    <h2 className="text-2xl font-bold text-white mb-2">Conta Ativada!</h2>
                    <p className="text-slate-300">Redirecionando para o login...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-slate-900 flex items-center justify-center p-4">
            <div className="bg-[#0f172a] border border-blue-900/30 rounded-2xl p-8 max-w-md w-full shadow-2xl">
                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Primeiro Acesso</h1>
                    <p className="text-slate-400">Ative sua conta usando o código recebido</p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <Input
                        label="Nome Completo"
                        type="text"
                        value={formData.name}
                        onChange={handleChange('name')}
                        placeholder="Seu nome"
                        icon={User}
                        error={errors.name}
                        required
                        disabled={loading}
                    />

                    <Input
                        label="Email"
                        type="email"
                        value={formData.email}
                        onChange={handleChange('email')}
                        placeholder="seu@email.com"
                        icon={Mail}
                        error={errors.email}
                        required
                        disabled={loading}
                    />

                    <Input
                        label="Código de Ativação"
                        type="text"
                        value={formData.code}
                        onChange={handleChange('code')}
                        placeholder="CHORUS-12345"
                        icon={Key}
                        error={errors.code}
                        required
                        disabled={loading}
                        className="uppercase"
                    />

                    <Input
                        label="Nova Senha"
                        type="password"
                        value={formData.password}
                        onChange={handleChange('password')}
                        placeholder="Mínimo 6 caracteres"
                        icon={Lock}
                        error={errors.password}
                        required
                        disabled={loading}
                    />

                    <Input
                        label="Confirmar Senha"
                        type="password"
                        value={formData.confirmPassword}
                        onChange={handleChange('confirmPassword')}
                        placeholder="Digite a senha novamente"
                        icon={Lock}
                        error={errors.confirmPassword}
                        required
                        disabled={loading}
                    />

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-bold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 mt-6"
                    >
                        {loading ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                                Ativando...
                            </>
                        ) : (
                            <>
                                Ativar Conta
                                <ArrowRight size={20} />
                            </>
                        )}
                    </button>
                </form>

                {/* Footer */}
                <div className="mt-6 text-center">
                    <p className="text-slate-400 text-sm">
                        Já tem uma conta ativa?{' '}
                        <Link to="/login" className="text-blue-400 hover:text-blue-300 font-medium">
                            Fazer login
                        </Link>
                    </p>
                </div>

                {/* Info */}
                <div className="mt-6 p-4 bg-blue-900/20 border border-blue-500/20 rounded-lg">
                    <p className="text-xs text-blue-200">
                        💡 <strong>Dica:</strong> O código de ativação foi enviado pelo administrador.
                        Se não recebeu, entre em contato com a equipe.
                    </p>
                </div>
            </div>
        </div>
    );
}
