import React, { createContext, useContext, useState, useEffect } from 'react';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';

/**
 * Toast System Global
 * 
 * Substitui todos os alert() do sistema
 * Tipos: success, error, warning, info
 */

const ToastContext = createContext();

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return context;
};

export function ToastProvider({ children }) {
    const [toasts, setToasts] = useState([]);

    const addToast = (message, type = 'info', duration = 3000) => {
        const id = Date.now();
        setToasts(prev => [...prev, { id, message, type, duration }]);

        if (duration > 0) {
            setTimeout(() => {
                removeToast(id);
            }, duration);
        }
    };

    const removeToast = (id) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
    };

    const toast = {
        success: (message, duration) => addToast(message, 'success', duration),
        error: (message, duration) => addToast(message, 'error', duration),
        warning: (message, duration) => addToast(message, 'warning', duration),
        info: (message, duration) => addToast(message, 'info', duration),
    };

    return (
        <ToastContext.Provider value={toast}>
            {children}
            <ToastContainer toasts={toasts} onRemove={removeToast} />
        </ToastContext.Provider>
    );
}

function ToastContainer({ toasts, onRemove }) {
    return (
        <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md">
            {toasts.map(toast => (
                <Toast key={toast.id} {...toast} onClose={() => onRemove(toast.id)} />
            ))}
        </div>
    );
}

function Toast({ id, message, type, onClose }) {
    const config = {
        success: {
            icon: CheckCircle,
            bgColor: 'bg-emerald-900',
            borderColor: 'border-emerald-500',
            textColor: 'text-emerald-100',
            iconColor: 'text-emerald-400',
        },
        error: {
            icon: AlertCircle,
            bgColor: 'bg-red-900',
            borderColor: 'border-red-500',
            textColor: 'text-red-100',
            iconColor: 'text-red-400',
        },
        warning: {
            icon: AlertTriangle,
            bgColor: 'bg-amber-900',
            borderColor: 'border-amber-500',
            textColor: 'text-amber-100',
            iconColor: 'text-amber-400',
        },
        info: {
            icon: Info,
            bgColor: 'bg-blue-900',
            borderColor: 'border-blue-500',
            textColor: 'text-blue-100',
            iconColor: 'text-blue-400',
        },
    };

    const { icon: Icon, bgColor, borderColor, textColor, iconColor } = config[type];

    return (
        <div
            className={`
        ${bgColor} ${borderColor} ${textColor}
        px-6 py-4 rounded-xl shadow-2xl border
        flex items-center gap-3
        animate-slide-in-right
        min-w-[300px]
      `}
        >
            <Icon size={20} className={iconColor} />
            <p className="font-medium flex-1">{message}</p>
            <button
                onClick={onClose}
                className="opacity-50 hover:opacity-100 transition-opacity"
            >
                <X size={16} />
            </button>
        </div>
    );
}

// Adicionar animação no CSS global (index.css)
// @keyframes slide-in-right {
//   from {
//     transform: translateX(100%);
//     opacity: 0;
//   }
//   to {
//     transform: translateX(0);
//     opacity: 1;
//   }
// }
// .animate-slide-in-right {
//   animation: slide-in-right 0.3s ease-out;
// }
