import React from 'react';
import { AlertTriangle, X } from 'lucide-react';

export default function ConfirmModal({ isOpen, onClose, onConfirm, title, message, type = 'danger' }) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#0f172a] border border-blue-900/30 rounded-2xl p-6 max-w-md w-full shadow-2xl scale-100 animate-scale-in">
                <div className="flex items-center gap-4 mb-4">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${type === 'danger' ? 'bg-red-900/20 text-red-500' : 'bg-blue-900/20 text-blue-500'
                        }`}>
                        <AlertTriangle size={24} />
                    </div>
                    <div>
                        <h3 className="text-xl font-bold text-white">{title}</h3>
                    </div>
                </div>

                <p className="text-slate-400 mb-8 leading-relaxed">
                    {message}
                </p>

                <div className="flex justify-end gap-3">
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-xl text-slate-400 font-bold hover:bg-white/5 transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={() => { onConfirm(); onClose(); }}
                        className={`px-6 py-2 rounded-xl text-white font-bold shadow-lg transition-transform hover:scale-105 active:scale-95 ${type === 'danger'
                                ? 'bg-red-600 hover:bg-red-500 shadow-red-900/20'
                                : 'bg-blue-600 hover:bg-blue-500 shadow-blue-900/20'
                            }`}
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        </div>
    );
}
