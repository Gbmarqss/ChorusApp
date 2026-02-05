import React, { useState, useEffect } from 'react';
import { Plus, UserPlus, Calendar, Clock, CheckCircle, Share2, LayoutGrid, Users, Shield, Trash2, Edit2, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './supabaseClient';
import { useToast } from './components/ui/Toast';
import Modal from './components/ui/Modal';

// Componentes locais para limpeza
const StatCard = ({ title, value, icon: Icon, colorClass, delay }) => (
    <div className={`bg-[#0f172a] border border-blue-900/30 p-6 rounded-2xl shadow-lg hover:border-blue-500/30 transition-all group animate-fade-in-up`} style={{ animationDelay: delay }}>
        <div className="flex justify-between items-start mb-4">
            <div>
                <p className="text-slate-400 text-xs font-bold uppercase tracking-wider">{title}</p>
                <h3 className="text-3xl font-bold text-white mt-2 group-hover:scale-105 transition-transform origin-left">{value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${colorClass} bg-opacity-10`}>
                <Icon size={24} className={colorClass.replace('bg-', 'text-')} />
            </div>
        </div>
    </div>
);

function Home() {
    const navigate = useNavigate();
    const { user, isAdmin } = useAuth();
    const toast = useToast();

    // Data States
    const [drafts, setDrafts] = useState([]);
    const [published, setPublished] = useState([]);
    const [stats, setStats] = useState({ members: 0, ministries: 0, activeScales: 0 });
    const [loading, setLoading] = useState(true);
    const [nextEvent, setNextEvent] = useState(null);

    // Modal State
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, id: null, title: '', type: '' });

    // Permissões Simplificadas
    const canManage = isAdmin || user?.role === 'leader';
    const canSeeDrafts = canManage;

    useEffect(() => {
        if (user) loadData();
    }, [user]);

    const loadData = async () => {
        try {
            setLoading(true);
            const today = new Date().toISOString().split('T')[0];

            // 1. Carregar Próximo Evento (Lógica Inteligente)
            const { data: nextData } = await supabase
                .from('schedules')
                .select('*')
                .gte('date', today) // Apenas datas futuras ou hoje
                .order('date', { ascending: true }) // O mais próximo primeiro
                .limit(1)
                .single();
            
            setNextEvent(nextData);

            // 2. Carregar Rascunhos (Apenas para Lideres/Admins)
            if (canSeeDrafts) {
                const { data: draftsData } = await supabase
                    .from('pre_schedules')
                    .select('*')
                    .neq('status', 'published')
                    .order('created_at', { ascending: false })
                    .limit(5);
                setDrafts(draftsData || []);
            }

            // 3. Carregar Escalas Publicadas (Todos veem)
            const { data: pubData } = await supabase
                .from('schedules')
                .select('*')
                .order('published_at', { ascending: false })
                .limit(5);
            setPublished(pubData || []);

            // 4. Stats (Apenas Admin)
            if (isAdmin) {
                const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
                const { count: minCount } = await supabase.from('ministries').select('*', { count: 'exact', head: true });
                setStats({
                    members: usersCount || 0,
                    ministries: minCount || 0,
                    activeScales: (pubData?.length || 0)
                });
            }

        } catch (error) {
            console.error('Error loading home data:', error);
            // Ignorar erro se não encontrar próximo evento
            if (error.code !== 'PGRST116') {
                 toast.error('Erro ao carregar dados da home.');
            }
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = async () => {
        const { id, type } = deleteModal;
        const table = type === 'draft' ? 'pre_schedules' : 'schedules';

        try {
            const { error } = await supabase.from(table).delete().eq('id', id);
            if (error) throw error;

            toast.success(type === 'draft' ? 'Rascunho excluído!' : 'Escala excluída!');
            setDeleteModal({ isOpen: false, id: null, title: '', type: '' });
            loadData();
        } catch (error) {
            toast.error('Erro ao excluir: ' + error.message);
        }
    };

    const NextEventCard = ({ event }) => {
        if (!event) return null;
        
        const date = new Date(event.date + 'T12:00:00'); 
        const weekDays = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];
        const dayName = weekDays[date.getDay()];
        const dayNumber = date.getDate();
        const monthName = date.toLocaleString('pt-BR', { month: 'long' });
        
        const isToday = new Date().toDateString() === date.toDateString();

        return (
            <div 
                onClick={() => navigate(`/public/${event.id}`)}
                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 md:p-8 text-white shadow-2xl shadow-blue-900/40 relative overflow-hidden group cursor-pointer animate-fade-in-up"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-16 -mt-32 blur-3xl group-hover:scale-110 transition-transform duration-700"></div>
                
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold mb-3 border border-white/20">
                            <Calendar size={14} />
                            {isToday ? 'HOJE' : 'PRÓXIMO EVENTO'}
                        </div>
                        <h2 className="text-3xl md:text-4xl font-bold mb-2">{dayName}, {dayNumber}</h2>
                        <p className="text-blue-100 text-lg capitalize">{monthName} • {event.title}</p>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        <div className="hidden md:block w-px h-16 bg-white/20"></div>
                        <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-sm border border-white/10 hover:bg-white/20 transition-colors">
                            <ArrowRight size={24} />
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="space-y-10 animate-fade-in-up pb-20">

            {/* 1. Header & Welcome */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-blue-900/30 pb-6">
                <div>
                    <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                        Olá, {user?.name?.split(' ')[0]} 👋
                    </h1>
                    <p className="text-slate-400">
                        {canManage
                            ? "Painel de controle da sua equipe."
                            : "Confira as escalas e seus horários."}
                    </p>
                </div>
                {!canManage && (
                    <div className="px-4 py-2 bg-blue-900/20 border border-blue-500/30 rounded-full text-blue-300 text-sm font-bold flex items-center gap-2">
                        <Users size={16} /> Membro da Equipe
                    </div>
                )}
            </div>

            {/* 2. Next Event Highlight */}
            {nextEvent ? (
                <NextEventCard event={nextEvent} />
            ) : (
                <div className="bg-[#0f172a] border border-blue-900/30 p-8 rounded-3xl text-center">
                    <Calendar size={32} className="mx-auto text-slate-500 mb-2 opacity-50" />
                    <p className="text-slate-400">Nenhum evento futuro encontrado.</p>
                </div>
            )}

            {/* 3. Admin Stats (Mobile Compact) */}
            {isAdmin && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-[#0f172a] border border-blue-900/30 p-4 rounded-2xl">
                        <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Membros</p>
                        <p className="text-2xl font-bold text-white">{stats.members}</p>
                    </div>
                    <div className="bg-[#0f172a] border border-blue-900/30 p-4 rounded-2xl">
                        <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Ministérios</p>
                        <p className="text-2xl font-bold text-white">{stats.ministries}</p>
                    </div>
                    <div className="bg-[#0f172a] border border-blue-900/30 p-4 rounded-2xl col-span-2 md:col-span-1">
                         <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">Escalas</p>
                        <p className="text-2xl font-bold text-white">{stats.activeScales}</p>
                    </div>
                </div>
            )}

            {/* 4. Content Sections */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Section A: Drafts (Only Managers) */}
                {canSeeDrafts && (
                    <div className="space-y-6">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                <span className="p-2 bg-amber-900/20 rounded-lg text-amber-500"><Clock size={20} /></span>
                                Rascunhos Pendentes
                            </h2>
                            {drafts.length > 0 && <span className="text-xs font-bold bg-slate-800 text-slate-300 px-3 py-1 rounded-full">{drafts.length}</span>}
                        </div>

                        {loading ? (
                            <div className="h-40 bg-[#0f172a] rounded-2xl animate-pulse"></div>
                        ) : drafts.length > 0 ? (
                            <div className="space-y-3">
                                {drafts.map(draft => (
                                    <div
                                        key={draft.id}
                                        onClick={() => navigate(`/pre-scale/${draft.id}`)}
                                        className="bg-[#0f172a] border border-blue-900/30 p-5 rounded-2xl flex justify-between items-center group cursor-pointer hover:border-blue-500/50 transition-all"
                                    >
                                        <div>
                                            <h3 className="font-bold text-slate-200 group-hover:text-blue-400 transition-colors">{draft.title}</h3>
                                            <p className="text-xs text-slate-500 mt-1">Criado em {new Date(draft.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-amber-500 bg-amber-900/10 px-2 py-1 rounded border border-amber-500/20">Rascunho</span>
                                            {isAdmin && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setDeleteModal({ isOpen: true, id: draft.id, title: draft.title, type: 'draft' });
                                                    }}
                                                    className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-900/10 rounded-lg transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="bg-[#0f172a] border border-dashed border-slate-800 rounded-2xl p-8 text-center">
                                <p className="text-slate-500">Nenhum rascunho pendente.</p>
                                <button onClick={() => navigate('/wizard')} className="text-blue-400 text-sm font-bold mt-2 hover:underline">Criar nova escala</button>
                            </div>
                        )}
                    </div>
                )}

                {/* Section B: Published Schedules (Everyone) */}
                <div className="space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-bold text-white flex items-center gap-3">
                            <span className="p-2 bg-emerald-900/20 rounded-lg text-emerald-500"><Calendar size={20} /></span>
                            Escalas Ativas
                        </h2>
                    </div>

                    {loading ? (
                        <div className="h-40 bg-[#0f172a] rounded-2xl animate-pulse"></div>
                    ) : published.length > 0 ? (
                        <div className="space-y-3">
                            {published.map(pub => (
                                <div
                                    key={pub.id}
                                    onClick={() => navigate(`/public/${pub.id}`)}
                                    className="bg-[#0f172a] border border-emerald-900/20 p-5 rounded-2xl flex justify-between items-center group cursor-pointer hover:border-emerald-500/40 transition-all"
                                >
                                    <div>
                                        <h3 className="font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">{pub.title}</h3>
                                        <p className="text-xs text-slate-500 mt-1">Publicado em {new Date(pub.published_at).toLocaleDateString()}</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button className="p-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition-colors shadow-lg shadow-blue-900/20">
                                            <Share2 size={16} />
                                        </button>

                                        {isAdmin && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setDeleteModal({ isOpen: true, id: pub.id, title: pub.title, type: 'schedule' });
                                                }}
                                                className="p-2 text-slate-600 hover:text-red-400 hover:bg-red-900/10 rounded-lg transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        )}
                                        
                                         {(isAdmin || user?.role === 'leader') && (
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    navigate(`/schedules/${pub.id}/edit`);
                                                }}
                                                className="p-2 text-slate-600 hover:text-amber-400 hover:bg-amber-900/10 rounded-lg transition-colors"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-[#0f172a] border border-dashed border-slate-800 rounded-2xl p-8 text-center">
                            <p className="text-slate-500">Nenhuma escala publicada no momento.</p>
                        </div>
                    )}
                </div>
            </div>

            {/* DELETE MODAL */}
            <Modal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ ...deleteModal, isOpen: false })}
                onConfirm={handleDelete}
                title={deleteModal.type === 'draft' ? 'Excluir Rascunho' : 'Excluir Escala'}
                message={`Tem certeza que deseja apagar "${deleteModal.title}"?`}
                type="danger"
            />
        </div>
    );
}

export default Home;
