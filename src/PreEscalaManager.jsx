import React, { useState, useEffect } from 'react';
import { X, Share2, CheckCircle, Clock, Edit3, Lock, Unlock, Users, AlertTriangle, Eye, EyeOff, Trash2, User } from 'lucide-react';
import LZString from 'lz-string';
import { MINISTERIOS_DEFAULT } from './logic';
import { usePreEscala } from './hooks/usePreEscala';

/**
 * PreEscalaManager - Gerenciador de Pré-Escalas com Aprovação por Ministério
 * SEM alert/prompt/confirm - Apenas componentes visuais nativos
 */
export default function PreEscalaManager({ escala, disponiveis, onClose, onPublish, isDark = true }) {
    // ID da pré-escala (usa timestamp ou carrega do localStorage)
    const [preEscalaId] = useState(() => {
        const saved = localStorage.getItem('chorus_pre_escala');
        return saved ? JSON.parse(saved).id : Date.now().toString();
    });

    // Hook para gerenciar pré-escala com Supabase
    const { preEscala, loading, updatePreEscala, createPreEscala, isSupabaseEnabled } = usePreEscala(preEscalaId);

    const [showHistory, setShowHistory] = useState(false);
    const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

    // Estados para aprovação (substitui prompt)
    const [aprovandoMinisterio, setAprovandoMinisterio] = useState(null);
    const [nomeAprovador, setNomeAprovador] = useState('');

    // Estados para remoção (substitui confirm)
    const [removendoAprovacao, setRemovendoAprovacao] = useState(null);

    // Cria pré-escala inicial se não existir
    useEffect(() => {
        if (!preEscala && !loading) {
            const novaPreEscala = {
                id: preEscalaId,
                data: escala,
                aprovacoes: {},
                historico: [],
                criadoEm: new Date().toISOString(),
                status: 'rascunho'
            };
            createPreEscala(novaPreEscala);
        }
    }, [preEscala, loading, escala, preEscalaId, createPreEscala]);

    // Gera link compartilhável
    const gerarLinkCompartilhavel = () => {
        const payload = {
            id: preEscala.id,
            data: preEscala.data,
            aprovacoes: preEscala.aprovacoes,
            historico: preEscala.historico,
            tipo: 'pre-escala'
        };
        const compressed = LZString.compressToEncodedURIComponent(JSON.stringify(payload));
        const url = `${window.location.origin}/pre-escala/${preEscala.id}?d=${compressed}`;
        navigator.clipboard.writeText(url);
        showToast('Link copiado para a área de transferência!', 'success');
    };

    // Iniciar aprovação
    const iniciarAprovacao = (ministerio) => {
        setAprovandoMinisterio(ministerio);
        setNomeAprovador('');
    };

    // Confirmar aprovação (substitui prompt)
    const confirmarAprovacao = async () => {
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

        const novoHistorico = [
            ...preEscala.historico,
            {
                tipo: 'aprovacao',
                ministerio: aprovandoMinisterio,
                usuario: nomeAprovador.trim(),
                timestamp: new Date().toISOString()
            }
        ];

        // Atualiza no Supabase (ou localStorage se não configurado)
        await updatePreEscala({
            aprovacoes: novasAprovacoes,
            historico: novoHistorico
        });

        showToast(`${aprovandoMinisterio} aprovado com sucesso!`, 'success');
        setAprovandoMinisterio(null);
        setNomeAprovador('');
    };

    // Cancelar aprovação
    const cancelarAprovacao = () => {
        setAprovandoMinisterio(null);
        setNomeAprovador('');
    };

    // Iniciar remoção
    const iniciarRemocaoAprovacao = (ministerio) => {
        setRemovendoAprovacao(ministerio);
    };

    // Confirmar remoção (substitui confirm)
    const confirmarRemocao = async () => {
        const novasAprovacoes = { ...preEscala.aprovacoes };
        delete novasAprovacoes[removendoAprovacao];

        const novoHistorico = [
            ...preEscala.historico,
            {
                tipo: 'remocao_aprovacao',
                ministerio: removendoAprovacao,
                timestamp: new Date().toISOString()
            }
        ];

        // Atualiza no Supabase (ou localStorage se não configurado)
        await updatePreEscala({
            aprovacoes: novasAprovacoes,
            historico: novoHistorico
        });

        showToast(`Aprovação de ${removendoAprovacao} removida!`, 'success');
        setRemovendoAprovacao(null);
    };

    // Cancelar remoção
    const cancelarRemocao = () => {
        setRemovendoAprovacao(null);
    };

    // Editar voluntário
    const editarVoluntario = (index, novoVoluntario) => {
        const novaData = [...preEscala.data];
        const antigoVoluntario = novaData[index].Voluntario;

        if (antigoVoluntario === novoVoluntario) return;

        novaData[index].Voluntario = novoVoluntario;

        setPreEscala({
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
        });

        showToast('Voluntário alterado!', 'success');
    };

    // Publicar escala final (substitui alert)
    const publicarEscalaFinal = () => {
        if (!todosAprovados) {
            showToast('Todos os ministérios precisam aprovar antes de publicar!', 'error');
            return;
        }

        const escalaFinal = {
            ...preEscala,
            status: 'publicado',
            publicadoEm: new Date().toISOString()
        };

        localStorage.setItem('chorus_escala_final', JSON.stringify(escalaFinal));
        showToast('Escala final publicada com sucesso!', 'success');
        onPublish && onPublish(escalaFinal);
    };

    // Toast helper
    const showToast = (message, type = 'success') => {
        setToast({ show: true, message, type });
        setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 3000);
    };

    // Verificar se todos os ministérios aprovaram
    const ministerios = Object.keys(MINISTERIOS_DEFAULT);
    const todosAprovados = ministerios.every(min => preEscala.aprovacoes[min]?.aprovado);
    const totalAprovacoes = Object.keys(preEscala.aprovacoes).length;

    // Agrupar escala por data
    const escalaAgrupada = preEscala.data.reduce((acc, item) => {
        if (!acc[item.Data]) acc[item.Data] = [];
        acc[item.Data].push(item);
        return acc;
    }, {});

    const bgClass = isDark ? 'bg-[#020617]' : 'bg-white';
    const cardClass = isDark ? 'bg-[#0f172a] border-blue-900/30' : 'bg-gray-50 border-gray-200';
    const textClass = isDark ? 'text-white' : 'text-gray-900';

    // Loading state
    if (loading || !preEscala) {
        return (
            <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm">
                <div className="text-center">
                    <div className="inline-block w-12 h-12 border-4 border-blue-500/30 border-t-blue-500 rounded-full animate-spin mb-4"></div>
                    <p className="text-white">Carregando pré-escala...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
            <div className={`w-full max-w-7xl h-[90vh] flex flex-col rounded-3xl shadow-2xl ${cardClass} border overflow-hidden`}>
                {/* Header */}
                <div className="p-6 border-b border-blue-900/30 flex justify-between items-center bg-gradient-to-r from-blue-900/20 to-indigo-900/20">
                    <div>
                        <h2 className={`text-2xl font-bold ${textClass} flex items-center gap-3`}>
                            <Edit3 className="text-blue-400" size={28} />
                            Pré-Escala - Aprovação Colaborativa
                        </h2>
                        <p className="text-slate-400 text-sm mt-1">
                            ID: {preEscala.id} • Criado em {new Date(preEscala.criadoEm).toLocaleString('pt-BR')}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-white/10 transition-colors">
                        <X size={24} className="text-slate-400 hover:text-white" />
                    </button>
                </div>

                {/* Status Bar - Aprovações */}
                <div className="p-4 bg-[#0f172a]/50 border-b border-blue-900/20">
                    <div className="flex items-center justify-between mb-3">
                        <h3 className="text-sm font-bold text-slate-300 uppercase tracking-widest">
                            Status de Aprovação ({totalAprovacoes}/{ministerios.length})
                        </h3>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setShowHistory(!showHistory)}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-900/20 text-blue-300 hover:bg-blue-900/40 transition-colors flex items-center gap-2"
                            >
                                {showHistory ? <EyeOff size={14} /> : <Eye size={14} />}
                                Histórico
                            </button>
                            <button
                                onClick={gerarLinkCompartilhavel}
                                className="px-3 py-1.5 rounded-lg text-xs font-bold bg-purple-900/20 text-purple-300 hover:bg-purple-900/40 transition-colors flex items-center gap-2"
                            >
                                <Share2 size={14} />
                                Copiar Link
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
                        {ministerios.map(min => {
                            const aprovacao = preEscala.aprovacoes[min];
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
                                            : 'bg-orange-900/10 border-orange-500/30'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-xs font-bold text-slate-300">{min}</span>
                                        {aprovado ? (
                                            <CheckCircle className="text-emerald-400" size={16} />
                                        ) : (
                                            <Clock className="text-orange-400" size={16} />
                                        )}
                                    </div>

                                    {/* APROVADO */}
                                    {aprovado && !estaRemovendo && (
                                        <div className="text-[10px] text-slate-500 space-y-1">
                                            <div>Por: <span className="text-emerald-400">{aprovacao.por}</span></div>
                                            <div>{new Date(aprovacao.em).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })}</div>
                                            <button
                                                onClick={() => iniciarRemocaoAprovacao(min)}
                                                className="mt-1 text-red-400 hover:text-red-300 underline flex items-center gap-1"
                                            >
                                                <Trash2 size={10} />
                                                Remover
                                            </button>
                                        </div>
                                    )}

                                    {/* CONFIRMAÇÃO DE REMOÇÃO */}
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

                                    {/* FORMULÁRIO DE APROVAÇÃO */}
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

                                    {/* BOTÃO APROVAR */}
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
                    <div className="p-4 bg-[#020617]/50 border-b border-blue-900/20 max-h-40 overflow-y-auto">
                        <h4 className="text-xs font-bold text-slate-400 mb-2 uppercase">Histórico de Alterações</h4>
                        <div className="space-y-1">
                            {preEscala.historico.slice().reverse().map((log, idx) => (
                                <div key={idx} className="text-xs text-slate-500 flex items-center gap-2">
                                    <span className="text-slate-600">{new Date(log.timestamp).toLocaleTimeString('pt-BR')}</span>
                                    {log.tipo === 'aprovacao' && (
                                        <span className="text-emerald-400">✓ {log.usuario} aprovou {log.ministerio}</span>
                                    )}
                                    {log.tipo === 'edicao' && (
                                        <span className="text-blue-400">✎ {log.data} - {log.funcao}: {log.de} → {log.para}</span>
                                    )}
                                    {log.tipo === 'remocao_aprovacao' && (
                                        <span className="text-red-400">✗ Aprovação de {log.ministerio} removida</span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Escala Editável */}
                <div className="flex-1 overflow-y-auto p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                        {Object.keys(escalaAgrupada).map(data => (
                            <div key={data} className={`rounded-2xl border ${cardClass} overflow-hidden`}>
                                <div className="p-3 bg-gradient-to-r from-blue-700 to-indigo-700 text-white text-center">
                                    <span className="text-sm font-bold uppercase">{data}</span>
                                </div>
                                <div className="p-4 space-y-3">
                                    {escalaAgrupada[data].map((slot, idx) => {
                                        const globalIndex = preEscala.data.indexOf(slot);
                                        const ministerio = slot.AreaOriginal || 'TAKE';
                                        const aprovado = preEscala.aprovacoes[ministerio]?.aprovado;

                                        return (
                                            <div key={globalIndex} className="space-y-1">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-[10px] font-bold text-slate-500 uppercase">{slot.Funcao}</span>
                                                    {aprovado && <Lock className="text-emerald-500" size={12} />}
                                                </div>
                                                <select
                                                    value={slot.Voluntario}
                                                    onChange={(e) => editarVoluntario(globalIndex, e.target.value)}
                                                    disabled={aprovado}
                                                    className={`w-full p-2 text-sm rounded-lg border outline-none ${aprovado
                                                        ? 'bg-emerald-900/10 border-emerald-500/30 text-emerald-300 cursor-not-allowed'
                                                        : 'bg-[#020617] border-blue-900/40 text-white hover:border-blue-500 cursor-pointer'
                                                        }`}
                                                >
                                                    <option value={slot.Voluntario}>{slot.Voluntario}</option>
                                                    {disponiveis[data]?.[ministerio]?.map(vol => (
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

                {/* Footer - Ações */}
                <div className="p-6 border-t border-blue-900/30 bg-[#0f172a]/50 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        {todosAprovados ? (
                            <div className="flex items-center gap-2 text-emerald-400">
                                <CheckCircle size={20} />
                                <span className="text-sm font-bold">Todos os ministérios aprovaram!</span>
                            </div>
                        ) : (
                            <div className="flex items-center gap-2 text-orange-400">
                                <AlertTriangle size={20} />
                                <span className="text-sm font-bold">
                                    Aguardando {ministerios.length - totalAprovacoes} aprovação(ões)
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex gap-3">
                        <button
                            onClick={onClose}
                            className="px-6 py-3 rounded-xl font-bold text-slate-400 hover:bg-white/5 transition-colors"
                        >
                            Fechar
                        </button>
                        <button
                            onClick={publicarEscalaFinal}
                            disabled={!todosAprovados}
                            className={`px-6 py-3 rounded-xl font-bold transition-all flex items-center gap-2 ${todosAprovados
                                ? 'bg-emerald-600 text-white hover:bg-emerald-500 shadow-lg shadow-emerald-900/30'
                                : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                                }`}
                        >
                            {todosAprovados ? <Unlock size={18} /> : <Lock size={18} />}
                            Publicar Escala Final
                        </button>
                    </div>
                </div>
            </div>

            {/* Toast */}
            {toast.show && (
                <div className={`fixed bottom-8 right-8 px-6 py-3 rounded-full shadow-2xl font-bold animate-bounce-in z-[80] flex items-center gap-3 transition-all whitespace-nowrap border ${toast.type === 'error' ? 'bg-red-900/90 border-red-700 text-white' :
                    'bg-emerald-900/90 border-emerald-700 text-white'
                    }`}>
                    {toast.type === 'success' && <CheckCircle size={20} />}
                    {toast.type === 'error' && <AlertTriangle size={20} />}
                    <span className="text-sm">{toast.message}</span>
                </div>
            )}
        </div>
    );
}
