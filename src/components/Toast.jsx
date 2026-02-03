import React, { useEffect } from 'react';
import { AlertTriangle, CheckCircle, X } from 'lucide-react';

const Toast = ({ message, type = 'success', onClose }) => {
    useEffect(() => {
        const timer = setTimeout(() => {
            onClose();
        }, 3000);
        return () => clearTimeout(timer);
    }, [onClose]);

    return (
        <div className={`fixed bottom-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in ${type === 'error' ? 'bg-red-900 border border-red-500 text-white' : 'bg-emerald-900 border border-emerald-500 text-white'
            }`}>
            {type === 'error' ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
            <p className="font-bold">{message}</p>
            <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100"><X size={16} /></button>
        </div>
    );
};

export default Toast;
