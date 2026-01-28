import React, { useState } from 'react';
import { Shield, CheckCircle, Zap } from 'lucide-react';

export default function LandingPage({ onStart }) {
    return (
        <div className="w-full min-h-screen bg-[#020617] text-white font-sans selection:bg-blue-500 selection:text-white">
            <nav className="fixed w-full z-40 bg-[#020617]/80 backdrop-blur-md border-b border-blue-900/30">
                <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600 rounded flex items-center justify-center text-white font-bold shadow-[0_0_15px_rgba(37,99,235,0.3)]">
                            <span className="text-xl">C</span>
                        </div>
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

            <footer className="border-t border-blue-900/30 py-8 bg-[#020617] text-sm mt-auto">
                <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">
                    <div className="text-slate-500">
                        <span className="font-bold text-slate-300">ChorusApp</span> © 2026
                    </div>
                    <div className="flex gap-6 text-slate-500">
                        <button className="hover:text-blue-400 transition-colors">Termos de Uso</button>
                        <button className="hover:text-blue-400 transition-colors">Privacidade</button>
                    </div>
                </div>
            </footer>
        </div>
    );
}
