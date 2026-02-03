import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Calendar, Search, ArrowRight, Eye, Music2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function History() {
    const navigate = useNavigate();
    const [schedules, setSchedules] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");

    useEffect(() => {
        loadHistory();
    }, []);

    const loadHistory = async () => {
        try {
            const { data, error } = await supabase
                .from('schedules')
                .select('*')
                .eq('status', 'published')
                .order('published_at', { ascending: false });

            if (error) throw error;
            setSchedules(data || []);
        } catch (error) {
            console.error('Error loading history:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredSchedules = schedules.filter(s =>
        s.title?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-8 animate-fade-in-up">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Histórico de Escalas</h1>
                    <p className="text-slate-400 mt-1">Acesse todas as escalas já publicadas</p>
                </div>

                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder="Buscar por nome..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0f172a] border border-blue-900/30 text-white focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-500"
                    />
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center py-20">
                    <div className="animate-spin w-8 h-8 border-4 border-blue-500 rounded-full border-t-transparent"></div>
                </div>
            ) : filteredSchedules.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredSchedules.map(schedule => (
                        <div
                            key={schedule.id}
                            onClick={() => navigate(`/public/${schedule.id}`)}
                            className="bg-[#0f172a] border border-blue-900/30 rounded-2xl p-6 hover:border-blue-500/50 transition-all cursor-pointer group hover:scale-[1.02] hover:shadow-xl hover:shadow-blue-900/10 flex flex-col justify-between h-48"
                        >
                            <div>
                                <div className="flex items-start justify-between mb-4">
                                    <div className="p-3 rounded-lg bg-blue-900/20 text-blue-400 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                        <Calendar size={24} />
                                    </div>
                                    <span className="px-3 py-1 rounded-full bg-emerald-900/20 text-emerald-400 text-xs font-bold border border-emerald-500/20">
                                        PUBLICADA
                                    </span>
                                </div>
                                <h3 className="text-lg font-bold text-white mb-1 line-clamp-2">{schedule.title}</h3>
                                <p className="text-xs text-slate-500">
                                    Publicado em {new Date(schedule.published_at).toLocaleDateString()}
                                </p>
                            </div>

                            <div className="flex items-center justify-between text-sm font-medium pt-4 border-t border-blue-900/10 mt-auto">
                                <span className="text-slate-400 flex items-center gap-2">
                                    <Music2 size={14} /> Oficial
                                </span>
                                <span className="text-blue-400 group-hover:translate-x-1 transition-transform flex items-center gap-1">
                                    Ver escala <ArrowRight size={14} />
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-20 bg-[#0f172a] rounded-3xl border border-blue-900/30 border-dashed">
                    <p className="text-slate-500">Nenhuma escala publicada encontrada.</p>
                </div>
            )}
        </div>
    );
}
