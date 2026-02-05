import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown, X, Check } from 'lucide-react';

export default function MultiSelect({
    label,
    options = [],
    value = [],
    onChange,
    placeholder = "Selecione...",
    disabled = false
}) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleOption = (optionValue) => {
        if (disabled) return;

        const newValue = value.includes(optionValue)
            ? value.filter(v => v !== optionValue)
            : [...value, optionValue];

        onChange(newValue);
    };

    const removeOption = (e, optionValue) => {
        e.stopPropagation();
        if (disabled) return;
        onChange(value.filter(v => v !== optionValue));
    };

    const selectedLabels = options
        .filter(opt => value.includes(opt.value))
        .map(opt => ({ value: opt.value, label: opt.label }));

    return (
        <div className="w-full" ref={containerRef}>
            {label && (
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">
                    {label}
                </label>
            )}

            <div
                className={`
                    relative w-full bg-[#020617] border rounded-xl p-2 min-h-[50px]
                    flex items-center flex-wrap gap-2 cursor-pointer transition-all
                    ${isOpen ? 'border-blue-500 ring-1 ring-blue-500' : 'border-blue-900/30 hover:border-blue-500/50'}
                    ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                `}
                onClick={() => !disabled && setIsOpen(!isOpen)}
            >
                {selectedLabels.length === 0 ? (
                    <span className="text-slate-500 ml-2">{placeholder}</span>
                ) : (
                    selectedLabels.map(item => (
                        <span
                            key={item.value}
                            className="bg-blue-900/40 text-blue-200 text-sm px-2 py-1 rounded-lg flex items-center gap-1 border border-blue-500/20"
                        >
                            {item.label}
                            <button
                                onClick={(e) => removeOption(e, item.value)}
                                className="hover:text-white hover:bg-red-500/20 rounded-full p-0.5 transition-colors"
                            >
                                <X size={12} />
                            </button>
                        </span>
                    ))
                )}

                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">
                    <ChevronDown size={16} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </div>

            {isOpen && (
                <div className="absolute z-50 mt-2 w-full max-w-[inherit] bg-[#0f172a] border border-blue-900/30 rounded-xl shadow-xl overflow-hidden animate-fade-in max-h-60 overflow-y-auto">
                    {options.length === 0 ? (
                        <div className="p-4 text-center text-slate-500 text-sm">Nenhuma opção disponível</div>
                    ) : (
                        options.map(option => {
                            const isSelected = value.includes(option.value);
                            return (
                                <div
                                    key={option.value}
                                    onClick={() => toggleOption(option.value)}
                                    className={`
                                        px-4 py-3 flex items-center justify-between cursor-pointer transition-colors text-sm
                                        ${isSelected ? 'bg-blue-900/20 text-blue-200' : 'text-slate-300 hover:bg-white/5'}
                                    `}
                                >
                                    <span>{option.label}</span>
                                    {isSelected && <Check size={16} className="text-blue-400" />}
                                </div>
                            );
                        })
                    )}
                </div>
            )}
        </div>
    );
}
