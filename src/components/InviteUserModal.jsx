import React, { useState } from 'react';
import { X, Mail, User, Shield, Briefcase, Send, Loader2, Copy, CheckCircle, ArrowRight } from 'lucide-react';
import { supabase } from '../supabaseClient';

export default function InviteUserModal({ isOpen, onClose, onSuccess, ministries }) {
    const [email, setEmail] = useState('');
    const [role, setRole] = useState('viewer');
    const [ministryId, setMinistryId] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    // Success State
    const [inviteCreated, setInviteCreated] = useState(false);
    const [copied, setCopied] = useState(false);

    if (!isOpen) return null;

    const handleInvite = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            // 1. Check if already invited
            const { data: existingInvite } = await supabase
                .from('allowed_emails')
                .select('id')
                .eq('email', email)
                .single();

            if (existingInvite) throw new Error('Este email já possui um convite pendente.');

            // 2. Insert Invite
            const { error: insertError } = await supabase
                .from('allowed_emails')
                .insert([{
                    email: email.toLowerCase().trim(),
                    role,
                    ministry_id: ministryId || null
                }]);

            if (insertError) throw insertError;

            // Success! Don't close immediately, show the share link
            setInviteCreated(true);
            onSuccess(); // To refresh the parent list in background
        } catch (err) {
            console.error(err);
            setError(err.message || 'Erro ao enviar convite.');
            setLoading(false);
        }
    };

    const handleCopyLink = () => {
        const link = `${window.location.origin}/register`;
        const text = `Olá! Você foi convidado para acessar o ChorusApp. Crie sua conta aqui: ${link}`;
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleClose = () => {
        // Reset state
        setEmail('');
        setRole('viewer');
        setMinistryId('');
        setInviteCreated(false);
        setLoading(false);
        setError('');
        onClose();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-sm" onClick={handleClose} />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-[#0f172a] border border-blue-900/30 rounded-2xl shadow-2xl animate-fade-in p-6">

                {inviteCreated ? (
                    // Success View
                    <div className="text-center py-4">
                        <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                            <CheckCircle className="text-emerald-500" size={32} />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Convite Criado!</h2>
                        <p className="text-slate-400 mb-6 text-sm">
                            O email <strong>{email}</strong> foi autorizado. <br />
                            O sistema não envia emails automaticamente. <br />
                            <span className="text-yellow-400 font-bold">Envie o link abaixo para o usuário:</span>
                        </p>

                        <div className="bg-[#020617] border border-slate-700 rounded-xl p-4 mb-6 flex items-center justify-between gap-3">
                            <code className="text-blue-400 text-sm truncate">{window.location.origin}/register</code>
                            <button
                                onClick={handleCopyLink}
                                className={`p-2 rounded-lg transition-colors ${copied ? 'bg-emerald-600 text-white' : 'bg-slate-700 text-slate-300 hover:text-white'}`}
                                title="Copiar Link"
                            >
                                {copied ? <CheckCircle size={18} /> : <Copy size={18} />}
                            </button>
                        </div>

                        <button
                            onClick={handleClose}
                            className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all"
                        >
                            Concluir
                        </button>
                    </div>
                ) : (
                    // Form View
                    <>
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-2">
                                <Send className="text-blue-500" size={20} />
                                Convidar Novo Usuário
                            </h2>
                            <button onClick={handleClose} className="text-slate-400 hover:text-white transition-colors">
                                <X size={20} />
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 p-3 bg-red-900/20 border border-red-500/30 rounded-lg text-red-400 text-sm flex items-center gap-2">
                                <span className="font-bold">Error:</span> {error}
                            </div>
                        )}

                        <form onSubmit={handleInvite} className="space-y-4">
                            {/* Email */}
                            <div>
                                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Email</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={e => setEmail(e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 bg-[#020617] border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500 transition-colors"
                                        placeholder="exemplo@igreja.com"
                                        required
                                        autoFocus
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                {/* Role */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Função</label>
                                    <div className="relative">
                                        <Shield className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        <select
                                            value={role}
                                            onChange={e => setRole(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-[#020617] border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500 appearance-none"
                                        >
                                            <option value="viewer">Membro</option>
                                            <option value="leader">Líder</option>
                                            <option value="admin">Admin</option>
                                        </select>
                                    </div>
                                </div>

                                {/* Ministry */}
                                <div>
                                    <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Ministério</label>
                                    <div className="relative">
                                        <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                                        <select
                                            value={ministryId}
                                            onChange={e => setMinistryId(e.target.value)}
                                            className="w-full pl-10 pr-4 py-3 bg-[#020617] border border-slate-800 rounded-xl text-white outline-none focus:border-blue-500 appearance-none"
                                        >
                                            <option value="">Nenhum (Geral)</option>
                                            {ministries.map(m => (
                                                <option key={m.id} value={m.id}>{m.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl flex items-center justify-center gap-2 transition-all mt-6 shadow-lg shadow-blue-900/20"
                            >
                                {loading ? <Loader2 className="animate-spin" /> : <><Send size={18} /> Autorizar Email</>}
                            </button>
                        </form>
                    </>
                )}
            </div>
        </div>
    );
}
