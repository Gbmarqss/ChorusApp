import React from 'react';
import { X, AlertTriangle } from 'lucide-react';

/**
 * Modal Component Reutilizável
 * 
 * Substitui todos os confirm() e prompt()
 * Tipos: default, danger, warning, info
 */

export default function Modal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    type = 'default', // default, danger, warning, info
    children,
    showCancel = true,
}) {
    if (!isOpen) return null;

    const typeConfig = {
        default: {
            confirmBg: 'bg-blue-600 hover:bg-blue-500',
            icon: null,
            iconColor: '',
        },
        danger: {
            confirmBg: 'bg-red-600 hover:bg-red-500',
            icon: AlertTriangle,
            iconColor: 'text-red-400',
        },
        warning: {
            confirmBg: 'bg-amber-600 hover:bg-amber-500',
            icon: AlertTriangle,
            iconColor: 'text-amber-400',
        },
        info: {
            confirmBg: 'bg-blue-600 hover:bg-blue-500',
            icon: null,
            iconColor: '',
        },
    };

    const config = typeConfig[type];
    const Icon = config.icon;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                        {Icon && <Icon size={24} className={config.iconColor} />}
                        <h3 className="text-xl font-bold text-white">{title}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-slate-400 hover:text-white transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Content */}
                <div className="mb-6">
                    {message && <p className="text-slate-300">{message}</p>}
                    {children}
                </div>

                {/* Actions */}
                <div className="flex gap-3 justify-end">
                    {showCancel && (
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-medium transition-colors"
                        >
                            {cancelText}
                        </button>
                    )}
                    {onConfirm && (
                        <button
                            onClick={() => {
                                onConfirm();
                                onClose();
                            }}
                            className={`px-4 py-2 rounded-lg text-white font-medium transition-colors ${config.confirmBg}`}
                        >
                            {confirmText}
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}

// Adicionar animações no CSS global (index.css)
// @keyframes fade-in {
//   from { opacity: 0; }
//   to { opacity: 1; }
// }
// @keyframes scale-in {
//   from {
//     transform: scale(0.95);
//     opacity: 0;
//   }
//   to {
//     transform: scale(1);
//     opacity: 1;
//   }
// }
// .animate-fade-in {
//   animation: fade-in 0.2s ease-out;
// }
// .animate-scale-in {
//   animation: scale-in 0.2s ease-out;
// }
