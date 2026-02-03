import React, { useState } from 'react';
import { Shield, CheckCircle, Zap, Github, Instagram, FileText, X, Users, Calendar, Share2, BrainCircuit, AlertTriangle, ArrowRight } from 'lucide-react';

export default function LandingPage({ onStart }) {
    const [showTerms, setShowTerms] = useState(false);

    return (
        <div className="w-full min-h-screen bg-[#020617] text-white font-sans selection:bg-blue-500 selection:text-white">
            <nav className="fixed w-full z-40 bg-[#020617]/80 backdrop-blur-md border-b border-blue-900/30">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="/favicon.jpg" alt="ChorusApp Logo" className="w-10 h-10 rounded-lg shadow-lg shadow-blue-500/20" />
                        <span className="text-lg font-bold tracking-tight font-mono text-blue-100">ChorusApp_</span>
                    </div>
                    <button onClick={onStart} className="bg-blue-600 text-white hover:bg-blue-500 px-6 py-2 rounded-lg font-bold text-sm transition-all shadow-lg hover:shadow-blue-900/50 hover:scale-105 border border-blue-500/50">
                        Acessar Sistema
                    </button>
                </div>
            </nav>

            <section className="pt-32 pb-20 px-6 relative overflow-hidden">
                <div className="max-w-7xl mx-auto flex flex-col lg:flex-row items-center gap-16">
                    <div className="flex-1 space-y-8 text-center lg:text-left z-10">
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-blue-800 bg-blue-950/50 text-xs text-blue-300 font-mono mx-auto lg:mx-0">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                            </span>
                            v2.0 Beta
                        </div>

                        <h1 className="text-5xl md:text-6xl font-bold leading-tight tracking-tight text-white">
                            Escalas de Voluntários <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">Sem Dor de Cabeça.</span>
                        </h1>

                        <p className="text-lg text-slate-400 leading-relaxed max-w-lg mx-auto lg:mx-0">
                            Adeus planilhas manuais e erros humanos. O ChorusApp utiliza algoritmos inteligentes para gerar escalas justas, gerenciar conflitos e organizar sua equipe de mídia em segundos.
                        </p>

                        <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
                            <button onClick={onStart} className="flex items-center justify-center gap-3 bg-blue-600 text-white px-8 py-4 rounded-xl font-bold hover:bg-blue-500 transition-all shadow-[0_0_20px_rgba(37,99,235,0.3)] hover:shadow-[0_0_30px_rgba(37,99,235,0.5)] transform hover:-translate-y-1">
                                <Zap size={20} fill="currentColor" />
                                Começar Agora
                            </button>
                        </div>
                    </div>

                    <div className="flex-1 relative w-full max-w-lg lg:max-w-xl group">
                        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl blur-3xl opacity-20 group-hover:opacity-30 transition-opacity duration-700"></div>
                        <div className="relative bg-[#0f172a] border border-blue-900/50 rounded-2xl p-2 shadow-2xl transform rotate-3 group-hover:rotate-0 transition-all duration-500">
                            <div className="bg-[#020617] rounded-xl overflow-hidden aspect-video relative flex flex-col">
                                <div className="h-8 bg-slate-900 w-full flex items-center px-4 gap-2 border-b border-slate-800">
                                    <div className="w-2.5 h-2.5 rounded-full bg-red-500/20"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/20"></div>
                                    <div className="w-2.5 h-2.5 rounded-full bg-green-500/20"></div>
                                </div>
                                <div className="flex-1 p-8 flex items-center justify-center">
                                    <div className="grid grid-cols-2 gap-4 w-full opacity-50">
                                        <div className="h-24 bg-slate-800 rounded-xl animate-pulse"></div>
                                        <div className="h-24 bg-slate-800 rounded-xl animate-pulse delay-75"></div>
                                        <div className="h-24 bg-slate-800 rounded-xl animate-pulse delay-150"></div>
                                        <div className="h-24 bg-slate-800 rounded-xl animate-pulse delay-200"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section - Why ChorusApp? */}
            <section className="py-24 bg-[#0f172a] border-y border-blue-900/30 relative overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full pointer-events-none">
                    <div className="absolute top-20 left-20 w-72 h-72 bg-blue-600/10 rounded-full blur-[100px]"></div>
                    <div className="absolute bottom-20 right-20 w-72 h-72 bg-indigo-600/10 rounded-full blur-[100px]"></div>
                </div>

                <div className="max-w-7xl mx-auto px-6 relative z-10">
                    <div className="text-center mb-16 max-w-3xl mx-auto">
                        <span className="text-blue-400 font-mono text-sm tracking-widest uppercase mb-4 block">Mude a forma de organizar</span>
                        <h2 className="text-3xl md:text-5xl font-bold mb-6">Tudo o que você precisa para <br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">liderar com excelência.</span></h2>
                        <p className="text-slate-400 text-lg">Criado para líderes de louvor e mídia que cansaram de lidar com planilhas quebradas e mensagens perdidas no WhatsApp.</p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        <div className="bg-[#020617] p-8 rounded-3xl border border-blue-900/30 hover:border-blue-500/50 transition-all hover:shadow-2xl hover:shadow-blue-900/10 group">
                            <div className="w-14 h-14 bg-blue-900/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <BrainCircuit className="text-blue-400" size={32} />
                            </div>
                            <h3 className="text-xl font-bold mb-3">IA de Escalonamento</h3>
                            <p className="text-slate-400 leading-relaxed">Não perca horas pensando em quem colocar. Nossa lógica inteligente sugere os melhores voluntários baseada na disponibilidade e histórico.</p>
                        </div>
                        <div className="bg-[#020617] p-8 rounded-3xl border border-blue-900/30 hover:border-blue-500/50 transition-all hover:shadow-2xl hover:shadow-blue-900/10 group">
                            <div className="w-14 h-14 bg-indigo-900/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Share2 className="text-indigo-400" size={32} />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Links de Disponibilidade</h3>
                            <p className="text-slate-400 leading-relaxed">Crie formulários personalizados automaticamente e envie para sua equipe. As respostas geram códigos que o sistema importa num clique.</p>
                        </div>
                        <div className="bg-[#020617] p-8 rounded-3xl border border-blue-900/30 hover:border-blue-500/50 transition-all hover:shadow-2xl hover:shadow-blue-900/10 group">
                            <div className="w-14 h-14 bg-emerald-900/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                                <Shield className="text-emerald-400" size={32} />
                            </div>
                            <h3 className="text-xl font-bold mb-3">Zero Conflitos</h3>
                            <p className="text-slate-400 leading-relaxed">O sistema alerta instantaneamente se você tentar escalar alguém que disse "Não" ou que já está em outra função no mesmo dia.</p>
                        </div>
                    </div>
                </div>
            </section>

            {/* How It Works */}
            <section className="py-24 px-6 relative">
                <div className="max-w-7xl mx-auto">
                    <div className="flex flex-col md:flex-row gap-16 items-center">
                        <div className="flex-1 space-y-10">
                            <div>
                                <h2 className="text-3xl md:text-4xl font-bold mb-6">Deixa o trabalho pesado com a gente.</h2>
                                <p className="text-slate-400 text-lg">Nosso fluxo de trabalho foi desenhado para reduzir em 90% o tempo que você gasta no computador.</p>
                            </div>

                            <div className="space-y-8">
                                <div className="flex gap-6 group">
                                    <div className="flex flex-col items-center">
                                        <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/20 z-10 group-hover:scale-110 transition-transform">1</div>
                                        <div className="w-0.5 h-full bg-blue-900/30 mt-2"></div>
                                    </div>
                                    <div className="pb-8">
                                        <h4 className="text-xl font-bold mb-2">Colete Disponibilidade</h4>
                                        <p className="text-slate-400">Gere um link no sistema, envie no WhatsApp e receba as respostas formatadas dos voluntários.</p>
                                    </div>
                                </div>
                                <div className="flex gap-6 group">
                                    <div className="flex flex-col items-center">
                                        <div className="w-10 h-10 rounded-full bg-[#0f172a] border border-blue-500 text-blue-400 flex items-center justify-center font-bold shadow-lg z-10 group-hover:bg-blue-600 group-hover:text-white transition-colors">2</div>
                                        <div className="w-0.5 h-full bg-blue-900/30 mt-2"></div>
                                    </div>
                                    <div className="pb-8">
                                        <h4 className="text-xl font-bold mb-2">Monte a Escala</h4>
                                        <p className="text-slate-400">Importe uma planilha ou use os dados coletados. O algoritmo preenche as lacunas automaticamente.</p>
                                    </div>
                                </div>
                                <div className="flex gap-6 group">
                                    <div className="flex flex-col items-center">
                                        <div className="w-10 h-10 rounded-full bg-[#0f172a] border border-blue-500 text-blue-400 flex items-center justify-center font-bold shadow-lg z-10 group-hover:bg-blue-600 group-hover:text-white transition-colors">3</div>
                                    </div>
                                    <div>
                                        <h4 className="text-xl font-bold mb-2">Compartilhe</h4>
                                        <p className="text-slate-400">Exporte em PDF profissional, Excel ou texto pronto para WhatsApp. Tudo formatado.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="flex-1 w-full relative">
                            <div className="absolute inset-0 bg-blue-500/20 blur-[120px] rounded-full"></div>
                            {/* Abstract UI Representation */}
                            <div className="relative bg-[#0f172a] border border-blue-900/50 rounded-2xl p-6 shadow-2xl rotate-2 hover:rotate-0 transition-all duration-500 w-full max-w-lg mx-auto">
                                <div className="flex items-center justify-between mb-6 border-b border-blue-900/30 pb-4">
                                    <div className="w-24 h-4 bg-slate-700 rounded animate-pulse"></div>
                                    <div className="flex gap-2">
                                        <div className="w-8 h-8 rounded-full bg-blue-900/50"></div>
                                        <div className="w-8 h-8 rounded-full bg-blue-900/50"></div>
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="flex items-center gap-4 p-3 rounded-xl bg-[#020617] border border-blue-900/20">
                                            <div className="w-10 h-10 rounded-lg bg-slate-800"></div>
                                            <div className="flex-1">
                                                <div className="w-32 h-3 bg-slate-700 rounded mb-2"></div>
                                                <div className="w-20 h-2 bg-slate-800 rounded"></div>
                                            </div>
                                            <CheckCircle className="text-emerald-500" size={20} />
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-6 flex justify-center">
                                    <button className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold text-sm w-full">Exportar Escala</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            <footer className="border-t border-blue-900/30 py-8 bg-[#020617] text-sm mt-auto">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-slate-500">
                        <span className="font-bold text-slate-300">ChorusApp</span> © 2026 • Desenvolvido por <a href="https://github.com/Gbmarqss" target="_blank" className="hover:text-blue-400 transition-colors">@Gbmarqss</a>
                    </div>
                    <div className="flex gap-6 text-slate-500 items-center">
                        <button onClick={() => setShowTerms(true)} className="hover:text-blue-400 transition-colors flex items-center gap-2">
                            <FileText size={16} /> Termos de Uso
                        </button>
                        <a href="https://github.com/Gbmarqss" target="_blank" className="hover:text-blue-400 transition-colors flex items-center gap-2">
                            <Github size={16} /> GitHub
                        </a>
                        <a href="https://instagram.com/gbmarqss" target="_blank" className="hover:text-blue-400 transition-colors flex items-center gap-2">
                            <Instagram size={16} /> Instagram
                        </a>
                    </div>
                </div>
            </footer>

            {/* Terms Modal */}
            {showTerms && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in">
                    <div className="relative bg-[#0f172a] border border-blue-900/50 rounded-2xl w-full max-w-2xl max-h-[80vh] flex flex-col shadow-2xl">
                        <div className="p-6 border-b border-blue-900/30 flex justify-between items-center sticky top-0 bg-[#0f172a] rounded-t-2xl z-10">
                            <h3 className="text-xl font-bold text-white flex items-center gap-2"><Shield className="text-blue-500" /> Termos de Uso e Responsabilidade</h3>
                            <button onClick={() => setShowTerms(false)} className="text-slate-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                        <div className="p-8 overflow-y-auto text-slate-300 space-y-6 text-sm leading-relaxed font-sans">
                            <div>
                                <h4 className="font-bold text-white mb-2 text-base">1. Serviço SaaS (Software as a Service)</h4>
                                <p className="text-slate-400">O <strong>ChorusApp</strong> é mudado de um software local para um serviço web. Ao utilizar, você acessa uma plataforma em nuvem (ou simulada localmente) sujeita a atualizações e manutenção sem aviso prévio.</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-white mb-2 text-base">2. Beta Gratuito</h4>
                                <p className="text-slate-400">O sistema está em fase <strong>Beta</strong>. O uso é gratuito, mas funcionalidades podem mudar. Não garantimos disponibilidade eterna das funções atuais.</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-white mb-2 text-base">3. Dados e Privacidade</h4>
                                <p className="text-slate-400">Seus dados de escala e voluntários são processados no seu navegador e/ou servidores do ChorusApp. Não vendemos suas informações. O uso responsável dos dados dos voluntários (GDPR/LGPD) é responsabilidade do líder que utiliza a ferramenta.</p>
                            </div>
                            <div>
                                <h4 className="font-bold text-white mb-2 text-base">4. Isenção de Garantias</h4>
                                <p className="text-slate-400 border-l-4 border-red-500/50 pl-4 py-1 bg-red-900/10">O SERVIÇO É "DA FORMA QUE ESTÁ". NÃO NOS RESPONSABILIZAMOS POR FALHAS NA ESCALA OU PERDA DE DADOS.</p>
                            </div>
                        </div>
                        <div className="p-4 border-t border-blue-900/30 bg-[#020617] rounded-b-2xl flex justify-end">
                            <button onClick={() => setShowTerms(false)} className="bg-blue-600 text-white font-bold px-6 py-2 rounded-xl hover:bg-blue-500 transition-colors shadow-lg shadow-blue-900/20">Entendido</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
