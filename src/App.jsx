import React, { useState, useEffect, useMemo } from 'react';
import { Upload, FileSpreadsheet, Download, Share2, AlertTriangle, Moon, Sun, Search, Calendar, CheckCircle, XCircle, Lock, Flame, Filter, Menu } from 'lucide-react';
import { lerPlanilha, gerarRascunho, MINISTERIOS_DEFAULT } from './logic';
import { exportarPDF, exportarExcel, exportarICS, copiarWhatsApp } from './exportManager';

const normalizeText = (text) => {
  if (!text) return "";
  return text.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
};

function App() {
  const [step, setStep] = useState(1);
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [ministerios, setMinisterios] = useState(Object.keys(MINISTERIOS_DEFAULT));
  
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('webshift-theme');
    if (savedTheme) return savedTheme;
    return window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  });

  const [escala, setEscala] = useState([]);
  const [disponiveis, setDisponiveis] = useState({});
  const [conflitos, setConflitos] = useState([]);
  const [filtro, setFiltro] = useState("");
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const contagemEscalas = useMemo(() => {
    const counts = {};
    escala.forEach(slot => {
      if (slot.Voluntario !== "Não designado") {
        counts[slot.Voluntario] = (counts[slot.Voluntario] || 0) + 1;
      }
    });
    return counts;
  }, [escala]);

  const LIMITE_AVISO = 5;

  useEffect(() => {
    localStorage.setItem('webshift-theme', theme);
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  const toggleTheme = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ ...toast, show: false }), 3000);
  };

  const handleFileUpload = (e) => { if (e.target.files[0]) setFile(e.target.files[0]); };

  const handleGerar = async () => {
    if (!file) return showToast("Selecione um arquivo!", "error");
    setLoading(true);
    try {
      const df = await lerPlanilha(file);
      const { rascunho, disponiveis: disp, error } = gerarRascunho(df, ministerios);
      if (error) throw new Error(error);

      setEscala(rascunho);
      setDisponiveis(disp);
      setStep(2);
      verificarConflitos(rascunho);
      showToast("Escala gerada com sucesso!");
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleSafeExport = (type) => {
    if (conflitos.length > 0) return showToast("Resolva os conflitos antes de exportar!", "error");
    if (type === 'pdf') exportarPDF(escala);
    if (type === 'excel') exportarExcel(escala);
    if (type === 'ics') exportarICS(escala);
    if (type === 'whatsapp') {
        copiarWhatsApp(escala)
            .then(() => showToast("Copiado!", "success"))
            .catch(() => showToast("Erro.", "error"));
    }
  };

  const verificarConflitos = (dadosEscala) => {
    const mapDiaPessoa = {};
    const novosConflitos = [];
    dadosEscala.forEach((slot) => {
      if (slot.Voluntario === "Não designado") return;
      const key = `${slot.Data}-${slot.Voluntario}`;
      if (mapDiaPessoa[key]) novosConflitos.push(key);
      else mapDiaPessoa[key] = true;
    });
    setConflitos(novosConflitos);
  };

  const handleChangeVoluntario = (index, novoValor) => {
    const novaEscala = [...escala];
    novaEscala[index].Voluntario = novoValor;
    setEscala(novaEscala);
    verificarConflitos(novaEscala);
  };

  const itensFiltrados = escala.filter(item => {
    const termo = normalizeText(filtro);
    return normalizeText(item.Data).includes(termo) || normalizeText(item.Voluntario).includes(termo) || normalizeText(item.Funcao).includes(termo);
  });

  const escalaAgrupada = Object.groupBy ? Object.groupBy(itensFiltrados, ({ Data }) => Data) : itensFiltrados.reduce((acc, item) => {
    (acc[item.Data] = acc[item.Data] || []).push(item);
    return acc;
  }, {});

  // --- PALETA DE CORES AJUSTADA (Mais contraste no Light Mode) ---
  const isDark = theme === 'dark';
  const bgClass = isDark ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-900';
  // Cards agora têm borda mais visível e sombra melhor no modo claro
  const cardClass = isDark ? 'bg-gray-800 border-gray-700 shadow-lg' : 'bg-white border-gray-300 shadow-md';

  return (
    <div className={`w-full min-h-screen flex flex-col transition-colors duration-300 ${bgClass} font-sans`}>
      {/* Header Fixo */}
      <header className={`w-full px-4 md:px-8 py-3 shadow-md ${isDark ? 'bg-gray-800/95 border-gray-700' : 'bg-white/95 border-gray-300'} backdrop-blur-md flex justify-between items-center sticky top-0 z-50 border-b`}>
        <div className="flex items-center gap-3">
          <img 
            src="/favicon.jpg" 
            alt="WebShift Logo" 
            className="w-9 h-9 md:w-10 md:h-10 object-contain drop-shadow-sm hover:scale-105 transition-transform" 
          />
          <h1 className="text-xl md:text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-700 dark:from-blue-400 dark:to-indigo-400">
            WebShift
          </h1>
        </div>
        <button onClick={toggleTheme} className={`p-2 md:p-2.5 rounded-full transition-all active:scale-95 border ${isDark ? 'bg-gray-700 border-gray-600 hover:bg-gray-600' : 'bg-gray-100 border-gray-300 hover:bg-gray-200'}`}>
          {isDark ? <Sun size={20} className="text-yellow-400"/> : <Moon size={20} className="text-slate-700"/>}
        </button>
      </header>

      <main className="flex-1 w-full px-3 md:px-8 py-6 max-w-[1920px] mx-auto">
        
        {step === 1 && (
          <div className="w-full h-full flex justify-center items-start pt-8 md:pt-12 animate-fade-in-up">
            <div className={`w-full max-w-xl p-6 md:p-10 rounded-3xl ${cardClass} transition-all`}>
              <div className="text-center mb-8">
                <h2 className="text-2xl md:text-3xl font-bold mb-2">Gerar Escala</h2>
                <p className="text-gray-500 text-sm font-medium">Carregue a planilha e deixe a IA organizar</p>
              </div>

              <div className="space-y-6">
                <div className="flex flex-wrap gap-2 justify-center">
                  {Object.keys(MINISTERIOS_DEFAULT).map(min => (
                    <label key={min} className={`
                      flex items-center space-x-2 cursor-pointer px-4 py-2 rounded-full border transition-all select-none text-xs md:text-sm font-bold
                      ${ministerios.includes(min) 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-md dark:bg-blue-600 dark:border-blue-500' 
                        : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300'}
                    `}>
                      <input 
                        type="checkbox" 
                        checked={ministerios.includes(min)}
                        onChange={(e) => {
                          if(e.target.checked) setMinisterios([...ministerios, min]);
                          else setMinisterios(ministerios.filter(m => m !== min));
                        }}
                        className="hidden"
                      />
                      <span>{min}</span>
                      {ministerios.includes(min) && <CheckCircle size={14} className="ml-1 text-white"/>}
                    </label>
                  ))}
                </div>

                <div className="flex items-center justify-center w-full group">
                  <label className={`flex flex-col items-center justify-center w-full h-40 md:h-52 border-2 border-dashed rounded-3xl cursor-pointer transition-all duration-300
                    ${isDark 
                      ? 'border-gray-600 bg-gray-800/50 hover:bg-gray-800 hover:border-blue-500' 
                      : 'border-gray-400 bg-gray-50 hover:bg-white hover:border-blue-600 hover:shadow-lg'}`}>
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <div className="p-4 bg-blue-100 dark:bg-gray-700 rounded-full mb-3 group-hover:scale-110 transition-transform shadow-inner">
                        <Upload className="w-6 h-6 md:w-8 md:h-8 text-blue-600 dark:text-blue-400" />
                      </div>
                      <p className="mb-1 text-sm font-bold text-gray-600 dark:text-gray-400 group-hover:text-blue-600 transition-colors">Clique para enviar</p>
                      <p className="text-xs text-gray-500 bg-gray-200 dark:bg-gray-700 px-3 py-1 rounded-full border border-gray-300 dark:border-gray-600">.XLSX</p>
                    </div>
                    <input type="file" className="hidden" accept=".xlsx" onChange={handleFileUpload} />
                  </label>
                </div>

                <button 
                  onClick={handleGerar}
                  disabled={loading || !file}
                  className={`w-full py-3.5 rounded-2xl font-bold text-base md:text-lg text-white shadow-xl transition-all transform hover:-translate-y-1 active:scale-95 flex justify-center items-center gap-3
                    ${loading || !file ? 'bg-gray-400 cursor-not-allowed shadow-none' : 'bg-gradient-to-r from-blue-700 to-indigo-700 hover:from-blue-600 hover:to-indigo-600 shadow-blue-500/30'}`}
                >
                  {loading ? "Processando..." : "Gerar Escala"}
                  {!loading && <FileSpreadsheet size={20} />}
                </button>
              </div>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="animate-fade-in-up w-full">
            {/* Toolbar */}
            <div className={`py-3 px-4 -mx-3 md:mx-0 mb-6 border-b shadow-sm flex flex-col md:flex-row gap-3 justify-between items-center transition-colors rounded-2xl
              ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-300'}`}>
              
              <div className="relative w-full md:w-96">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="text" 
                  placeholder="Buscar..." 
                  value={filtro}
                  onChange={(e) => setFiltro(e.target.value)}
                  className={`w-full pl-10 pr-4 py-2.5 rounded-xl border focus:ring-2 focus:ring-blue-500 outline-none transition-all font-medium text-sm md:text-base 
                    ${isDark ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' : 'bg-gray-50 border-gray-300 text-gray-800 placeholder-gray-500 focus:bg-white'}`}
                />
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2 w-full md:w-auto">
                <ExportBtn icon={<Download size={16}/>} label="PDF" onClick={() => handleSafeExport('pdf')} color="blue" />
                <ExportBtn icon={<FileSpreadsheet size={16}/>} label="Excel" onClick={() => handleSafeExport('excel')} color="blue" />
                <ExportBtn icon={<Calendar size={16}/>} label="ICS" onClick={() => handleSafeExport('ics')} color="blue" />
                <ExportBtn icon={<Share2 size={16}/>} label="WhatsApp" onClick={() => handleSafeExport('whatsapp')} color="green" />
                
                <div className="w-px h-6 bg-gray-300 dark:bg-gray-600 mx-1 hidden md:block"></div>
                
                <button 
                  onClick={() => { setStep(1); setFile(null); }}
                  className="flex-1 md:flex-none px-4 py-2.5 text-sm font-bold text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/40 rounded-xl transition-colors whitespace-nowrap border border-red-200 dark:border-red-900/50 shadow-sm"
                >
                  Nova
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4 md:gap-6 w-full">
              {Object.keys(escalaAgrupada).map((data) => (
                <div key={data} className={`rounded-3xl transition-all duration-300 overflow-hidden flex flex-col w-full group hover:-translate-y-1 ${cardClass}`}>
                  <div className="p-3 md:p-4 bg-gradient-to-r from-blue-700 to-indigo-700 text-white min-h-[56px] flex items-center justify-center text-center relative overflow-hidden shadow-sm">
                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                    <span className="text-sm font-bold break-words leading-tight w-full drop-shadow-md z-10 uppercase tracking-wide">{data}</span>
                  </div>
                  
                  <div className="p-4 space-y-4 flex-1 bg-opacity-50">
                    {escalaAgrupada[data].map((slot) => {
                      const globalIndex = escala.indexOf(slot); 
                      const isConflict = conflitos.includes(`${slot.Data}-${slot.Voluntario}`);
                      
                      const count = contagemEscalas[slot.Voluntario] || 0;
                      const isBurnout = count > LIMITE_AVISO && slot.Voluntario !== "Não designado";

                      const options = disponiveis[slot.Data]?.[slot.AreaOriginal || 'TAKE'] || [];
                      const dropdownOptions = [...new Set([...options, slot.Voluntario, "Não designado"])].sort();

                      return (
                        <div key={globalIndex} className="flex flex-col gap-1 w-full">
                          <div className="flex justify-between items-center pl-2 pr-1">
                            <span className={`text-[10px] font-extrabold uppercase tracking-widest ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {slot.Funcao}
                            </span>
                            {/* AJUSTE AQUI: Cor do Burnout para ficar visível no branco */}
                            {isBurnout && (
                              <span title={`${slot.Voluntario} tem ${count} escalas.`} className="text-[10px] font-bold text-orange-700 bg-orange-100 border border-orange-300 dark:bg-orange-900/40 dark:text-orange-200 dark:border-orange-800 flex items-center gap-1 px-2 py-0.5 rounded-full animate-pulse shadow-sm">
                                <Flame size={10}/> {count}
                              </span>
                            )}
                          </div>
                          
                          <div className="relative w-full group/input">
                            <select
                              value={slot.Voluntario}
                              onChange={(e) => handleChangeVoluntario(globalIndex, e.target.value)}
                              className={`w-full p-3 text-sm rounded-xl border appearance-none cursor-pointer outline-none focus:ring-2 focus:ring-blue-500/50 truncate pr-8 transition-all font-medium shadow-sm
                                ${isConflict 
                                  ? 'bg-red-50 border-red-300 text-red-700 ring-2 ring-red-200' 
                                  : isBurnout 
                                    ? 'border-orange-300 bg-orange-50 dark:bg-orange-900/10 dark:border-orange-700'
                                    // AJUSTE AQUI: Dropdown cinza claro no modo claro para contraste
                                    : isDark ? 'bg-gray-900/50 border-gray-700 text-white hover:bg-gray-900' : 'bg-gray-50 border-gray-300 text-gray-800 hover:border-blue-400 hover:bg-white'
                                }`}
                            >
                              {dropdownOptions.map(opt => (
                                <option key={opt} value={opt}>{opt}</option>
                              ))}
                            </select>
                            
                            {isConflict && (
                              <div className="absolute right-3 top-1/2 -translate-y-1/2 text-red-600 animate-pulse">
                                <AlertTriangle size={18} />
                              </div>
                            )}
                          </div>
                          {isConflict && <span className="text-xs text-red-600 font-bold pl-2 flex items-center gap-1"><Lock size={10}/> Conflito Detectado</span>}
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
            
             {Object.keys(escalaAgrupada).length === 0 && (
              <div className="text-center py-20 flex flex-col items-center opacity-50 animate-pulse">
                <Search size={48} className="mb-4 text-gray-400"/>
                <p className="text-xl font-medium text-gray-500">Nenhum resultado para "{filtro}"</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* Toast */}
      {toast.show && (
        <div className={`fixed bottom-8 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-2xl font-bold animate-bounce-in z-50 flex items-center gap-3 transition-all whitespace-nowrap border
          ${toast.type === 'error' ? 'bg-red-600 border-red-700 text-white' : 'bg-gray-800 border-gray-900 text-white dark:bg-white dark:border-gray-200 dark:text-gray-900'}`}>
           {toast.type === 'success' ? <CheckCircle size={20}/> : <Lock size={20}/>}
           <span className="text-sm">{toast.message}</span>
        </div>
      )}
    </div>
  );
}

// Botões com cores ajustadas para contraste
const ExportBtn = ({ icon, label, onClick, color = 'blue' }) => {
  const colorClasses = {
    // Azul mais sólido no modo claro
    blue: "bg-white text-blue-700 hover:bg-blue-50 hover:text-blue-800 border-gray-300 hover:border-blue-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:border-blue-500 dark:hover:text-blue-400",
    green: "bg-white text-green-700 hover:bg-green-50 hover:text-green-800 border-gray-300 hover:border-green-300 dark:bg-gray-800 dark:text-gray-200 dark:border-gray-700 dark:hover:border-green-500 dark:hover:text-green-400",
  };

  const selectedClass = colorClasses[color] || colorClasses.blue;

  return (
    <button 
      onClick={onClick}
      className={`flex-1 md:flex-none flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all shadow-sm hover:shadow-md border ${selectedClass} whitespace-nowrap`}
    >
      {icon} {label}
    </button>
  );
};

export default App;