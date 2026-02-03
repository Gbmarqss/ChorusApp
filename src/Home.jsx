import React, { useState, useEffect } from 'react';
import { Upload, FileSpreadsheet, Download, Share2, AlertTriangle, Moon, Sun, Search, Calendar, CheckCircle, XCircle, Lock, Flame, Filter, Menu, Link, Plus, X, Users, UserPlus, GitBranch, LayoutGrid, Clock, Settings, Shield, Trash2, ArrowRight, BarChart3, PieChart, Activity, Edit2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import { supabase } from './supabaseClient';
import ConfirmModal from './components/ConfirmModal';

// Toast Component Local (simplified for Home)
const Toast = ({ message, type = 'success', onClose }) => (
    <div className={`fixed bottom-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in ${type === 'error' ? 'bg-red-900 border border-red-500 text-white' : 'bg-emerald-900 border border-emerald-500 text-white'
        }`}>
        {type === 'error' ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
        <p className="font-bold">{message}</p>
        <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100"><X size={16} /></button>
    </div>
);

// Stat Card Component
const StatCard = ({ title, value, icon: Icon, colorClass, delay }) => (
    <div className={`bg-[#0f172a] border border-blue-900/30 p-6 rounded-2xl shadow-lg hover:border-blue-500/30 transition-all group animate-fade-in-up`} style={{ animationDelay: delay }}>
        <div className="flex justify-between items-start mb-4">
            <div>
                <p className="text-slate-400 text-sm font-bold uppercase tracking-wider">{title}</p>
                <h3 className="text-3xl font-bold text-white mt-1 group-hover:scale-105 transition-transform origin-left">{value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${colorClass} bg-opacity-20`}>
                <Icon size={24} className={colorClass.replace('bg-', 'text-')} />
            </div>
        </div>
    </div>
);

// Big Action Card Implementation
const ActionCard = ({ title, description, icon: Icon, onClick, color = 'blue' }) => {
    const colorStyles = {
        blue: 'bg-blue-600 hover:bg-blue-500 from-blue-600 to-blue-500',
        emerald: 'bg-emerald-600 hover:bg-emerald-500 from-emerald-600 to-emerald-500',
        purple: 'bg-purple-600 hover:bg-purple-500 from-purple-600 to-purple-500',
        amber: 'bg-amber-600 hover:bg-amber-500 from-amber-600 to-amber-500'
    };

    return (
        <button
            onClick={onClick}
            className={`w-full text-left p-6 rounded-3xl relative overflow-hidden group transition-all hover:-translate-y-1 shadow-xl hover:shadow-2xl`}
        >
            <div className={`absolute inset-0 bg-gradient-to-br ${colorStyles[color]} opacity-90 group-hover:opacity-100 transition-opacity`}></div>
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -mr-16 -mt-16 blur-2xl group-hover:scale-150 transition-transform duration-700"></div>

            <div className="relative z-10 text-white">
                <div className="w-12 h-12 bg-white/20 rounded-2xl flex items-center justify-center mb-4 backdrop-blur-sm group-hover:rotate-12 transition-transform duration-300">
                    <Icon size={24} />
                </div>
                <h3 className="text-xl font-bold mb-1">{title}</h3>
                <p className="text-white/80 text-sm">{description}</p>
            </div>
        </button>
    );
};

function Home() {
    const navigate = useNavigate();
    const { user, isAdmin } = useAuth();
    const [drafts, setDrafts] = useState([]);
    const [published, setPublished] = useState([]);
    const [stats, setStats] = useState({ members: 0, ministries: 0, activeScales: 0 }); // Mock stats or real
    const [loading, setLoading] = useState(true);

    // UI States
    const [toast, setToast] = useState(null);
    const [modal, setModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => { } });

    useEffect(() => {
        loadData();
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const loadData = async () => {
        try {
            // Load Drafts (Pre-Schedules)
            const { data: draftsData } = await supabase
                .from('pre_schedules')
                .select('*')
                .neq('status', 'published') // Only non-published
                .order('created_at', { ascending: false })
                .limit(5);

            // Load Published (Schedules)
            const { data: pubData } = await supabase
                .from('schedules')
                .select('*')
                .order('published_at', { ascending: false })
                .limit(5);

            // Load Stats (Parallel)
            const { count: usersCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
            const { count: minCount } = await supabase.from('ministries').select('*', { count: 'exact', head: true });

            setDrafts(draftsData || []);
            setPublished(pubData || []);
            setStats({
                members: usersCount || 0,
                ministries: minCount || 0,
                activeScales: (draftsData?.length || 0) + (pubData?.length || 0) // Approximation
            });

        } catch (error) {
            console.error('Error loading home data:', error);
            showToast('Erro ao carregar dados.', 'error');
        } finally {
            setLoading(false);
        }
    };

    const confirmDeleteDraft = (id, title) => {
        setModal({
            isOpen: true,
            title: 'Excluir Rascunho',
            message: `Tem certeza que deseja apagar o rascunho "${title}"? Essa ação é irreversível.`,
            type: 'danger',
            onConfirm: () => handleDeleteDraft(id)
        });
    };

    const handleDeleteDraft = async (id) => {
        try {
            const { error } = await supabase
                .from('pre_schedules')
                .delete()
                .eq('id', id);

            if (error) throw error;
            showToast('Rascunho excluído!');
            loadData();
        } catch (err) {
            showToast('Erro ao excluir: ' + err.message, 'error');
        }
    };

    const confirmDeleteSchedule = (id, title) => {
        setModal({
            isOpen: true,
            title: 'Excluir Escala Publicada',
            message: `Tem certeza que deseja apagar a escala publicada "${title}"? O link público deixará de funcionar.`,
            type: 'danger',
            onConfirm: () => handleDeleteSchedule(id)
        });
    };

    const handleDeleteSchedule = async (id) => {
        try {
            const { error } = await supabase
                .from('schedules')
                .delete()
                .eq('id', id);

            if (error) throw error;
            showToast('Escala removida!');
            loadData();
        } catch (err) {
            showToast('Erro ao excluir: ' + err.message, 'error');
        }
    };

    return (
        <div className="space-y-8 animate-fade-in-up pb-20">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <ConfirmModal
                isOpen={modal.isOpen}
                onClose={() => setModal({ ...modal, isOpen: false })}
                onConfirm={modal.onConfirm}
                title={modal.title}
                message={modal.message}
                type={modal.type}
            />

            {/* 1. Dashboard Header */}
            <div>
                <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
                    Olá, {user?.name?.split(' ')[0]} 👋
                </h1>
                <p className="text-slate-400">Aqui está o resumo do que está acontecendo na igreja.</p>
            </div>

            {/* 2. Stat Cards (Admin) */}
            {user?.role === 'admin' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <StatCard
                        title="Membros Ativos"
                        value={stats.members}
                        icon={Users}
                        colorClass="text-blue-400 bg-blue-400"
                        delay="0s"
                    />
                    <StatCard
                        title="Ministérios"
                        value={stats.ministries}
                        icon={LayoutGrid}
                        colorClass="text-purple-400 bg-purple-400"
                        delay="0.1s"
                    />
                    <StatCard
                        title="Escalas no Sistema"
                        value={stats.activeScales}
                        icon={Calendar}
                        colorClass="text-emerald-400 bg-emerald-400"
                        delay="0.2s"
                    />
                </div>
            )}

            {/* 3. Main Action Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {user?.role === 'admin' && (
                    <div className="md:col-span-2 lg:col-span-1">
                        <ActionCard
                            title="Nova Escala"
                            description="Criar escala inteligente do zero"
                            icon={Plus}
                            onClick={() => navigate('/wizard')}
                            color="blue"
                        />
                    </div>
                )}

                {/* Placeholder/Extra Actions or specific filtering */}
                {user?.role === 'admin' && (
                    <div className="md:col-span-2 lg:col-span-1">
                        <ActionCard
                            title="Convidar Membro"
                            description="Adicionar usuário à equipe"
                            icon={UserPlus}
                            onClick={() => navigate('/users')}
                            color="emerald"
                        />
                    </div>
                )}
            </div>


            {/* 4. Lists Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mt-8">

                {/* Drafts Section */}
                {user?.role !== 'viewer' && (
                    <div className="bg-[#0f172a] border border-blue-900/30 rounded-3xl p-6 md:p-8 shadow-xl">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-white flex items-center gap-3">
                                <div className="p-2 bg-blue-900/20 rounded-lg text-blue-400"><Calendar size={20} /></div>
                                Rascunhos em Aberto
                            </h2>
                            {drafts.length > 0 && <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">{drafts.length}</span>}
                        </div>

                        {loading ? (
                            <div className="py-10 text-center"><div className="animate-spin w-6 h-6 border-2 border-blue-500 rounded-full border-t-transparent mx-auto"></div></div>
                        ) : drafts.length > 0 ? (
                            <div className="space-y-4">
                                {drafts.map(draft => (
                                    <div
                                        key={draft.id}
                                        className="p-4 bg-[#020617] border border-blue-900/30 rounded-2xl hover:border-blue-500/50 transition-all flex items-center justify-between group cursor-pointer"
                                        onClick={() => navigate(`/pre-scale/${draft.id}`)}
                                    >
                                        <div className="flex-1">
                                            <h3 className="font-bold text-slate-200 group-hover:text-blue-400 transition-colors">{draft.title}</h3>
                                            <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                                <Clock size={12} />
                                                Criado em {new Date(draft.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <span className="text-xs font-bold uppercase text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">Rascunho</span>
                                            {user?.role === 'admin' && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        confirmDeleteDraft(draft.id, draft.title);
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
                            <div className="text-center py-10 text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                                <p>Nenhum rascunho pendente.</p>
                            </div>
                        )}
                    </div>
                )}

                {/* Published Section */}
                <div className="bg-[#0f172a] border border-blue-900/30 rounded-3xl p-6 md:p-8 shadow-xl">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white flex items-center gap-3">
                            <div className="p-2 bg-emerald-900/20 rounded-lg text-emerald-400"><CheckCircle size={20} /></div>
                            Escalas Publicadas
                        </h2>
                    </div>

                    {loading ? (
                        <div className="py-10 text-center"><div className="animate-spin w-6 h-6 border-2 border-emerald-500 rounded-full border-t-transparent mx-auto"></div></div>
                    ) : published.length > 0 ? (
                        <div className="space-y-4">
                            {published.map(pub => (
                                <div
                                    key={pub.id}
                                    className="p-4 bg-[#020617] border border-emerald-900/20 rounded-2xl hover:border-emerald-500/50 transition-all flex items-center justify-between group cursor-pointer"
                                    onClick={() => navigate(`/public/${pub.id}`)}
                                >
                                    <div className="flex-1">
                                        <h3 className="font-bold text-slate-200 group-hover:text-emerald-400 transition-colors">{pub.title}</h3>
                                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                                            <Calendar size={12} />
                                            Publicado em {new Date(pub.published_at).toLocaleDateString()}
                                        </p>
                                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-700">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); navigate(`/public/${pub.id}`); }}
                                                className="flex-1 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                                            >
                                                <Share2 size={16} /> Visualizar
                                            </button>

                                            {(user.role === 'admin' || user.role === 'leader') && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); navigate(`/schedules/${pub.id}/edit`); }}
                                                    className="px-3 py-2 rounded-lg bg-amber-900/20 hover:bg-amber-900/40 text-amber-500 border border-amber-500/30 transition-colors"
                                                    title="Editar Escala Publicada"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                            )}

                                            {user.role === 'admin' && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); confirmDeleteSchedule(pub.id, pub.title); }}
                                                    className="p-2 rounded-lg hover:bg-red-900/20 text-slate-500 hover:text-red-400 transition-colors"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-10 text-slate-500 border border-dashed border-slate-800 rounded-2xl">
                            <p>Nenhuma escala publicada.</p>
                        </div>
                    )}
                </div>
            </div>
        </div >
    );
}

export default Home;
