import React, { useState, useEffect } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle, Clock, Lock, AlertTriangle, Eye, EyeOff, Share2, Edit3, X, User, Trash2 } from 'lucide-react';
import LZString from 'lz-string';
import { MINISTERIOS_DEFAULT } from './logic';
import Navigation from './components/Navigation';
import { usePreEscala } from './hooks/usePreEscala';

/**
 * PublicPreEscala - Página pública EDITÁVEL para colaboração em pré-escalas
 * SEM alert/prompt/confirm - Apenas componentes visuais nativos
 */
export default function PublicPreEscala() {
    const { id } = useParams();
    const [searchParams] = useSearchParams();

    // Hook para gerenciar pré-escala com Supabase
    const { preEscala, loading, error: hookError, updatePreEscala, isSupabaseEnabled } = usePreEscala(id);

    const [error, setError] = useState(null); // Local error state for URL parsing
    const [showHistory, setShowHistory] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    // Estados para aprovação (substitui prompt)
    const [aprovandoMinisterio, setAprovandoMinisterio] = useState(null);
    const [nomeAprovador, setNomeAprovador] = useState('');

    // Estados para remoção (substitui confirm)
    const [removendoAprovacao, setRemovendoAprovacao] = useState(null);

    // Carrega dados iniciais da URL se não existir no Supabase
    useEffect(() => {
        // If hook is still loading or has an error, or preEscala is already loaded, do nothing.
        // If Supabase is enabled and preEscala is null, it means it wasn't found in DB.
        // If Supabase is NOT enabled, we always load from URL/localStorage.
        if (loading || hookError || preEscala) {
            return;
        }

        // If Supabase is enabled and preEscala is null, try to load from URL and create it.
        // If Supabase is NOT enabled, always try to load from URL/localStorage.
        if (isSupabaseEnabled && !preEscala || !isSupabaseEnabled) {
            try {
                const compressed = searchParams.get('d');
                if (!compressed) {
                    setError('Link inválido - dados não encontrados');
                    return;
                }

                const decompressed = LZString.decompressFromEncodedURIComponent(compressed);
                const data = JSON.parse(decompressed);

                if (data.tipo !== 'pre-escala') {
                    setError('Este link não é uma pré-escala válida');
                    return;
                }

                const initialData = {
                    id: data.id,
                    data: data.data,
                    aprovacoes: data.aprovacoes || {},
                    historico: data.historico || [],
                    status: 'rascunho' // Default status for new pre-escalas
                };

                if (isSupabaseEnabled) {
                    // If Supabase is enabled, create the pre-escala in the DB
                    updatePreEscala(initialData);
                } else {
                    // Fallback to localStorage if Supabase is not enabled
                    localStorage.setItem(`chorus_pre_escala_${data.id}`, JSON.stringify(initialData));
                    // The usePreEscala hook will pick this up if it's not Supabase enabled
                    // or we could manually set it here if the hook doesn't manage localStorage directly
                    // For now, assuming usePreEscala handles the non-supabase case by reading localStorage
                }
            } catch (e) {
                console.error('Erro ao processar link:', e);
                setError('Link inválido ou corrompido');
            }
        }
    }, [loading, preEscala, hookError, searchParams, updatePreEscala, isSupabaseEnabled]);

    // Sincroniza mudanças entre abas/usuários via localStorage (apenas se Supabase não estiver habilitado)
    useEffect(() => {
        if (isSupabaseEnabled || !preEscala) return;

        const handleStorageChange = (e) => {
            if (e.key === `chorus_pre_escala_${preEscala.id}` && e.newValue) {
                // The usePreEscala hook already handles updating its internal state from localStorage
                // when isSupabaseEnabled is false. So, we just need to show a toast.
                showToast('Escala atualizada por outro usuário!', 'info');
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => window.removeEventListener('storage', handleStorageChange);
    }, [preEscala, isSupabaseEnabled]);

    // Salva automaticamente
    const savePreEscala = (updated) => {
        updatePreEscala(updated); // Use the hook's update function
    };

    // Editar voluntário
    const editarVoluntario = (index, novoVoluntario) => {
        const novaData = [...preEscala.data];
        const antigoVoluntario = novaData[index].Voluntario;

        if (antigoVoluntario === novoVoluntario) return;

        novaData[index].Voluntario = novoVoluntario;

        const updated = {
            ...preEscala,
            data: novaData,
            historico: [
                ...preEscala.historico,
                {
                    tipo: 'edicao',
                    index,
                    funcao: novaData[index].Funcao,
                    data: novaData[index].Data,
                    de: antigoVoluntario,
                    para: novoVoluntario,
                    timestamp: new Date().toISOString()
                }
            ]
        };

        savePreEscala(updated);
        showToast('Voluntário alterado!', 'success');
    };

    // Iniciar aprovação (abre formulário inline)
    const iniciarAprovacao = (ministerio) => {
        setAprovandoMinisterio(ministerio);
        setNomeAprovador('');
    };

    // Confirmar aprovação (substitui prompt)
    const confirmarAprovacao = () => {
        if (!nomeAprovador.trim()) {
            showToast('Digite seu nome para aprovar!', 'error');
            return;
        }

        const novasAprovacoes = {
            ...preEscala.aprovacoes,
            [aprovandoMinisterio]: {
                aprovado: true,
                por: nomeAprovador.trim(),
                em: new Date().toISOString()
            }
        };

        const updated = {
            ...preEscala,
            aprovacoes: novasAprovacoes,
            historico: [
                ...preEscala.historico,
                {
                    tipo: 'aprovacao',
                    ministerio: aprovandoMinisterio,
                    usuario: nomeAprovador.trim(),
                    timestamp: new Date().toISOString()
                }
            ]
        };

        savePreEscala(updated);
        showToast(`${aprovandoMinisterio} aprovado com sucesso!`, 'success');
        setAprovandoMinisterio(null);
        setNomeAprovador('');
    };

    // Cancelar aprovação
    const cancelarAprovacao = () => {
        setAprovandoMinisterio(null);
        setNomeAprovador('');
    };

    // Iniciar remoção de aprovação (abre confirmação visual)
    const iniciarRemocaoAprovacao = (ministerio) => {
        setRemovendoAprovacao(ministerio);
    };

    // Confirmar remoção (substitui confirm)
    const confirmarRemocao = () => {
        const novasAprovacoes = { ...preEscala.aprovacoes };
        delete novasAprovacoes[removendoAprovacao];

        const updated = {
            ...preEscala,
            aprovacoes: novasAprovacoes,
            historico: [
                ...preEscala.historico,
                {
                    tipo: 'remocao_aprovacao',
                    ministerio: removendoAprovacao,
                    timestamp: new Date().toISOString()
                }
            ]
        };

        savePreEscala(updated);
        showToast(`Aprovação de ${removendoAprovacao} removida!`, 'success');
        setRemovendoAprovacao(null);
    };

    // Cancelar remoção
    const cancelarRemocao = () => {
        setRemovendoAprovacao(null);
    };

    // Copiar link
    const copiarLink = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        showToast('Link copiado para a área de transferência!', 'success');
    };

    // Toast helper
    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    // Extrair todos os voluntários únicos
    const todosVoluntarios = React.useMemo(() => {
        if (!preEscala?.data) return [];
        const voluntarios = new Set();
        preEscala.data.forEach(slot => {
            if (slot.Voluntario && slot.Voluntario !== 'Não designado') {
                voluntarios.add(slot.Voluntario);
            }
        });
        return Array.from(voluntarios).sort();
    }, [preEscala]);

    if (loading) {
        return (
            <div className="w-full min-h-screen bg-[#020617] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-slate-400">Carregando pré-escala...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="w-full min-h-screen bg-[#020617] flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-[#0f172a] border border-red-900/30 rounded-2xl p-8 text-center">
                    <AlertTriangle className="text-red-500 mx-auto mb-4" size={48} />
                    <h2 className="text-xl font-bold text-white mb-2">Erro ao Carregar</h2>
                    <p className="text-slate-400">{error}</p>
                </div>
            </div>
        );
    }

    const ministerios = Object.keys(MINISTERIOS_DEFAULT);
    const totalAprovacoes = Object.keys(preEscala.aprovacoes || {}).length;
    const todosAprovados = ministerios.every(min => preEscala.aprovacoes?.[min]?.aprovado);

    // Agrupar escala por data
    const escalaAgrupada = (preEscala.data || []).reduce((acc, item) => {
        if (!acc[item.Data]) acc[item.Data] = [];
        acc[item.Data].push(item);
        return acc;
    }, {});

    return (
        <div className="w-full min-h-screen bg-[#020617] text-white">
            <Navigation showBack={true} title="Pré-Escala Colaborativa" />

            {/* Header */}
            <header className="bg-[#0f172a] border-b border-blue-900/30 p-6 backdrop-blur-md bg-[#0f172a]/90">
                <div className="max-w-7xl mx-auto">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                            <Edit3 className="text-blue-400" size={28} />
                            <div>
                                <h1 className="text-2xl font-bold">Pré-Escala Colaborativa</h1>
                                <p className="text-slate-400 text-sm">ID: {preEscala.id}</p>
                            </div>
                        </div>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowHistory(!showHistory)}
                                className="px-3 py-2 rounded-lg text-xs font-bold bg-blue-900/20 text-blue-300 hover:bg-blue-900/40 transition-colors flex items-center gap-2"
                            >
                                {showHistory ? <EyeOff size={14} /> : <Eye size={14} />}
                                <span className="hidden md:inline">Histórico</span>
                            </button>
                            <button
                                onClick={copiarLink}
                                className="px-3 py-2 rounded-lg text-xs font-bold bg-purple-900/20 text-purple-300 hover:bg-purple-900/40 transition-colors flex items-center gap-2"
                            >
                                <Share2 size={14} />
                                <span className="hidden md:inline">Copiar Link</span>
                            </button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Status de Aprovações */}
            <div className="max-w-7xl mx-auto p-6">
                <div className="bg-[#0f172a] border border-blue-900/30 rounded-2xl p-6 mb-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-lg font-bold">
                            Status de Aprovação ({totalAprovacoes}/{ministerios.length})
                        </h2>
                        {todosAprovados ? (
                            <div className="flex items-center gap-2 text-emerald-400">
                                <CheckCircle size={20} />
                                <span className="text-sm font-bold">Todos aprovaram!</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-orange-400">
                                <Clock size={20} />
                                <span className="text-sm font-bold">Aguardando {ministerios.length - totalAprovacoes} aprovação(ões)</span>
                            </div>
                        )}
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        {ministerios.map(min => {
                            const aprovacao = preEscala.aprovacoes?.[min];
                            const aprovado = aprovacao?.aprovado;
                            const estaAprovando = aprovandoMinisterio === min;
                            const estaRemovendo = removendoAprovacao === min;

                            return (
                                <div
                                    key={min}
                                    className={`p-3 rounded-xl border transition-all ${aprovado
                                        ? 'bg-emerald-900/20 border-emerald-500/50'
                                        : estaAprovando
                                            ? 'bg-blue-900/30 border-blue-500/50'
                                            : 'bg-orange-900/10 border-orange-500/30 hover:border-orange-500/50'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold">{min}</span>
                                        {aprovado ? (
                                            <CheckCircle className="text-emerald-400" size={16} />
                                        ) : (
                                            <Clock className="text-orange-400" size={16} />
                                        )}
                                    </div>

                                    {/* APROVADO - Mostra info e botão remover */}
                                    {aprovado && !estaRemovendo && (
                                        <div className="text-[10px] text-slate-500 space-y-1">
                                            <div>Por: <span className="text-emerald-400">{aprovacao.por}</span></div>
                                            <div>{new Date(aprovacao.em).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</div>
                                            <button
                                                onClick={() => iniciarRemocaoAprovacao(min)}
                                                className="mt-1 text-red-400 hover:text-red-300 underline text-[10px] flex items-center gap-1"
                                            >
                                                <Trash2 size={10} />
                                                Remover Aprovação
                                            </button>
                                        </div>
                                    )}

                                    {/* CONFIRMAÇÃO DE REMOÇÃO (substitui confirm) */}
                                    {estaRemovendo && (
                                        <div className="space-y-2">
                                            <p className="text-[10px] text-orange-300">Tem certeza?</p>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={confirmarRemocao}
                                                    className="flex-1 text-[10px] font-bold text-white bg-red-600 hover:bg-red-500 py-1 rounded transition-colors"
                                                >
                                                    Sim
                                                </button>
                                                <button
                                                    onClick={cancelarRemocao}
                                                    className="flex-1 text-[10px] font-bold text-slate-300 bg-slate-700 hover:bg-slate-600 py-1 rounded transition-colors"
                                                >
                                                    Não
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* FORMULÁRIO DE APROVAÇÃO (substitui prompt) */}
                                    {estaAprovando && (
                                        <div className="space-y-2">
                                            <label className="block">
                                                <span className="text-[10px] text-slate-400 block mb-1">Seu nome:</span>
                                                <input
                                                    type="text"
                                                    value={nomeAprovador}
                                                    onChange={(e) => setNomeAprovador(e.target.value)}
                                                    onKeyPress={(e) => e.key === 'Enter' && confirmarAprovacao()}
                                                    placeholder="Digite aqui"
                                                    autoFocus
                                                    className="w-full text-[11px] px-2 py-1 rounded bg-[#020617] border border-blue-500/50 text-white outline-none focus:ring-1 focus:ring-blue-500"
                                                />
                                            </label>
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={confirmarAprovacao}
                                                    className="flex-1 text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-500 py-1.5 rounded transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <CheckCircle size={12} />
                                                    Confirmar
                                                </button>
                                                <button
                                                    onClick={cancelarAprovacao}
                                                    className="flex-1 text-[10px] font-bold text-slate-300 bg-slate-700 hover:bg-slate-600 py-1.5 rounded transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <X size={12} />
                                                    Cancelar
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* BOTÃO APROVAR (pendente) */}
                                    {!aprovado && !estaAprovando && (
                                        <button
                                            onClick={() => iniciarAprovacao(min)}
                                            className="mt-1 w-full text-[11px] font-bold text-white bg-blue-600 hover:bg-blue-500 py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                                        >
                                            <User size={12} />
                                            Aprovar
                                        </button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Histórico */}
                {showHistory && (
                    <div className="bg-[#0f172a] border border-blue-900/30 rounded-2xl p-6 mb-6 max-h-60 overflow-y-auto">
                        <h4 className="text-sm font-bold text-slate-300 mb-3 uppercase tracking-widest">Histórico de Alterações</h4>
                        <div className="space-y-2">
                            {preEscala.historico.slice().reverse().map((log, idx) => (
                                <div key={idx} className="text-xs text-slate-400 flex items-start gap-2 p-2 bg-[#020617] rounded-lg">
                                    <span className="text-slate-600 font-mono">{new Date(log.timestamp).toLocaleTimeString('pt-BR')}</span>
                                    {log.tipo === 'aprovacao' && (
                                        <span className="text-emerald-400 flex-1">
                                            ✓ <strong>{log.usuario}</strong> aprovou <strong>{log.ministerio}</strong>
                                        </span>
                                    )}
                                    {log.tipo === 'edicao' && (
                                        <span className="text-blue-400 flex-1">
                                            ✎ <strong>{log.data}</strong> - {log.funcao}: <span className="line-through text-slate-600">{log.de}</span> → <strong>{log.para}</strong>
                                        </span>
                                    )}
                                    {log.tipo === 'remocao_aprovacao' && (
                                        <span className="text-red-400 flex-1">
                                            ✗ Aprovação de <strong>{log.ministerio}</strong> removida
                                        </span>
                                    )}
                                </div>
                            ))}
                            {preEscala.historico.length === 0 && (
                                <p className="text-slate-600 text-center py-4">Nenhuma alteração ainda</p>
                            )}
                        </div>
                    </div>
                )}

                {/* Escala EDITÁVEL */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {Object.keys(escalaAgrupada).map(data => (
                        <div key={data} className="bg-[#0f172a] border border-blue-900/30 rounded-2xl overflow-hidden hover:border-blue-500/50 transition-all">
                            <div className="p-3 bg-gradient-to-r from-blue-700 to-indigo-700 text-white text-center">
                                <span className="text-sm font-bold uppercase">{data}</span>
                            </div>
                            <div className="p-4 space-y-3">
                                {escalaAgrupada[data].map((slot, idx) => {
                                    const globalIndex = preEscala.data.indexOf(slot);
                                    const ministerio = slot.AreaOriginal || 'TAKE';
                                    const aprovado = preEscala.aprovacoes?.[ministerio]?.aprovado;

                                    return (
                                        <div key={globalIndex} className="space-y-1">
                                            <div className="flex items-center justify-between">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">{slot.Funcao}</span>
                                                {aprovado && <Lock className="text-emerald-500" size={12} />}
                                            </div>
                                            <select
                                                value={slot.Voluntario}
                                                onChange={(e) => editarVoluntario(globalIndex, e.target.value)}
                                                disabled={aprovado}
                                                className={`w-full p-2 text-sm rounded-lg border outline-none transition-all ${aprovado
                                                    ? 'bg-emerald-900/10 border-emerald-500/30 text-emerald-300 cursor-not-allowed'
                                                    : 'bg-[#020617] border-blue-900/40 text-white hover:border-blue-500 cursor-pointer focus:ring-2 focus:ring-blue-500'
                                                    }`}
                                            >
                                                <option value={slot.Voluntario}>{slot.Voluntario}</option>
                                                <option value="Não designado">Não designado</option>
                                                {todosVoluntarios.filter(v => v !== slot.Voluntario).map(vol => (
                                                    <option key={vol} value={vol}>{vol}</option>
                                                ))}
                                            </select>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Toast */}
            {toast.show && (
                <div className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl font-bold animate-bounce-in z-[70] flex items-center gap-3 transition-all whitespace-nowrap border ${toast.type === 'error' ? 'bg-red-900/90 border-red-700 text-white' :
                    toast.type === 'info' ? 'bg-blue-900/90 border-blue-700 text-white' :
                        'bg-emerald-900/90 border-emerald-700 text-white'
                    }`}>
                    {toast.type === 'success' && <CheckCircle size={20} />}
                    {toast.type === 'error' && <AlertTriangle size={20} />}
                    {toast.type === 'info' && <Eye size={20} />}
                    <span className="text-sm">{toast.message}</span>
                </div>
            )}

            {/* Footer */}
            <footer className="py-6 text-center text-xs text-slate-600 mt-12 border-t border-blue-900/30">
                <p>ChorusApp • Pré-Escala Colaborativa • Edite e Aprove em Tempo Real</p>
            </footer>
        </div>
    );
}
