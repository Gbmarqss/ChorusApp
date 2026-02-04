import React, { useState } from 'react';
import { Eye, EyeOff, AlertCircle, CheckCircle } from 'lucide-react';

/**
 * Input Component Reutilizável
 * 
 * Features:
 * - Show/hide password
 * - Validação visual inline
 * - Estados: normal, error, success, disabled
 * - Ícones customizáveis
 */

export default function Input({
    type = 'text',
    label,
    value,
    onChange,
    placeholder,
    error,
    success,
    disabled = false,
    required = false,
    icon: Icon,
    className = '',
    ...props
}) {
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = type === 'password';
    const inputType = isPassword && showPassword ? 'text' : type;

    // Classes base
    const baseClasses = 'w-full px-4 py-3 rounded-xl border transition-all duration-200 outline-none';

    // Classes condicionais
    const stateClasses = error
        ? 'border-red-500 bg-red-900/10 text-red-100 focus:border-red-400 focus:ring-2 focus:ring-red-500/20'
        : success
            ? 'border-emerald-500 bg-emerald-900/10 text-emerald-100 focus:border-emerald-400 focus:ring-2 focus:ring-emerald-500/20'
            : 'border-slate-700 bg-slate-900/50 text-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20';

    const disabledClasses = disabled
        ? 'opacity-50 cursor-not-allowed'
        : 'hover:border-slate-600';

    return (
        <div className={`space-y-2 ${className}`}>
            {/* Label */}
            {label && (
                <label className="block text-sm font-medium text-slate-300">
                    {label}
                    {required && <span className="text-red-400 ml-1">*</span>}
                </label>
            )}

            {/* Input Container */}
            <div className="relative">
                {/* Ícone à esquerda */}
                {Icon && (
                    <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                        <Icon size={20} />
                    </div>
                )}

                {/* Input */}
                <input
                    type={inputType}
                    value={value}
                    onChange={onChange}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`
            ${baseClasses}
            ${stateClasses}
            ${disabledClasses}
            ${Icon ? 'pl-11' : ''}
            ${isPassword ? 'pr-11' : ''}
          `}
                    {...props}
                />

                {/* Botão Show/Hide Password */}
                {isPassword && (
                    <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 transition-colors"
                        tabIndex={-1}
                    >
                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                    </button>
                )}

                {/* Ícone de status (error/success) */}
                {!isPassword && (error || success) && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {error && <AlertCircle size={20} className="text-red-400" />}
                        {success && <CheckCircle size={20} className="text-emerald-400" />}
                    </div>
                )}
            </div>

            {/* Mensagem de erro/sucesso */}
            {error && (
                <p className="text-sm text-red-400 flex items-center gap-1.5">
                    <AlertCircle size={14} />
                    {error}
                </p>
            )}
            {success && (
                <p className="text-sm text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle size={14} />
                    {success}
                </p>
            )}
        </div>
    );
}
