import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import LZString from 'lz-string';
import { CheckCircle, Calendar, User, Send, AlertTriangle, MessageSquare, Clock } from 'lucide-react';

export default function PublicForm() {
    const [searchParams] = useSearchParams();
    const [config, setConfig] = useState(null);
    const [answers, setAnswers] = useState({});
    const [userData, setUserData] = useState({ name: '', observation: '' });
    const [submitted, setSubmitted] = useState(false);
    const [generatedResponse, setGeneratedResponse] = useState("");

    useEffect(() => {
        const d = searchParams.get('d');
        if (d) {
            try {
                const decompressed = LZString.decompressFromEncodedURIComponent(d);
                const parsed = JSON.parse(decompressed);
                setConfig(parsed);

                // Initialize answers
                const initialAnswers = {};
                parsed.dates.forEach(date => {
                    initialAnswers[date.id] = 'maybe'; // default loop state check
                });
                // but actually we want explicit choice, so maybe null/undefined
            } catch (e) {
                console.error("Invalid form data", e);
            }
        }
    }, [searchParams]);

    const handleAnswer = (dateId, status) => {
        setAnswers(prev => ({
            ...prev,
            [dateId]: status
        }));
    };

    const handleSubmit = () => {
        if (!userData.name.trim()) return alert("Por favor, digite seu nome.");

        // 1. Save Locally (Simulating DB interaction for specific scenarios)
        const responseData = {
            id: Date.now().toString(),
            name: userData.name,
            email: userData.email,
            phone: userData.phone,
            roles: userData.roles || [],
            answers: answers,
            observation: userData.observation,
            submittedAt: new Date().toISOString()
        };

        // Save to a list in localStorage
        const existing = JSON.parse(localStorage.getItem('chorus_responses') || '[]');
        existing.push(responseData);
        localStorage.setItem('chorus_responses', JSON.stringify(existing));

        // 2. Generate WhatsApp Summary
        let summary = `*Disponibilidade - ${userData.name.trim()}*\n`;
        if (userData.roles && userData.roles.length > 0) summary += `🎭 ${userData.roles.join(', ')}\n`;
        if (userData.phone) summary += `📞 ${userData.phone}\n`;
        if (userData.email) summary += `📧 ${userData.email}\n`;
        summary += `\n`;

        let yesCount = 0;
        config.dates.forEach(d => {
            const status = answers[d.id];
            if (status === 'yes') {
                summary += `✅ ${d.value} (${d.label})\n`;
                yesCount++;
            } else if (status === 'no') {
                summary += `❌ ${d.value}\n`;
            }
        });

        if (userData.observation) {
            summary += `\n📝 Obs: ${userData.observation}`;
        }

        if (yesCount === 0) summary += "\n(Sem disponibilidade para este período)";

        // Append efficient data payload for admin import (Manual "Cloud")
        const payload = LZString.compressToEncodedURIComponent(JSON.stringify(responseData));
        summary += `\n\n🔒 Código de Importação (Não apague):\n${payload}`;

        setGeneratedResponse(summary);
        setSubmitted(true);
    };

    const copyToWhatsApp = () => {
        const url = `https://wa.me/?text=${encodeURIComponent(generatedResponse)}`;
        window.open(url, '_blank');
    };

    if (!config) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center text-slate-500">
                <p>Carregando formulário ou link inválido...</p>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="min-h-screen bg-[#020617] text-white flex items-center justify-center p-4 font-sans">
                <div className="max-w-md w-full bg-[#0f172a] rounded-3xl p-8 border border-blue-900/30 shadow-2xl text-center space-y-6 animate-fade-in-up">
                    <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle size={40} className="text-green-500" />
                    </div>
                    <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-green-400 to-emerald-500">Obrigado!</h2>
                    <p className="text-slate-400 leading-relaxed">
                        Sua disponibilidade foi registrada. Por enquanto, como ainda estamos integrando o sistema, por favor <b>envie o resumo abaixo</b> para o líder no WhatsApp para confirmar.
                    </p>

                    <div className="bg-[#020617] p-4 rounded-xl text-left border border-white/5 text-sm text-slate-300 font-mono whitespace-pre-wrap">
                        {generatedResponse}
                    </div>

                    <button
                        onClick={copyToWhatsApp}
                        className="w-full py-4 rounded-xl font-bold text-white bg-green-600 hover:bg-green-700 shadow-lg shadow-green-900/20 transition-all flex items-center justify-center gap-2 transform active:scale-95"
                    >
                        <MessageSquare size={20} /> Enviar no WhatsApp
                    </button>
                </div>
            </div>
        );
    }

    // Navy Theme Constants
    const cardClass = 'bg-[#0f172a] border border-blue-900/30 rounded-2xl p-5 shadow-lg relative overflow-hidden group';

    return (
        <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-blue-500/30 pb-20">
            {/* Header */}
            <div className="h-48 bg-gradient-to-r from-blue-900 to-indigo-900 relative">
                <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-[#020617] to-transparent h-24"></div>
            </div>

            <div className="max-w-2xl mx-auto px-4 -mt-24 relative z-10 space-y-6">

                {/* Title Card */}
                <div className="bg-[#0f172a] border-t-4 border-blue-500 rounded-2xl p-6 md:p-8 shadow-2xl border-x border-b border-blue-900/30">
                    <h1 className="text-3xl md:text-4xl font-bold mb-2">{config.title || "Disponibilidade da Escala"}</h1>
                    <p className="text-slate-400">{config.description || "Por favor, selecione os dias que você poderá servir."}</p>
                    <div className="mt-4 flex items-center gap-2 text-xs font-bold text-blue-400 uppercase tracking-widest bg-blue-900/20 w-fit px-3 py-1 rounded-full">
                        <Clock size={12} /> Respostas até: {config.deadline || "Domingo"}
                    </div>
                </div>

                {/* Identity Input */}
                <div className={cardClass}>
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600"></div>
                    <label className="block text-sm font-bold text-slate-300 mb-4 uppercase tracking-wide">Seus Dados</label>

                    <div className="space-y-4">
                        <div className="flex items-center gap-3 bg-[#020617] p-1 rounded-xl border border-blue-900/50 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                            <div className="p-2 bg-blue-900/20 rounded-lg">
                                <User size={20} className="text-blue-400" />
                            </div>
                            <input
                                type="text"
                                placeholder="Nome Completo *"
                                className="bg-transparent w-full outline-none text-white placeholder-slate-600 font-medium h-10"
                                value={userData.name}
                                onChange={e => setUserData({ ...userData, name: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex items-center gap-3 bg-[#020617] p-1 rounded-xl border border-blue-900/50 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                                <div className="p-2 bg-blue-900/20 rounded-lg">
                                    <span className="text-blue-400 font-bold text-xs">@</span>
                                </div>
                                <input
                                    type="email"
                                    placeholder="Email (Opcional)"
                                    className="bg-transparent w-full outline-none text-white placeholder-slate-600 font-medium h-10"
                                    value={userData.email || ''}
                                    onChange={e => setUserData({ ...userData, email: e.target.value })}
                                />
                            </div>
                            <div className="flex items-center gap-3 bg-[#020617] p-1 rounded-xl border border-blue-900/50 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                                <div className="p-2 bg-blue-900/20 rounded-lg">
                                    <span className="text-blue-400 font-bold text-xs">#</span>
                                </div>
                                <input
                                    type="tel"
                                    placeholder="Whatsapp (Opcional)"
                                    className="bg-transparent w-full outline-none text-white placeholder-slate-600 font-medium h-10"
                                    value={userData.phone || ''}
                                    onChange={e => setUserData({ ...userData, phone: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>
                    {!userData.name && <p className="text-red-400 text-xs mt-2 pl-1 animate-pulse">* Obrigatório</p>}
                </div>

                {/* Ministry Selection */}
                {config.roles && config.roles.length > 0 && (
                    <div className={cardClass}>
                        <label className="block text-sm font-bold text-slate-300 mb-4 uppercase tracking-wide">Seus Ministérios</label>
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {config.roles.map(role => (
                                <label key={role} className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all ${userData.roles?.includes(role) ? 'bg-blue-900/30 border-blue-500 text-blue-200' : 'border-blue-900/20 text-slate-400 hover:border-blue-500/50 bg-[#020617]'}`}>
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 rounded text-blue-600 focus:ring-blue-500 bg-[#0f172a] border-blue-800"
                                        checked={userData.roles?.includes(role)}
                                        onChange={(e) => {
                                            const currentRoles = userData.roles || [];
                                            if (e.target.checked) {
                                                setUserData({ ...userData, roles: [...currentRoles, role] });
                                            } else {
                                                setUserData({ ...userData, roles: currentRoles.filter(r => r !== role) });
                                            }
                                        }}
                                    />
                                    <span className="text-xs md:text-sm font-bold truncate" title={role}>{role}</span>
                                </label>
                            ))}
                        </div>
                        {(!userData.roles || userData.roles.length === 0) && <p className="text-orange-400 text-xs mt-2 pl-1 flex items-center gap-1"><AlertTriangle size={12} /> Selecione pelo menos um</p>}
                    </div>
                )}

                {/* Dates List */}
                <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-300 uppercase tracking-wide pl-1">Disponibilidade</h3>
                    {config.dates.map(date => {
                        const status = answers[date.id];
                        return (
                            <div key={date.id} className={`${cardClass} transition-colors ${status === 'yes' ? 'border-green-500/50 bg-green-900/5' : status === 'no' ? 'border-red-500/30 opacity-70' : 'hover:border-blue-500/50'}`}>
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                                    <div>
                                        <h3 className="text-xl font-bold text-slate-200">{date.value}</h3>
                                        <span className="text-sm font-medium text-slate-400 bg-slate-800 px-2 py-0.5 rounded text-opacity-80">{date.label}</span>
                                    </div>

                                    <div className="flex gap-2 text-sm font-bold">
                                        <button
                                            onClick={() => handleAnswer(date.id, 'yes')}
                                            className={`flex-1 md:flex-none px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${status === 'yes' ? 'bg-green-600 text-white shadow-lg shadow-green-900/30 scale-105' : 'bg-[#020617] text-slate-400 border border-slate-800 hover:border-green-500 hover:text-green-500'}`}
                                        >
                                            Sim
                                        </button>
                                        <button
                                            onClick={() => handleAnswer(date.id, 'no')}
                                            className={`flex-1 md:flex-none px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition-all ${status === 'no' ? 'bg-red-600/80 text-white shadow-lg shadow-red-900/30' : 'bg-[#020617] text-slate-400 border border-slate-800 hover:border-red-500 hover:text-red-500'}`}
                                        >
                                            Não
                                        </button>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Observation */}
                <div className={cardClass}>
                    <label className="block text-sm font-bold text-slate-300 mb-2 uppercase tracking-wide">Observações</label>
                    <textarea
                        rows={3}
                        placeholder="Alguma restrição de horário? Prefere alguma função específica?"
                        className="w-full bg-[#020617] rounded-xl border border-blue-900/40 p-3 text-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all resize-none"
                        value={userData.observation}
                        onChange={e => setUserData({ ...userData, observation: e.target.value })}
                    ></textarea>
                </div>

                {/* Submit Action */}
                <div className="pt-4 pb-12">
                    <button
                        onClick={handleSubmit}
                        disabled={!userData.name}
                        className={`w-full py-4 rounded-2xl font-bold text-xl shadow-2xl transition-all transform hover:-translate-y-1 active:scale-95 flex items-center justify-center gap-3
                            ${userData.name ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:shadow-blue-900/50' : 'bg-slate-800 text-slate-500 cursor-not-allowed'}
                        `}
                    >
                        Enviar Disponibilidade <Send size={20} />
                    </button>
                    <p className="text-center text-xs text-slate-600 mt-4">
                        Powered by ChorusApp
                    </p>
                </div>

            </div>
        </div>
    );
}
