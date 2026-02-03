import React, { useState } from 'react';
import { Upload, Calendar, ArrowRight, ArrowLeft, CheckCircle, FileSpreadsheet, AlertTriangle, Save } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useAuth } from '../contexts/AuthContext';
import { lerPlanilha, gerarRascunho, MINISTERIOS_DEFAULT } from '../logic';

// Sub-components for steps
const StepConfig = ({ data, onChange }) => (
    <div className="space-y-6 animate-fade-in">
        <div>
            <label className="block text-sm font-bold text-slate-400 mb-2 uppercase tracking-wider">Nome da Escala</label>
            <input
                type="text"
                placeholder="Ex: Escala Março 2026"
                value={data.name}
                onChange={(e) => onChange({ ...data, name: e.target.value })}
                className="w-full p-4 rounded-xl bg-[#020617] border border-blue-900/30 text-white focus:ring-2 focus:ring-blue-500 outline-none text-lg"
            />
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Mês de Referência</label>
                <input
                    type="month"
                    value={data.month}
                    onChange={(e) => onChange({ ...data, month: e.target.value })}
                    className="w-full p-3 rounded-xl bg-[#020617] border border-blue-900/30 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>
            <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Ano</label>
                <input
                    type="number"
                    value={data.year}
                    onChange={(e) => onChange({ ...data, year: e.target.value })}
                    className="w-full p-3 rounded-xl bg-[#020617] border border-blue-900/30 text-white focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>
        </div>
    </div>
);

const StepUpload = ({ onFileSelect, file, error }) => (
    <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-center w-full group">
            <label className={`flex flex-col items-center justify-center w-full h-64 border-2 border-dashed rounded-3xl cursor-pointer transition-all duration-300 ${file ? 'border-emerald-500/50 bg-emerald-900/10' : 'border-blue-900/40 bg-[#020617]/50 hover:bg-[#0f172a] hover:border-blue-500'}`}>
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                    <div className={`p-6 rounded-full mb-4 shadow-lg transition-transform group-hover:scale-110 ${file ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-600/20 text-blue-400'}`}>
                        {file ? <CheckCircle size={40} /> : <Upload size={40} />}
                    </div>
                    <p className="mb-2 text-lg font-bold text-white">
                        {file ? file.name : "Clique para selecionar a planilha"}
                    </p>
                    <p className="text-sm text-slate-400">
                        {file ? `${(file.size / 1024).toFixed(1)} KB` : "Suporta arquivos .XLSX"}
                    </p>
                </div>
                <input type="file" className="hidden" accept=".xlsx" onChange={onFileSelect} />
            </label>
        </div>
        {error && (
            <div className="p-4 rounded-xl bg-red-900/20 border border-red-500/30 text-red-200 flex items-center gap-3">
                <AlertTriangle size={20} />
                <span>{error}</span>
            </div>
        )}
    </div>
);

const StepReview = ({ data, previewData }) => (
    <div className="space-y-6 animate-fade-in">
        <div className="bg-[#020617]/50 p-6 rounded-2xl border border-blue-900/30">
            <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
                <FileSpreadsheet className="text-blue-400" />
                Resumo da Importação
            </h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="p-4 rounded-xl bg-[#0f172a] border border-blue-900/20">
                    <p className="text-xs text-slate-400 uppercase font-bold">Total de Linhas</p>
                    <p className="text-2xl font-bold text-white">{previewData?.length || 0}</p>
                </div>
                <div className="p-4 rounded-xl bg-[#0f172a] border border-blue-900/20">
                    <p className="text-xs text-slate-400 uppercase font-bold">Dias Encontrados</p>
                    <p className="text-2xl font-bold text-white">
                        {[...new Set(previewData?.map(i => i.Data))].length}
                    </p>
                </div>
            </div>
            <div className="p-4 rounded-xl bg-blue-900/10 border border-blue-500/20 text-blue-200 text-sm">
                <p>O sistema identificou {previewData?.length} posições de escala. Você poderá editar os voluntários após criar o rascunho.</p>
            </div>
        </div>
    </div>
);

export default function ScaleWizard() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);

    // Form State
    const [configData, setConfigData] = useState({
        name: `Escala ${new Date().toLocaleString('default', { month: 'long' })} ${new Date().getFullYear()}`,
        month: new Date().toISOString().slice(0, 7), // YYYY-MM
        year: new Date().getFullYear()
    });

    const [file, setFile] = useState(null);
    const [previewData, setPreviewData] = useState([]);
    const [disponiveisRef, setDisponiveisRef] = useState({});
    const [error, setError] = useState(null);

    const handleFileSelect = async (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setError(null);
        setLoading(true);

        try {
            // Process file immediately to preview
            const df = await lerPlanilha(selectedFile);
            // Default team is empty for initial parsing, matching logic will happen but best effort
            const { rascunho, disponiveis, error: parseError } = gerarRascunho(df, Object.keys(MINISTERIOS_DEFAULT), []);

            if (parseError) throw new Error(parseError);

            setPreviewData(rascunho);
            setDisponiveisRef(disponiveis);
        } catch (err) {
            console.error(err);
            setError(err.message || "Erro ao ler arquivo");
            setFile(null); // Reset on error
        } finally {
            setLoading(false);
        }
    };

    const handleNext = () => {
        if (step === 1 && !configData.name) return;
        if (step === 2 && !file) return;
        setStep(step + 1);
    };

    const handleBack = () => {
        setStep(step - 1);
    };

    const handleFinish = async () => {
        setLoading(true);
        try {
            // Save to Supabase
            const { data, error } = await supabase
                .from('pre_schedules')
                .insert([{
                    title: configData.name,
                    data: previewData,
                    availability: disponiveisRef, // Save availability map for suggestions
                    created_by: user.id, // Auth user ID
                    status: 'draft',
                    share_link: null
                }])
                .select()
                .single();

            if (error) throw error;

            // Navigate to the Pre-Escala Manager (Edit Mode)
            navigate(`/pre-scale/${data.id}`);

            // To make it immediately visible in the "Recent Scales" list or open the modal
            // We might need a way to open the specific ID. 
            // For now, let's just go home.

        } catch (err) {
            console.error(err);
            setError("Erro ao salvar no banco de dados: " + err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#020617] text-white p-4 px-6 animate-fade-in-up">
            <div className="max-w-2xl mx-auto pt-10">
                {/* Header */}
                <div className="mb-8 text-center">
                    <h1 className="text-3xl font-bold mb-2">Nova Escala</h1>
                    <div className="flex items-center justify-center gap-2 text-sm font-medium text-slate-400">
                        <span className={step >= 1 ? "text-blue-400" : ""}>1. Configuração</span>
                        <span className="text-slate-700">/</span>
                        <span className={step >= 2 ? "text-blue-400" : ""}>2. Upload</span>
                        <span className="text-slate-700">/</span>
                        <span className={step >= 3 ? "text-blue-400" : ""}>3. Revisão</span>
                    </div>
                </div>

                {/* Card */}
                <div className="bg-[#0f172a] border border-blue-900/30 rounded-3xl p-8 shadow-2xl relative overflow-hidden">
                    {/* Progress Bar */}
                    <div className="absolute top-0 left-0 h-1 bg-blue-900/30 w-full">
                        <div
                            className="h-full bg-blue-500 transition-all duration-500 ease-out"
                            style={{ width: `${(step / 3) * 100}%` }}
                        ></div>
                    </div>

                    {step === 1 && <StepConfig data={configData} onChange={setConfigData} />}
                    {step === 2 && <StepUpload onFileSelect={handleFileSelect} file={file} error={error} />}
                    {step === 3 && <StepReview data={configData} previewData={previewData} />}

                    {/* Actions */}
                    <div className="flex justify-between mt-8 pt-6 border-t border-blue-900/20">
                        {step > 1 ? (
                            <button
                                onClick={handleBack}
                                className="px-6 py-3 rounded-xl font-bold text-slate-400 hover:text-white hover:bg-white/5 transition-colors flex items-center gap-2"
                            >
                                <ArrowLeft size={20} /> Voltar
                            </button>
                        ) : (
                            <div></div> // Spacer
                        )}

                        {step < 3 ? (
                            <button
                                onClick={handleNext}
                                disabled={(step === 1 && !configData.name) || (step === 2 && !file) || loading}
                                className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center gap-2 ${(step === 1 && !configData.name) || (step === 2 && !file)
                                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-500 hover:scale-105'
                                    }`}
                            >
                                Próximo <ArrowRight size={20} />
                            </button>
                        ) : (
                            <button
                                onClick={handleFinish}
                                disabled={loading}
                                className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg transition-all flex items-center gap-2 ${loading ? 'bg-slate-700 cursor-wait' : 'bg-emerald-600 hover:bg-emerald-500 hover:scale-105 shadow-emerald-900/30'}`}
                            >
                                {loading ? 'Salvando...' : 'Criar Escala'} <Save size={20} />
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
