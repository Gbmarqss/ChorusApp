import React, { useState, useEffect, useMemo } from 'react';
import { Upload, FileSpreadsheet, Download, Share2, AlertTriangle, Moon, Sun, Search, Calendar, CheckCircle, XCircle, Lock, Flame, Filter, Menu, Link, Plus, X, Users, GitBranch } from 'lucide-react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ToastProvider } from './components/ui/Toast';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import FirstAccess from './pages/FirstAccess';
import ChangePassword from './pages/ChangePassword';
import ForgotPassword from './pages/ForgotPassword';
import Profile from './pages/Profile';
import UsersPage from './pages/Users';
import ScaleWizard from './pages/ScaleWizard';
import PreScaleEditor from './pages/PreScaleEditor';
import EditPublishedSchedule from './pages/EditPublishedSchedule';
import PublicScheduleView from './pages/PublicScheduleView';
import Ministries from './pages/Ministries';
import History from './pages/History';
import Settings from './pages/Settings';
import TeamManager from './TeamManager';
import Home from './Home';
import Layout from './components/Layout';
import PreEscalaManager from './PreEscalaManager';
import PublicPreEscala from './PublicPreEscala';
import { lerPlanilha, gerarRascunho, MINISTERIOS_DEFAULT } from './logic';
import { exportarPDF, exportarExcel, exportarICS, copiarWhatsApp } from './exportManager';
import LZString from 'lz-string';
import { APP_VERSION } from './config';

const normalizeText = (text) => {
  if (!text) return "";
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

function Dashboard() {
  const location = useLocation();

  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ministerios, setMinisterios] = useState(Object.keys(MINISTERIOS_DEFAULT));
  const isDark = true; 
  const [escala, setEscala] = useState([]);
  const [disponiveis, setDisponiveis] = useState({});
  const [adicionaisManuais, setAdicionaisManuais] = useState([]);
  const [conflitos, setConflitos] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportType, setExportType] = useState(null);
  const [ministeriosExportacao, setMinisteriosExportacao] = useState(Object.keys(MINISTERIOS_DEFAULT));
  const [showManualAddModal, setShowManualAddModal] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [isEditing, setIsEditing] = useState(true);
  const [exportFilter, setExportFilter] = useState(""); 
  const [showPreEscala, setShowPreEscala] = useState(false); 
  const [showNovaEscalaConfirm, setShowNovaEscalaConfirm] = useState(false); 

  const [showTeamManager, setShowTeamManager] = useState(false);
  const [team, setTeam] = useState(() => {
    const saved = localStorage.getItem('webshift-team');
    if (saved) return JSON.parse(saved);
    return [
      { id: '1', name: 'Gabriel Marques', role: 'PRODUÇÃO', email: 'gabrielscm2005@gmail.com' },
      { id: '2', name: 'Gabi', role: 'TAKE', email: 'gabiflutter@gmail.com' }
    ];
  });

  useEffect(() => {
    const savedEscala = localStorage.getItem('webshift-escala');
    const savedDisponiveis = localStorage.getItem('webshift-disponiveis');
    const savedAdicionais = localStorage.getItem('webshift-adicionais');

    if (savedEscala) { setEscala(JSON.parse(savedEscala)); setStep(2); }
    if (savedDisponiveis) setDisponiveis(JSON.parse(savedDisponiveis));
    if (savedAdicionais) setAdicionaisManuais(JSON.parse(savedAdicionais));
  }, []);

  useEffect(() => {
    if (location.pathname === '/equipe') {
      setShowTeamManager(true);
    }
  }, [location.pathname]);

  useEffect(() => {
    if (escala.length > 0) localStorage.setItem('webshift-escala', JSON.stringify(escala));
    if (Object.keys(disponiveis).length > 0) localStorage.setItem('webshift-disponiveis', JSON.stringify(disponiveis));
    localStorage.setItem('webshift-adicionais', JSON.stringify(adicionaisManuais));
    localStorage.setItem('webshift-team', JSON.stringify(team));
  }, [escala, disponiveis, adicionaisManuais, team]);

  const contagemEscalas = useMemo(() => { const counts = {}; escala.forEach(slot => { if (slot.Voluntario !== "Não designado") counts[slot.Voluntario] = (counts[slot.Voluntario] || 0) + 1; }); return counts; }, [escala]);
  const LIMITE_AVISO = 5;
  
  const showToast = (message, type = 'success') => { setToast({ show: true, message, type }); setTimeout(() => setToast({ ...toast, show: false }), 3000); };
  const handleFileUpload = (e) => { if (e.target.files[0]) setFile(e.target.files[0]); };
  
  const handleGerar = async () => {
    if (!file) return showToast("Selecione um arquivo!", "error");
    setLoading(true);
    try {
      localStorage.removeItem('chorus_pre_escala');
      const df = await lerPlanilha(file);
      const { rascunho, disponiveis: disp, error, warnings } = gerarRascunho(df, ministerios, team);
      if (error) throw new Error(error);
      setEscala(rascunho);
      setDisponiveis(disp);
      setStep(2);
      verificarConflitos(rascunho);
      if (warnings && warnings.length > 0) {
        showToast(`${warnings.length} correções automáticas aplicadas!`, "warning");
      } else {
        showToast("Escala gerada com sucesso!");
      }
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const copyShareLink = () => { if (escala.length === 0) return showToast("Gere uma escala primeiro!", "error"); const jsonString = JSON.stringify(escala); const compressed = LZString.compressToEncodedURIComponent(jsonString); const url = `${window.location.origin}/share?d=${compressed}`; navigator.clipboard.writeText(url).then(() => { showToast("Link copiado!", "success"); }); };
  const openExportModal = (type) => { if (conflitos.length > 0) return showToast("Resolva conflitos!", "error"); setExportType(type); setShowExportModal(true); };
  
  const confirmExport = () => {
    let filtrada = escala.filter(slot => {
      let area = slot.AreaOriginal || 'OUTROS';
      if (slot.Funcao.includes('Fotografo') || slot.Funcao.includes('Suporte')) area = 'TAKE';
      if (slot.Funcao.includes('Filmagem') || slot.Funcao.includes('Câmera')) area = 'FILMAGEM';
      if (slot.Funcao.includes('PRODUÇÃO')) area = 'PRODUÇÃO';
      if (slot.Funcao.includes('PROJEÇÃO')) area = 'PROJEÇÃO';
      if (slot.Funcao.includes('ILUMINAÇÃO')) area = 'ILUMINAÇÃO';
      return ministeriosExportacao.includes(area);
    });
    if (exportFilter) filtrada = filtrada.filter(slot => slot.Voluntario === exportFilter);
    if (filtrada.length === 0) { showToast("Nada para exportar com esses filtros.", "error"); return; }
    if (exportType === 'pdf') exportarPDF(filtrada);
    if (exportType === 'excel') exportarExcel(filtrada);
    if (exportType === 'ics') exportarICS(filtrada);
    if (exportType === 'whatsapp') copyingToClipboard(filtrada);
    setShowExportModal(false);
  };

  const copyingToClipboard = (data) => copiarWhatsApp(data).then(() => showToast("Copiado!", "success")).catch(() => showToast("Erro", "error"));
  const adicionarPessoaManual = () => { if (!novoNome.trim()) return; if (adicionaisManuais.includes(novoNome)) { showToast("Já existe!", "error"); return; } setAdicionaisManuais([...adicionaisManuais, novoNome]); setNovoNome(""); setShowManualAddModal(false); showToast("Adicionado!", "success"); };
  const verificarConflitos = (dados) => { const map = {}; const conflitos = []; dados.forEach(slot => { if (slot.Voluntario === "Não designado") return; const key = `${slot.Data}-${slot.Voluntario}`; if (map[key]) conflitos.push(key); else map[key] = true; }); setConflitos(conflitos); };
  const handleChangeVoluntario = (idx, val) => { const nova = [...escala]; nova[idx].Voluntario = val; setEscala(nova); verificarConflitos(nova); };
  const itensFiltrados = escala.filter(item => { const termo = normalizeText(filtro); return normalizeText(item.Data).includes(termo) || normalizeText(item.Voluntario).includes(termo) || normalizeText(item.Funcao).includes(termo); });
  const escalaAgrupada = Object.groupBy ? Object.groupBy(itensFiltrados, ({ Data }) => Data) : itensFiltrados.reduce((acc, item) => { (acc[item.Data] = acc[item.Data] || []).push(item); return acc; }, {});

  const bgClass = 'bg-[#020617] text-white'; 
  const cardClass = 'bg-[#0f172a] border-blue-900/30 shadow-2xl'; 

  return (
    <div className={`w-full min-h-screen flex flex-col transition-colors duration-300 ${bgClass} font-sans`}>
      <main className="flex-1 w-full px-3 md:px-8 py-6 max-w-[1920px] mx-auto">
        {step === 1 && (
          <div className="w-full h-full flex justify-center items-start pt-8 md:pt-12 animate-fade-in-up">
            <div className={`w-full max-w-xl p-6 md:p-10 rounded-3xl ${cardClass} transition-all`}>
              <div className="text-center mb-8"><h2 className="text-2xl md:text-3xl font-bold mb-2">Gerar Escala</h2><p className="text-gray-500 text-sm font-medium">Carregue a planilha e deixe a IA organizar</p></div>
              <div className="space-y-6">
                <div className="space-y-6">
                  <div className="flex items-center justify-center w-full group"><label className={`flex flex-col items-center justify-center w-full h-40 md:h-52 border-2 border-dashed rounded-3xl cursor-pointer transition-all duration-300 border-blue-900/40 bg-[#020617]/50 hover:bg-[#0f172a] hover:border-blue-500`}><div className="flex flex-col items-center justify-center pt-5 pb-6"><div className="p-4 bg-blue-900/20 rounded-full mb-3 group-hover:scale-110 transition-transform shadow-inner"><Upload className="w-6 h-6 md:w-8 md:h-8 text-blue-400" /></div><p className="mb-1 text-sm font-bold text-slate-400 group-hover:text-blue-400 transition-colors">Clique para enviar</p><p className="text-xs text-slate-500 bg-[#020617] px-3 py-1 rounded-full border border-blue-900/30">.XLSX</p></div><input type="file" className="hidden" accept=".xlsx" onChange={handleFileUpload} /></label></div>
                  <button onClick={handleGerar} disabled={loading || !file} className={`w-full py-3.5 rounded-2xl font-bold text-base md:text-lg text-white shadow-xl transition-all transform hover:-translate-y-1 active:scale-95 flex justify-center items-center gap-3 ${loading || !file ? 'bg-slate-800 cursor-not-allowed shadow-none text-slate-500' : 'bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 shadow-blue-900/50'}`}>{loading ? "Processando..." : "Gerar Escala"} {!loading && <FileSpreadsheet size={20} />}</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in-up w-full">
            <div className={`py-3 px-4 -mx-3 md:mx-0 mb-6 border-b shadow-sm flex flex-col md:flex-row gap-3 justify-between items-center transition-colors rounded-2xl bg-[#0f172a] border-blue-900/30`}>
              <div className="relative w-full md:w-96 flex gap-2">
                <div className="relative flex-1"><Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-slate-500" size={18} /><input type="text" placeholder="Buscar..." value={filtro} onChange={(e) => setFiltro(e.target.value)} className={`w-full pl-10 pr-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-sm md:text-base bg-[#020617] border-blue-900/40 text-slate-200 placeholder-slate-600`} /></div>
                <button onClick={() => setShowManualAddModal(true)} className="p-2.5 rounded-xl border bg-blue-900/20 border-blue-900/50 text-blue-400 hover:bg-blue-900/40 transition-colors shadow-sm" title="Adicionar Pessoa Avulsa"><Plus size={20} /></button>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 w-full md:w-auto">
                <ExportBtn icon={<Download size={16} />} label="PDF" onClick={() => openExportModal('pdf')} color="blue" />
                <ExportBtn icon={<Share2 size={16} />} label="WhatsApp" onClick={() => openExportModal('whatsapp')} color="green" />
                <div className="hidden md:flex gap-2">
                  <ExportBtn icon={<FileSpreadsheet size={16} />} label="Excel" onClick={() => openExportModal('excel')} color="blue" />
                  <ExportBtn icon={<Calendar size={16} />} label="ICS" onClick={() => openExportModal('ics')} color="blue" />
                </div>
                <button
                  onClick={() => setShowPreEscala(true)}
                  className="px-3 py-2 rounded-lg text-xs font-bold bg-purple-900/20 text-purple-300 hover:bg-purple-900/40 transition-colors flex items-center gap-2 border border-purple-500/30"
                  title="Abrir Pré-Escala para Aprovação Colaborativa"
                >
                  <GitBranch size={16} />
                  <span className="hidden md:inline">Pré-Escala</span>
                </button>
                <ExportBtn icon={<Link size={16} />} label="Link" onClick={copyShareLink} color="purple" />
                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1 hidden md:block"></div>
                {!showNovaEscalaConfirm ? (
                  <button
                    onClick={() => setShowNovaEscalaConfirm(true)}
                    className="flex-1 md:flex-none px-4 py-2.5 text-sm font-bold text-red-500 bg-red-900/10 hover:bg-red-900/30 rounded-xl transition-colors whitespace-nowrap border border-red-900/30"
                  >
                    Nova
                  </button>
                ) : (
                  <div className="flex gap-2 items-center">
                    <span className="text-xs text-orange-400 font-bold whitespace-nowrap">Limpar tudo?</span>
                    <button
                      onClick={() => {
                        setStep(1);
                        setFile(null);
                        setEscala([]);
                        localStorage.removeItem('webshift-escala');
                        localStorage.removeItem('chorus_pre_escala');
                        setShowNovaEscalaConfirm(false);
                        showToast('Nova escala iniciada!', 'success');
                      }}
                      className="px-3 py-1.5 text-xs font-bold text-white bg-red-600 hover:bg-red-500 rounded-lg transition-colors"
                    >
                      Sim
                    </button>
                    <button
                      onClick={() => setShowNovaEscalaConfirm(false)}
                      className="px-3 py-1.5 text-xs font-bold text-slate-300 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                    >
                      Não
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6 w-full">
              {Object.keys(escalaAgrupada).map((data) => (
                <div key={data} className={`rounded-3xl transition-all duration-300 overflow-hidden flex flex-col w-full group ${cardClass}`}>
                  <div className="p-3 md:p-4 bg-gradient-to-r from-blue-700 to-indigo-700 text-white min-h-[56px] flex items-center justify-center text-center relative overflow-hidden shadow-sm">
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div><span className="text-sm font-bold break-words leading-tight w-full drop-shadow-md z-10 uppercase tracking-wide">{data}</span>
                  </div>
                  <div className="p-4 space-y-4 flex-1 bg-opacity-50">
                    {escalaAgrupada[data].map((slot) => {
                      const globalIndex = escala.indexOf(slot);
                      const isConflict = conflitos.includes(`${slot.Data}-${slot.Voluntario}`);
                      const count = contagemEscalas[slot.Voluntario] || 0;
                      const isBurnout = count > LIMITE_AVISO && slot.Voluntario !== "Não designado";

                      let areaKey = slot.AreaOriginal || 'TAKE';
                      if (slot.Funcao.includes('Fotografo') || slot.Funcao.includes('Suporte')) areaKey = 'TAKE';
                      if (slot.Funcao.includes('Filmagem') || slot.Funcao.includes('Câmera')) areaKey = 'FILMAGEM';
                      if (slot.Funcao.includes('PRODUÇÃO')) areaKey = 'PRODUÇÃO';

                      const optionsBase = disponiveis[slot.Data]?.[areaKey] || [];
                      const todasOpcoes = [...optionsBase, ...adicionaisManuais, slot.Voluntario, "Não designado"];
                      const dropdownOptions = [...new Set(todasOpcoes)].sort();

                      return (
                        <div key={globalIndex} className="flex flex-col gap-1 w-full">
                          <div className="flex justify-between items-center pl-2 pr-1">
                            <span className={`text-[10px] font-extrabold uppercase tracking-widest text-slate-500`}>{slot.Funcao}</span>
                            {isBurnout && <span className="text-[10px] font-bold text-orange-300 bg-orange-900/40 border border-orange-800 flex items-center gap-1 px-2 py-0.5 rounded-full animate-pulse shadow-sm"><Flame size={10} /> {count}</span>}
                          </div>
                          <div className="relative w-full group/input">
                            <select value={slot.Voluntario} onChange={(e) => handleChangeVoluntario(globalIndex, e.target.value)} className={`w-full p-3 text-sm rounded-xl border appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-blue-500/50 truncate pr-8 transition-all font-medium shadow-sm ${isConflict ? 'bg-red-900/20 border-red-800 text-red-400 ring-2 ring-red-900/50' : isBurnout ? 'border-orange-800 bg-orange-900/20 text-orange-200' : 'bg-[#020617]/50 border-blue-900/30 text-slate-200 hover:bg-[#020617] hover:border-blue-700'}`}>
                              {dropdownOptions.map(opt => <option key={opt} value={opt} className="bg-[#020617] text-gray-200">{opt}</option>)}
                            </select>
                            {isConflict && <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-500 animate-pulse"><AlertTriangle size={18} /></div>}
                          </div>
                          {isConflict && <span className="text-xs text-red-600 font-bold pl-2 flex items-center gap-1"><Lock size={10} /> Conflito Detectado</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {showManualAddModal && <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"><div className={`w-full max-w-sm p-6 rounded-3xl shadow-2xl bg-[#0f172a] border border-blue-900/30 animate-bounce-in`}><h3 className="text-xl font-bold mb-4 text-white">Adicionar Pessoa</h3><input type="text" placeholder="Nome" className={`w-full p-3 rounded-xl border mb-4 outline-none focus:ring-2 focus:ring-blue-500 bg-[#020617] border-blue-900/40 text-white`} value={novoNome} onChange={(e) => setNovoNome(e.target.value)} /><div className="flex gap-3"><button onClick={() => setShowManualAddModal(false)} className="flex-1 py-3 rounded-xl font-bold text-slate-400 hover:bg-white/5 transition-colors">Cancelar</button><button onClick={adicionarPessoaManual} className="flex-1 py-3 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700">Adicionar</button></div></div></div>}
      {showExportModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className={`w-full max-w-md p-6 rounded-3xl shadow-2xl bg-[#0f172a] border border-blue-900/30 animate-bounce-in`}>
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-white">Exportar</h3>
              <button onClick={() => setShowExportModal(false)}><X size={24} className="text-slate-400 hover:text-white" /></button>
            </div>
            <div className="mb-6">
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-widest">Filtrar por Pessoa (Opcional)</label>
              <select
                value={exportFilter}
                onChange={(e) => setExportFilter(e.target.value)}
                className="w-full p-3 rounded-xl border bg-[#020617] border-blue-900/40 text-white outline-none focus:ring-2 focus:ring-blue-500 appearance-none font-medium cursor-pointer"
              >
                <option value="">Todos (Geral)</option>
                {[...new Set(escala.map(s => s.Voluntario))].sort().filter(n => n !== "Não designado").map(vol => (
                  <option key={vol} value={vol}>{vol}</option>
                ))}
              </select>
            </div>
            <div className="bg-[#020617]/50 p-4 rounded-xl border border-blue-900/20 mb-6">
              <label className="block text-xs font-bold text-slate-500 mb-3 uppercase tracking-widest">Áreas</label>
              <div className="grid grid-cols-2 gap-3">
                {Object.keys(MINISTERIOS_DEFAULT).map(min => (
                  <label key={min} className={`flex items-center gap-2 p-2 rounded-lg border cursor-pointer transition-all ${ministeriosExportacao.includes(min) ? 'bg-blue-900/30 border-blue-500 text-blue-200' : 'border-blue-900/20 text-slate-400 hover:border-blue-500/50'}`}>
                    <input type="checkbox" className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-[#020617] border-blue-800" checked={ministeriosExportacao.includes(min)} onChange={(e) => { if (e.target.checked) setMinisteriosExportacao([...ministeriosExportacao, min]); else setMinisteriosExportacao(ministeriosExportacao.filter(m => m !== min)); }} />
                    <span className="text-[11px] font-bold">{min}</span>
                  </label>
                ))}
              </div>
            </div>
            <button onClick={confirmExport} className="w-full py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-500/30 transition-all transform hover:scale-[1.02]">
              {exportFilter ? `Exportar para ${exportFilter.split(' ')[0]}` : 'Exportar Tudo'}
            </button>
          </div>
        </div>
      )}
      {toast.show && <div className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl font-bold animate-bounce-in z-[70] flex items-center gap-3 transition-all whitespace-nowrap border ${toast.type === 'error' ? 'bg-red-900/90 border-red-700 text-white' : 'bg-blue-900/90 border-blue-700 text-white'}`}>{toast.type === 'success' ? <CheckCircle size={20} /> : <Lock size={20} />}<span className="text-sm">{toast.message}</span></div>}
      <footer className="py-6 text-center text-xs text-slate-600 font-medium"><p>ChorusApp v{APP_VERSION} • {new Date().getFullYear()}</p></footer>

      {showTeamManager && <TeamManager team={team} onUpdate={setTeam} onClose={() => setShowTeamManager(false)} isDark={isDark} />}
      {showPreEscala && <PreEscalaManager escala={escala} disponiveis={disponiveis} onClose={() => setShowPreEscala(false)} onPublish={(escalaFinal) => { showToast('Escala final publicada com sucesso!', 'success'); setShowPreEscala(false); }} isDark={isDark} />}
    </div>
  );
}

const ExportBtn = ({ icon, label, onClick, color = 'blue' }) => {
  const colorClasses = {
    blue: "bg-[#0f172a] text-blue-200 hover:bg-blue-900/30 hover:text-blue-100 border-blue-900/40 hover:border-blue-500",
    green: "bg-[#0f172a] text-green-200 hover:bg-green-900/30 hover:text-green-100 border-green-900/40 hover:border-green-500",
    purple: "bg-[#0f172a] text-purple-200 hover:bg-purple-900/30 hover:text-purple-100 border-blue-900/40 hover:border-purple-500",
  };
  const selectedClass = colorClasses[color] || colorClasses.blue;
  return <button onClick={onClick} className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow-md border ${selectedClass} whitespace-nowrap`}>{icon} {label}</button>;
};

function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <Routes>
          <Route element={<Layout />}>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/primeiro-acesso" element={<FirstAccess />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />

            {/* Public - Shared */}
            <Route path="/pre-escala/:id" element={<PublicPreEscala />} />
            <Route path="/public/:id" element={<PublicScheduleView />} />

            {/* Protected Routes */}
            <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/profile" element={<Profile />} />
            <Route path="/change-password" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
            <Route path="/wizard" element={<ProtectedRoute><ScaleWizard /></ProtectedRoute>} />
            <Route path="/pre-scale/:id" element={<ProtectedRoute><PreScaleEditor /></ProtectedRoute>} />
            <Route path="/schedules/:id/edit" element={<ProtectedRoute><EditPublishedSchedule /></ProtectedRoute>} />
            <Route path="/ministries" element={<ProtectedRoute requireAdmin><Ministries /></ProtectedRoute>} />
            <Route path="/users" element={<ProtectedRoute requireAdmin><UsersPage /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute requireAdmin><Settings /></ProtectedRoute>} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/historico" element={<History />} />

            {/* Fallback */}
            <Route path="*" element={<Home />} />
          </Route>
        </Routes>
      </AuthProvider>
    </ToastProvider>
  );
}

export default App;