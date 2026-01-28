import React, { useState } from 'react';
import { User, Trash2, Plus, Save, X, Edit2, Shield, Search, XCircle } from 'lucide-react';
import { MINISTERIOS_DEFAULT } from './logic';

export default function TeamManager({ team, onUpdate, onClose }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({ name: "", roles: [], email: "" });

    const [error, setError] = useState("");

    const roles = Object.keys(MINISTERIOS_DEFAULT);

    // Filter team
    const filteredTeam = team.filter(member => {
        const memberRoles = member.roles || (member.role ? [member.role] : []);
        const rolesString = memberRoles.join(" ").toLowerCase();
        return member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            rolesString.includes(searchTerm.toLowerCase());
    });

    const handleSave = () => {
        if (!formData.name.trim()) return;
        if (formData.roles.length === 0) {
            setError("Selecione pelo menos uma função.");
            setTimeout(() => setError(""), 3000);
            return;
        }

        // Validation: Check for duplicates
        const nameExists = team.some(m => m.name.toLowerCase() === formData.name.trim().toLowerCase() && m.id !== editingId);
        if (nameExists) {
            setError("Já existe um voluntário com este nome.");
            setTimeout(() => setError(""), 3000);
            return;
        }

        // Prepare data (remove legacy 'role' if present to strictly use 'roles')
        const dataToSave = {
            name: formData.name,
            roles: formData.roles,
            email: formData.email
        };

        if (editingId) {
            // Update existing
            onUpdate(team.map(m => m.id === editingId ? { ...dataToSave, id: editingId } : m));
        } else {
            // Add new
            onUpdate([...team, { ...dataToSave, id: Date.now().toString() }]);
        }

        setEditingId(null);
        setFormData({ name: "", roles: [], email: "" });
        setError(""); // Clear error on success
    };

    const handleEdit = (member) => {
        setEditingId(member.id);
        // Normalize legacy data
        const currentRoles = member.roles || (member.role ? [member.role] : []);
        setFormData({ name: member.name, email: member.email || "", roles: currentRoles });
        setError("");
    };

    const handleDelete = (id) => {
        if (confirm("Tem certeza que deseja remover?")) {
            onUpdate(team.filter(m => m.id !== id));
        }
    };

    const toggleRole = (role) => {
        setFormData(prev => {
            if (prev.roles.includes(role)) {
                return { ...prev, roles: prev.roles.filter(r => r !== role) };
            } else {
                return { ...prev, roles: [...prev.roles, role] };
            }
        });
    };

    // Force Navy Theme
    const bgClass = 'bg-[#0f172a] text-white border border-blue-900/30';
    const inputClass = `w-full p-3 rounded-xl border outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-[#020617] border-blue-900/40 text-white placeholder-slate-600`;

    return (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
            <div className={`w-full max-w-4xl max-h-[90vh] flex flex-col rounded-3xl shadow-2xl ${bgClass} overflow-hidden`}>

                {/* Header */}
                <div className="p-6 border-b border-blue-900/30 flex justify-between items-center bg-gradient-to-r from-blue-700 to-indigo-700 text-white">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-full backdrop-blur-sm">
                            <Shield size={24} className="text-white" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold">Gestão da Equipe</h2>
                            <p className="text-blue-100 text-sm opacity-90">Defina os ministérios de cada voluntário</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <X size={24} />
                    </button>
                </div>

                <div className="flex-1 overflow-auto p-0 md:p-6 flex flex-col md:flex-row gap-6">

                    {/* Sidebar / Form */}
                    <div className={`w-full md:w-1/3 p-5 rounded-2xl h-fit bg-[#020617]/50 border border-blue-900/30`}>
                        <h3 className="font-bold text-lg mb-4 flex items-center gap-2 text-white">
                            {editingId ? <Edit2 size={18} /> : <Plus size={18} />}
                            {editingId ? "Editar Voluntário" : "Novo Voluntário"}
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1 block text-slate-400">Nome Completo</label>
                                <input
                                    type="text"
                                    placeholder="Ex: João Silva"
                                    className={inputClass}
                                    value={formData.name}
                                    onChange={e => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1 block text-slate-400">Ministérios</label>
                                <div className="flex flex-wrap gap-2">
                                    {roles.map(r => {
                                        const isSelected = formData.roles.includes(r);
                                        return (
                                            <button
                                                key={r}
                                                onClick={() => toggleRole(r)}
                                                className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${isSelected ? 'bg-blue-600 border-blue-500 text-white shadow-lg shadow-blue-500/20' : 'bg-[#020617] border-blue-900/40 text-slate-400 hover:border-blue-500 hover:text-white'}`}
                                            >
                                                {r}
                                            </button>
                                        );
                                    })}
                                </div>
                                {formData.roles.length === 0 && <p className="text-[10px] text-red-400 mt-1 pl-1">Selecione pelo menos um.</p>}
                            </div>

                            <div>
                                <label className="text-xs font-bold uppercase tracking-wider opacity-70 mb-1 block text-slate-400">Email / Identificador</label>
                                <input
                                    type="text"
                                    placeholder="Para matching (opcional)"
                                    className={inputClass}
                                    value={formData.email}
                                    onChange={e => setFormData({ ...formData, email: e.target.value })}
                                />
                                <p className="text-[10px] opacity-60 mt-1 text-slate-500">Usado para identificar o usuário na planilha se o nome não bater exatamente.</p>
                            </div>

                            {error && (
                                <div className="p-3 bg-red-900/30 border border-red-500/50 rounded-xl text-red-200 text-sm flex items-center gap-2 animate-pulse">
                                    <XCircle size={16} /> {error}
                                </div>
                            )}

                            <div className="pt-2 flex gap-2">
                                {editingId && (
                                    <button
                                        onClick={() => { setEditingId(null); setFormData({ name: "", roles: [], email: "" }); setError(""); }}
                                        className="flex-1 py-3 rounded-xl border border-blue-900/40 font-bold hover:bg-white/5 transition text-slate-300"
                                    >
                                        Cancelar
                                    </button>
                                )}
                                <button
                                    onClick={handleSave}
                                    disabled={!formData.name || formData.roles.length === 0}
                                    className={`flex-1 py-3 rounded-xl font-bold text-white shadow-lg transition transform active:scale-95 flex justify-center items-center gap-2 ${!formData.name || formData.roles.length === 0 ? 'bg-slate-800 cursor-not-allowed text-slate-500' : 'bg-blue-600 hover:bg-blue-700'}`}
                                >
                                    <Save size={18} /> Salvar
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex-1 flex flex-col h-full min-h-[400px]">
                        <div className="relative mb-4">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 opacity-40 text-slate-400" size={18} />
                            <input
                                type="text"
                                placeholder="Buscar na equipe..."
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                                className={`w-full pl-10 pr-4 py-3 rounded-xl outline-none focus:ring-2 focus:ring-blue-500 bg-[#020617] border border-blue-900/40 text-white placeholder-slate-600`}
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                            {filteredTeam.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center opacity-40 text-slate-500">
                                    <User size={48} className="mb-2" />
                                    <p>Nenhum membro encontrado</p>
                                </div>
                            ) : (
                                filteredTeam.map(member => {
                                    const memberRoles = member.roles || (member.role ? [member.role] : []);
                                    return (
                                        <div key={member.id} className={`group flex items-center justify-between p-3 rounded-xl border transition-all bg-[#0f172a] border-blue-900/40 hover:border-blue-500 hover:shadow-lg hover:shadow-blue-900/20`}>
                                            <div className="flex items-center gap-3">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg bg-blue-900/30 text-blue-200 border border-blue-500/30`}>
                                                    {member.name.charAt(0).toUpperCase()}
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-slate-200">{member.name}</h4>
                                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                                        {memberRoles.map(r => (
                                                            <span key={r} className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-blue-950 text-blue-300 border border-blue-900`}>
                                                                {r}
                                                            </span>
                                                        ))}
                                                        {member.email && <span className="text-xs opacity-50 truncate max-w-[150px] text-slate-400 ml-1">{member.email}</span>}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button onClick={() => handleEdit(member)} className="p-2 rounded-lg hover:bg-white/10 text-blue-400" title="Editar">
                                                    <Edit2 size={16} />
                                                </button>
                                                <button onClick={() => handleDelete(member.id)} className="p-2 rounded-lg hover:bg-red-900/30 text-red-500" title="Excluir">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div className="mt-4 pt-4 border-t border-blue-900/30 text-xs text-center opacity-50 text-slate-400">
                            {team.length} voluntários cadastrados
                        </div>
                    </div>

                </div>
            </div>
        </div>
    );
}
