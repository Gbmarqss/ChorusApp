// Cleaned file content
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { Calendar, Printer, Share2, AlertTriangle, Music2, ArrowRightLeft, Clock, MapPin } from 'lucide-react';

export default function PublicScheduleView() {
    const { id } = useParams();
    const [schedule, setSchedule] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        loadSchedule();
    }, [id]);

    const loadSchedule = async () => {
        try {
            const { data, error } = await supabase
                .from('schedules')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setSchedule(data);
        } catch (err) {
            console.error('Error loading schedule:', err);
            setError('Escala não encontrada ou não publicada.');
        } finally {
            setLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleShare = () => {
        navigator.clipboard.writeText(window.location.href);
        // Simple visual feedback could be added here
        const btn = document.getElementById('share-btn');
        if (btn) {
            const originalText = btn.innerHTML;
            btn.innerHTML = '<span class="text-emerald-400">Copiado!</span>';
            setTimeout(() => btn.innerHTML = originalText, 2000);
        }
    };

    if (loading) return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center">
            <div className="animate-spin w-12 h-12 border-4 border-blue-500 rounded-full border-t-transparent shadow-lg shadow-blue-500/20"></div>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-6">
            <div className="text-center max-w-md w-full bg-[#0f172a] p-10 rounded-3xl border border-red-900/30 shadow-2xl">
                <div className="w-20 h-20 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-6">
                    <AlertTriangle size={40} className="text-red-500" />
                </div>
                <h2 className="text-3xl font-bold text-white mb-3">Ops!</h2>
                <p className="text-slate-400 text-lg leading-relaxed">{error}</p>
            </div>
        </div>
    );

    // Grouping logic
    const groupedData = schedule.data.reduce((acc, item) => {
        if (!acc[item.Data]) acc[item.Data] = [];
        acc[item.Data].push(item);
        return acc;
    }, {});

    return (
        <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-blue-500/30 print:bg-white print:text-black">

            {/* --- HERO HEADER --- */}
            <div className="relative bg-[#0f172a] border-b border-blue-900/30 overflow-hidden print:hidden">
                {/* Background Decor */}
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden opacity-20 pointer-events-none">
                    <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-600 rounded-full blur-3xl mix-blend-screen animate-pulse"></div>
                    <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-purple-600 rounded-full blur-3xl mix-blend-screen opacity-50"></div>
                </div>

                <div className="max-w-7xl mx-auto px-6 py-12 relative z-10">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex items-center gap-6">
                            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-900/50 transform rotate-3">
                                <Music2 className="text-white drop-shadow-md" size={40} />
                            </div>
                            <div>
                                <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-slate-400 mb-2">
                                    {schedule.title}
                                </h1>
                                <div className="flex items-center gap-4 text-slate-400 text-sm md:text-base font-medium">
                                    <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-900/20 border border-blue-500/20 text-blue-300">
                                        <Clock size={14} /> Publicado em {new Date(schedule.published_at).toLocaleDateString()}
                                    </span>
                                    <span className="hidden md:flex items-center gap-1.5">
                                        <MapPin size={14} /> ChorusApp Oficial
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <button
                                id="share-btn"
                                onClick={handleShare}
                                className="flex-1 md:flex-none py-3 px-6 rounded-xl bg-[#1e293b] hover:bg-[#334155] text-slate-200 font-bold transition-all border border-slate-700 flex items-center justify-center gap-2 group"
                            >
                                <Share2 size={18} className="group-hover:scale-110 transition-transform" />
                            </button>
                            <button
                                onClick={handlePrint}
                                className="flex-1 md:flex-none py-3 px-8 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-lg shadow-blue-900/30 hover:scale-105 flex items-center justify-center gap-2"
                            >
                                <Printer size={18} /> Imprimir Escala
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* --- PRINT HEADER (Only visible when printing) --- */}
            <div className="hidden print:block text-center py-8 border-b-2 border-slate-300 mb-8">
                <h1 className="text-4xl font-bold text-black mb-2">{schedule.title}</h1>
                <p className="text-slate-600 text-lg">Escala Oficial gerada pelo ChorusApp</p>
                <p className="text-sm text-slate-500 mt-2">Atualizado em: {new Date().toLocaleDateString()}</p>
            </div>

            {/* --- CONTENT GRID --- */}
            <div className="max-w-7xl mx-auto px-6 py-12">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-min">
                    {Object.keys(groupedData).map((date, index) => (
                        <div
                            key={date}
                            className="group break-inside-avoid bg-[#1e293b]/50 backdrop-blur-sm border border-slate-800 rounded-3xl overflow-hidden hover:border-blue-500/30 transition-all hover:shadow-2xl hover:shadow-blue-900/10 hover:-translate-y-1 print:bg-white print:border-2 print:border-slate-300 print:shadow-none"
                            style={{ animationDelay: `${index * 50}ms` }}
                        >
                            {/* Card Header */}
                            <div className="p-5 bg-gradient-to-r from-blue-900/20 to-indigo-900/20 border-b border-slate-800 flex items-center gap-3 print:bg-slate-100 print:border-slate-300">
                                <div className="w-10 h-10 rounded-xl bg-[#0f172a] border border-blue-500/30 flex items-center justify-center text-blue-400 font-bold shadow-inner print:bg-white print:border-slate-400 print:text-black">
                                    <Calendar size={18} />
                                </div>
                                <h3 className="font-bold text-lg text-white uppercase tracking-wide print:text-black">{date}</h3>
                            </div>

                            {/* Card Body */}
                            <div className="divide-y divide-slate-800/50 print:divide-slate-200">
                                {groupedData[date].map((slot, idx) => {
                                    // Check substitution
                                    const isSubstituted = slot.original_volunteer && slot.original_volunteer !== slot.Voluntario;

                                    return (
                                        <div key={idx} className="p-5 flex items-start justify-between hover:bg-white/5 transition-colors print:p-3">
                                            <div className="flex-1">
                                                <p className="text-[10px] font-bold text-blue-400 uppercase tracking-wider mb-1 print:text-slate-600">{slot.Funcao}</p>

                                                <div className="flex items-center gap-2">
                                                    <p className="font-bold text-lg text-slate-100 print:text-black leading-tight">
                                                        {slot.Voluntario}
                                                    </p>
                                                    {isSubstituted && (
                                                        <div className="relative group/tooltip">
                                                            <ArrowRightLeft size={14} className="text-amber-400 animate-pulse" />
                                                            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-amber-900 text-amber-100 text-xs rounded whitespace-nowrap opacity-0 group-hover/tooltip:opacity-100 transition-opacity pointer-events-none print:hidden">
                                                                Substituiu {slot.original_volunteer}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Logic to show original if substituted (print friendly text) */}
                                                {isSubstituted && (
                                                    <p className="text-[10px] text-amber-500/80 mt-0.5 hidden print:block">
                                                        (Substituiu {slot.original_volunteer})
                                                    </p>
                                                )}
                                            </div>

                                            <div className="ml-4">
                                                <span className="px-2.5 py-1 rounded-lg bg-[#0f172a] border border-slate-700 text-[10px] font-bold text-slate-400 uppercase print:bg-slate-100 print:text-slate-700 print:border-slate-300">
                                                    {slot.AreaOriginal || 'Geral'}
                                                </span>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* --- FOOTER --- */}
            <footer className="text-center py-12 border-t border-slate-800 mt-12 bg-[#020617] print:hidden">
                <p className="text-slate-500 text-sm font-medium">
                    ChorusApp &copy; {new Date().getFullYear()} &bull; Gestão Inteligente para Ministérios
                </p>
            </footer>
        </div>
    );
}
