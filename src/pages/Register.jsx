import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Mail, Lock, User, Users, UserPlus, AlertCircle, CheckCircle, ArrowRight } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function Register() {
    const navigate = useNavigate();
    const { signUp } = useAuth();
    const [searchParams] = useSearchParams();

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    // Ministry selection is now guided by invitation, but we keep state for fallback
    const [ministryId, setMinistryId] = useState('');
    const [ministries, setMinistries] = useState([]);

    // UI States
    const [loading, setLoading] = useState(false);
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [inviteData, setInviteData] = useState(null); // Stores data from allowed_emails

    // Token from URL (public invite link)
    const inviteToken = searchParams.get('token');
    const [tokenData, setTokenData] = useState(null);

    useEffect(() => {
        loadMinistries();
        if (inviteToken) {
            validateToken();
        }
    }, [inviteToken]);

    // Check whitelist when email changes (debounce could be better, but onBlur or manual check is fine)
    // Here we check on Submit to be secure.

    const loadMinistries = async () => {
        const { data } = await supabase.from('ministries').select('*').order('name');
        if (data) setMinistries(data);
    };

    const validateToken = async () => {
        try {
            setVerifying(true);
            // Token is the invite ID from allowed_emails table
            const { data, error } = await supabase
                .from('allowed_emails')
                .select('*, ministry:ministries(id, name)')
                .eq('id', inviteToken)
                .single();

            if (error || !data) {
                setError('Link de convite inválido ou expirado.');
                return;
            }

            // Pre-fill email if available
            if (data.email) {
                setEmail(data.email);
            }

            setTokenData(data);
            console.log('[Register] Token validated:', data);
        } catch (err) {
            console.error('[Register] Token validation error:', err);
            setError('Erro ao validar convite.');
        } finally {
            setVerifying(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        // 1. Basic Validation
        if (!name || !email || !password || !confirmPassword) {
            setError('Preencha todos os campos obrigatórios');
            return;
        }

        if (password.length < 6) {
            setError('Senha deve ter no mínimo 6 caracteres');
            return;
        }

        if (password !== confirmPassword) {
            setError('As senhas não conferem');
            return;
        }

        setLoading(true);
        setVerifying(true); // Keep verifying state for UI feedback

        try {
            let roleToAssign = 'viewer';
            let ministryToAssign = null;

            // Scenario A: Invite Link (Token from URL)
            if (inviteToken && tokenData) {
                roleToAssign = tokenData.role;
                ministryToAssign = tokenData.ministry_id;

                // If token has an email, ensure it matches
                if (tokenData.email && tokenData.email.toLowerCase() !== email.trim().toLowerCase()) {
                    throw new Error('O email fornecido não corresponde ao email do convite.');
                }

                console.log('[Register] Using token data:', { role: roleToAssign, ministry: ministryToAssign });
            }
            // Scenario B: Whitelist Check (Standard - no token)
            else {
                const { data: allowedEmail, error: allowedError } = await supabase
                    .from('allowed_emails')
                    .select('*')
                    .eq('email', email.trim().toLowerCase())
                    .single();

                if (allowedError || !allowedEmail) {
                    throw new Error('Email não está na lista de convidados. Solicite acesso ao administrador.');
                }

                roleToAssign = allowedEmail.role;
                ministryToAssign = allowedEmail.ministry_id;
                setInviteData(allowedEmail);

                console.log('[Register] Using whitelist data:', { role: roleToAssign, ministry: ministryToAssign });
            }

            // Signup
            await signUp(email, password, name, ministryToAssign, roleToAssign);

            setSuccess(true);
            setTimeout(() => navigate('/login'), 3000);

        } catch (err) {
            console.error('Register error:', err);
            if (err.message.includes('already registered')) {
                setError('Este email já está cadastrado. Faça login.');
            } else if (err.message.includes('rate limit exceeded')) {
                setError('Muitas tentativas recentes. Aguarde alguns minutos antes de tentar novamente.');
            } else {
                setError(err.message || 'Erro ao criar conta.');
            }
        } finally {
            setLoading(false);
            setVerifying(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6 animate-fade-in">
                <div className="w-full max-w-md text-center">
                    <div className="bg-[#0f172a] border border-emerald-900/50 rounded-2xl p-8 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-emerald-500"></div>
                        <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-6 ring-4 ring-emerald-500/10">
                            <CheckCircle className="text-emerald-500" size={40} />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Conta Criada!</h2>
                        <p className="text-slate-400 mb-6 leading-relaxed">
                            Seu acesso foi validado pelo convite.<br />
                            Verifique seu email para confirmar o cadastro (se necessário).
                        </p>
                        <p className="text-sm text-slate-500 animate-pulse">
                            Redirecionando para login...
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4">
            <div className="w-full max-w-md animate-fade-in-up">

                {/* Header */}
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white tracking-tight mb-2">ChorusApp</h1>
                    <p className="text-slate-500">Cadastro de membros (Apenas Convidados)</p>
                </div>

                {/* Form Card */}
                <div className="bg-[#0f172a] border border-blue-900/30 rounded-2xl p-8 shadow-2xl relative">
                    {/* Error Banner */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-900/20 border border-red-500/30 rounded-xl flex items-start gap-3 animate-shake">
                            <AlertCircle className="text-red-400 shrink-0 mt-0.5" size={20} />
                            <p className="text-red-400 text-sm font-medium">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Name */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Nome Completo</label>
                            <div className="relative group">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                                <input
                                    type="text"
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-[#020617] border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="Seu nome"
                                    disabled={loading}
                                />
                            </div>
                        </div>

                        {/* Email */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Email (Convite)</label>
                            <div className="relative group">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-[#020617] border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                    placeholder="seu@email.com"
                                    disabled={loading}
                                />
                            </div>
                            <p className="text-[10px] text-slate-500 mt-1 ml-1">Use o mesmo email onde recebeu o convite.</p>
                        </div>

                        {/* Password */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Senha</label>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-[#020617] border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="******"
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Confirmar</label>
                                <div className="relative group">
                                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-[#020617] border border-slate-800 rounded-xl text-white placeholder-slate-600 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                        placeholder="******"
                                        disabled={loading}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Ministry Selection (Optional fallback) */}
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Ministério Preferencial</label>
                            <div className="relative group">
                                <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-500 transition-colors" size={18} />
                                <select
                                    value={ministryId}
                                    onChange={(e) => setMinistryId(e.target.value)}
                                    className="w-full pl-10 pr-4 py-3 bg-[#020617] border border-slate-800 rounded-xl text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all appearance-none cursor-pointer"
                                    disabled={loading}
                                >
                                    <option value="">(Automático pelo convite ou selecione)</option>
                                    {ministries.map(ministry => (
                                        <option key={ministry.id} value={ministry.id}>
                                            {ministry.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={loading}
                            className={`w-full py-4 mt-6 rounded-xl font-bold text-white flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-900/20 ${loading
                                ? 'bg-slate-700 cursor-not-allowed opacity-70'
                                : 'bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 transform hover:-translate-y-0.5'
                                }`}
                        >
                            {loading ? (
                                <>
                                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                    {verifying ? 'Verificando convite...' : 'Criando conta...'}
                                </>
                            ) : (
                                <>
                                    Finalizar Cadastro <ArrowRight size={20} />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 text-center border-t border-slate-800 pt-6">
                        <p className="text-slate-400 text-sm">
                            Já tem acesso?{' '}
                            <Link to="/login" className="text-blue-400 hover:text-blue-300 font-bold transition-colors">
                                Fazer Login
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
