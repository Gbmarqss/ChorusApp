import React, { useState, useEffect } from 'react';
import { X, Calendar, Copy, MessageSquare, Share2, Plus, Trash2, Link as LinkIcon, ExternalLink, Eye, Check } from 'lucide-react';
import LZString from 'lz-string';
import { MINISTERIOS_DEFAULT } from './logic';

export default function FormsManager({ onClose }) {
    const [dates, setDates] = useState([]);
    const [formLink, setFormLink] = useState("");
    const [customMessage, setCustomMessage] = useState("");
    const [generatedText, setGeneratedText] = useState("");

    // Auto-generate next 4 sundays/weekends on mount
    useEffect(() => {
        const nextDates = [];
        const today = new Date();
        const currentMonth = today.getMonth();
        const nextMonth = (currentMonth + 1) % 12; // 0-11

        // Let's find all Sundays of the next month (or current if early)
        // Simple logic: Next 4 Sundays from today
        let d = new Date();
        d.setDate(d.getDate() + (7 - d.getDay()) % 7); // Next Sunday
        if (d < new Date()) d.setDate(d.getDate() + 7);

        for (let i = 0; i < 5; i++) {
            nextDates.push(new Date(d));
            d.setDate(d.getDate() + 7);
        }

        setDates(nextDates.map(date => ({
            id: date.getTime(),
            value: date.toLocaleDateString('pt-BR'),
            label: "Culto Noturno" // Default label
        })));
    }, []);

    const [configLink, setConfigLink] = useState("");

    // Generate Config Link whenever essential data changes
    useEffect(() => {
        const config = {
            title: "Disponibilidade - Escala",
            description: customMessage || "Por favor, selecione os dias que você poderá servir neste mês.",
            deadline: "Quinta-feira", // Could be dynamic
            dates: dates.map(d => ({ id: d.id, value: d.value, label: d.label })),
            roles: Object.keys(MINISTERIOS_DEFAULT)
        };

        const jsonString = JSON.stringify(config);
        const compressed = LZString.compressToEncodedURIComponent(jsonString);
        // Using window.location.origin implies we rely on the current host.
        // For development it's localhost, for prod it's the vercel url.
        const url = `${window.location.origin}/responder?d=${compressed}`;
        setConfigLink(url);

        // Update WhatsApp text to include this smart link PREFERABLY
        let text = `*Escala de Voluntários - Disponibilidade*\n\n`;
        text += `Olá equipe! Estamos organizando a escala. Por favor, respondam a disponibilidade no link abaixo:\n\n`;
        text += `👉 ${url}\n\n`;

        if (customMessage) {
            text += `⚠ *Aviso:* ${customMessage}\n\n`;
        }

        text += `Obrigado! 🙏`;
        setGeneratedText(text);

    }, [dates, customMessage]);

    const openPreview = () => {
        window.open(configLink, '_blank');
    };

    const handleCopy = () => {
        navigator.clipboard.writeText(generatedText);
        // Toast logic would be parent's responsibility, but we can simulate local feedback button change
    };

    const handleWhatsApp = () => {
        const url = `https://wa.me/?text=${encodeURIComponent(generatedText)}`;
        window.open(url, '_blank');
    };

    const addDate = () => {
        setDates([...dates, { id: Date.now(), value: "", label: "Evento" }]);
    };

    const removeDate = (id) => {
        setDates(dates.filter(d => d.id !== id));
    };

    const updateDate = (id, field, val) => {
        setDates(dates.map(d => d.id === id ? { ...d, [field]: val } : d));
    };

    // Navy Theme Classes
    const bgClass = 'bg-[#0f172a] text-white border border-blue-900/30';
    const inputClass = `w-full p-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-[#020617] border-blue-900/40 text-white placeholder-slate-600`;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl shadow-2xl ${bgClass} overflow-hidden`}>

                {/* Header */}
                <div className="p-6 border-b border-blue-900/30 flex justify-between items-center bg-gradient-to-r from-blue-700 to-indigo-700 text-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                            <MessageSquare size={24} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Solicitar Disponibilidade</h2>
                            <p className="text-blue-100 text-sm opacity-90">Gere uma mensagem formatada para enviar ao grupo</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-6 flex flex-col md:flex-row gap-8">

                    {/* Left: Configuration */}
                    <div className="flex-1 space-y-6">

                        {/* Dates Section */}
                        <div className="space-y-3">
                            <div className="flex justify-between items-center">
                                <label className="text-xs font-bold uppercase tracking-wider opacity-70 text-slate-400">Datas e Eventos</label>
                                <button onClick={addDate} className="text-xs font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 bg-blue-900/20 px-2 py-1 rounded-lg border border-blue-900/50">
                                    <Plus size={12} /> Adicionar Data
                                </button>
                            </div>

                            <div className="space-y-2 max-h-[250px] overflow-y-auto custom-scrollbar pr-1">
                                {dates.map((date, idx) => (
                                    <div key={date.id} className="flex gap-2 items-center animate-fade-in-up" style={{ animationDelay: `${idx * 50}ms` }}>
                                        <div className="bg-blue-900/20 p-2 rounded-lg text-blue-400">
                                            <Calendar size={16} />
                                        </div>
                                        <input
                                            type="text"
                                            value={date.value}
                                            onChange={e => updateDate(date.id, 'value', e.target.value)}
                                            placeholder="DD/MM"
                                            className={`w-24 p-2 text-sm rounded-lg border outline-none focus:ring-1 focus:ring-blue-500 bg-[#020617] border-blue-900/40 text-white text-center`}
                                        />
                                        <input
                                            type="text"
                                            value={date.label}
                                            onChange={e => updateDate(date.id, 'label', e.target.value)}
                                            placeholder="Evento (Ex: Culto)"
                                            className={`flex-1 p-2 text-sm rounded-lg border outline-none focus:ring-1 focus:ring-blue-500 bg-[#020617] border-blue-900/40 text-white`}
                                        />
                                        <button onClick={() => removeDate(date.id)} className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-900/10 rounded-lg transition-colors">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                ))}
                                {dates.length === 0 && <p className="text-center text-sm text-slate-500 py-4 italic">Nenhuma data selecionada.</p>}
                            </div>
                        </div>

                        {/* Link Section - AUTO GENERATED */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider opacity-70 text-slate-400 flex items-center gap-2">
                                <LinkIcon size={12} /> Link Automático
                            </label>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={configLink}
                                    className={`${inputClass} opacity-50 cursor-not-allowed text-xs`}
                                />
                                <button onClick={() => { navigator.clipboard.writeText(configLink); }} className="p-3 rounded-xl bg-blue-900/30 border border-blue-800 text-blue-400 hover:bg-blue-900/50 hover:text-white transition-all" title="Copiar Link">
                                    <Copy size={18} />
                                </button>
                                <button onClick={openPreview} className="p-3 rounded-xl bg-blue-600 border border-blue-500 text-white hover:bg-blue-500 shadow-lg shadow-blue-900/20 active:scale-95 transition-all" title="Testar Formulário">
                                    <Eye size={18} />
                                </button>
                            </div>
                            <p className="text-[10px] text-slate-500">Este link leva os voluntários para uma página exclusiva onde marcarão a disponibilidade.</p>
                        </div>

                        {/* Custom Message */}
                        <div className="space-y-2">
                            <label className="text-xs font-bold uppercase tracking-wider opacity-70 text-slate-400">Mensagem Extra</label>
                            <textarea
                                rows={2}
                                placeholder="Algum aviso importante? Ex: Chegar 30min antes."
                                value={customMessage}
                                onChange={e => setCustomMessage(e.target.value)}
                                className={inputClass}
                            />
                        </div>

                    </div>

                    {/* Right: Preview */}
                    <div className="w-full md:w-[350px] flex flex-col h-full">
                        <label className="text-xs font-bold uppercase tracking-wider opacity-70 text-slate-400 mb-2">Pré-visualização</label>
                        <div className="flex-1 bg-slate-950 rounded-2xl border-4 border-slate-900 p-4 relative shadow-inner overflow-hidden flex flex-col">
                            {/* WhatsApp Fake Header */}
                            <div className="bg-emerald-900/20 -mx-4 -mt-4 p-3 flex items-center gap-3 border-b border-emerald-900/30 mb-4">
                                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center text-white font-bold text-xs">GR</div>
                                <div>
                                    <p className="text-xs font-bold text-emerald-100">Grupo da Mídia</p>
                                    <p className="text-[10px] text-emerald-400/70">Você, Gabriel, Gabi...</p>
                                </div>
                            </div>

                            {/* Message Bubble */}
                            <div className="bg-[#0f172a] rounded-tr-xl rounded-bl-xl rounded-br-xl p-3 border border-blue-900/30 text-sm leading-relaxed text-slate-200 whitespace-pre-wrap shadow-lg">
                                {generatedText}
                                <div className="text-[9px] text-slate-500 text-right mt-1 w-full flex justify-end gap-1">
                                    <span>Agora</span> <span className="text-blue-400">✓✓</span>
                                </div>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-col gap-2 mt-4">
                            <button
                                onClick={handleCopy}
                                className="w-full py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                            >
                                <Copy size={18} /> Copiar Texto
                            </button>
                            <button
                                onClick={handleWhatsApp}
                                className="w-full py-3 rounded-xl font-bold text-emerald-200 bg-emerald-900/30 border border-emerald-800 hover:bg-emerald-900/50 hover:text-white transition-all flex items-center justify-center gap-2"
                            >
                                <Share2 size={18} /> Enviar no WhatsApp
                            </button>
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
