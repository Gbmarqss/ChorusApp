import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Search, Shield, Trash2, Edit2, Save, X, Plus, UserPlus, Mail, CheckCircle, Clock, AlertTriangle, Link as LinkIcon, Copy } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import ConfirmModal from '../components/ConfirmModal';
import InviteUserModal from '../components/InviteUserModal';

// Toast Component Local (reused pattern)
const Toast = ({ message, type = 'success', onClose }) => (
    <div className={`fixed bottom-4 right-4 z-50 px-6 py-4 rounded-xl shadow-2xl flex items-center gap-3 animate-slide-in ${type === 'error' ? 'bg-red-900 border border-red-500 text-white' : 'bg-emerald-900 border border-emerald-500 text-white'
        }`}>
        {type === 'error' ? <AlertTriangle size={20} /> : <CheckCircle size={20} />}
        <p className="font-bold">{message}</p>
        <button onClick={onClose} className="ml-2 opacity-50 hover:opacity-100"><X size={16} /></button>
    </div>
);

export default function Users() {
    const { user: currentUser } = useAuth();

    // Data States
    const [users, setUsers] = useState([]);
    const [invites, setInvites] = useState([]); // Whitelist
    const [ministries, setMinistries] = useState([]);

    // UI States
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [activeTab, setActiveTab] = useState('active'); // 'active' | 'invites'

    // Edit State
    const [editingUser, setEditingUser] = useState(null);
    const [editForm, setEditForm] = useState({});

    // Modals & Toast
    const [toast, setToast] = useState(null);
    const [modal, setModal] = useState({ isOpen: false, title: '', message: '', onConfirm: () => { } });
    const [inviteModalOpen, setInviteModalOpen] = useState(false);

    useEffect(() => {
        loadData();
    }, []);

    const showToast = (message, type = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const loadData = async () => {
        try {
            setLoading(true);

            // 1. Fetch Ministries (Reference)
            const { data: minData } = await supabase.from('ministries').select('*');
            setMinistries(minData || []);

            // 2. Fetch Active Users
            const { data: usersData, error: usersError } = await supabase
                .from('users')
                .select('*, ministry:ministries(id, name)')
                .order('name');
            if (usersError) throw usersError;
            setUsers(usersData || []);

            // 3. Fetch Invites (Allowed Emails)
            const { data: invitesData, error: invitesError } = await supabase
                .from('allowed_emails')
                .select('*, ministry:ministries(id,name)')
                .order('created_at', { ascending: false });

            if (invitesError) console.error('Error fetching invites:', invitesError); // Non-critical if policy fails for non-admins (but this page is admin only)
            setInvites(invitesData || []);

        } catch (error) {
            console.error('Error loading data:', error);
            showToast('Erro ao carregar dados.', 'error');
        } finally {
            setLoading(false);
        }
    };

    // --- Active User Actions ---
    const handleEdit = (user) => {
        setEditingUser(user.id);
        setEditForm({
            role: user.role,
            ministry_id: user.ministry_id
        });
    };

    const handleSave = async (id) => {
        try {
            const { error } = await supabase.from('users').update(editForm).eq('id', id);
            if (error) throw error;

            const updatedMinistry = ministries.find(m => m.id === editForm.ministry_id) || null;
            setUsers(users.map(u => u.id === id ? { ...u, ...editForm, ministry: updatedMinistry } : u));
            setEditingUser(null);
            showToast("Usuário atualizado com sucesso!");
        } catch (err) {
            showToast('Erro ao atualizar: ' + err.message, 'error');
        }
    };

    const confirmDelete = (userToDelete) => {
        setModal({
            isOpen: true,
            title: 'Remover Membro',
            message: `Tem certeza que deseja remover ${userToDelete.name}? Essa ação retira o acesso dele aos dados da igreja.`,
            type: 'danger',
            onConfirm: () => handleDelete(userToDelete)
        });
    };

    const handleDelete = async (userToDelete) => {
        try {
            const { error } = await supabase.from('users').delete().eq('id', userToDelete.id);
            if (error) throw error;
            setUsers(users.filter(u => u.id !== userToDelete.id));
            showToast(`${userToDelete.name} foi removido.`);
        } catch (err) {
            showToast('Erro ao deletar: ' + err.message, 'error');
        }
    };

    // --- Invite Actions ---
    const confirmDeleteInvite = (id, email) => {
        setModal({
            isOpen: true,
            title: 'Revogar Convite',
            message: `Deseja cancelar o convite para ${email}? O usuário não poderá mais se cadastrar.`,
            type: 'danger',
            onConfirm: () => handleDeleteInvite(id)
        });
    };

    const handleDeleteInvite = async (id) => {
        try {
            const { error } = await supabase.from('allowed_emails').delete().eq('id', id);
            if (error) throw error;
            setInvites(invites.filter(i => i.id !== id));
            showToast('Convite revogado.');
        } catch (err) {
            showToast('Erro: ' + err.message, 'error');
        }
    };

    // --- Invite Link Logic ---
    const [linkModalOpen, setLinkModalOpen] = useState(false);
    const [generatedLink, setGeneratedLink] = useState('');

    const generateLink = async () => {
        try {
            const token = crypto.randomUUID();
            const { error } = await supabase.from('invite_links').insert([{
                token,
                role: 'viewer',
                created_by: currentUser.id,
                active: true
            }]);

            if (error) throw error;
            setGeneratedLink(`${window.location.origin}/register?token=${token}`);
            setLinkModalOpen(true);
        } catch (err) {
            console.error(err);
            showToast('Erro ao gerar link.', 'error');
        }
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredInvites = invites.filter(i =>
        i.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-fade-in-up pb-20">
            {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

            <ConfirmModal
                isOpen={modal.isOpen}
                onClose={() => setModal({ ...modal, isOpen: false })}
                onConfirm={modal.onConfirm}
                title={modal.title}
                message={modal.message}
                type={modal.type}
            />

            <InviteUserModal
                isOpen={inviteModalOpen}
                onClose={() => setInviteModalOpen(false)}
                onSuccess={() => {
                    showToast('Convite enviado com sucesso!');
                    loadData();
                }}
                ministries={ministries}
            />

            {/* Link Result Modal */}
            {linkModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
                    <div className="bg-[#0f172a] border border-blue-900/30 rounded-2xl p-6 max-w-md w-full shadow-2xl animate-scale-in">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xl font-bold flex items-center gap-2"><LinkIcon size={20} className="text-emerald-400" /> Link de Convite Gerado</h3>
                            <button onClick={() => setLinkModalOpen(false)} className="text-slate-400 hover:text-white"><X size={20} /></button>
                        </div>
                        <p className="text-slate-400 text-sm mb-4">Qualquer pessoa com este link poderá se cadastrar.</p>

                        <div className="bg-[#020617] p-3 rounded-lg flex items-center justify-between border border-slate-800 mb-6 gap-2">
                            <code className="text-blue-400 text-xs break-all">{generatedLink}</code>
                            <button
                                onClick={() => {
                                    navigator.clipboard.writeText(generatedLink);
                                    showToast('Link copiado!');
                                }}
                                className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300 transition-colors shrink-0"
                            >
                                <Copy size={16} />
                            </button>
                        </div>

                        <button onClick={() => setLinkModalOpen(false)} className="w-full py-2 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-bold">Concluído</button>
                    </div>
                </div>
            )}

            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white">Gerenciar Equipe</h1>
                    <p className="text-slate-400 mt-1">Controle de acesso e permissões</p>
                </div>

                <div className="flex gap-3 w-full md:w-auto">
                    <button
                        onClick={generateLink}
                        className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all border border-slate-700"
                    >
                        <LinkIcon size={18} /> Link Público
                    </button>
                    <button
                        onClick={() => setInviteModalOpen(true)}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg hover:shadow-blue-500/20 transition-all"
                    >
                        <UserPlus size={20} /> Convidar Membro
                    </button>
                </div>
            </div>

            {/* Tabs & Search */}
            <div className="flex flex-col md:flex-row justify-between items-center gap-4 border-b border-blue-900/30 pb-4">
                <div className="flex gap-2 p-1 bg-[#020617] rounded-xl border border-blue-900/30">
                    <button
                        onClick={() => setActiveTab('active')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'active' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        Membros Ativos ({users.length})
                    </button>
                    <button
                        onClick={() => setActiveTab('invites')}
                        className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'invites' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                    >
                        Convites Pendentes ({invites.length})
                    </button>
                </div>

                <div className="relative w-full md:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                        type="text"
                        placeholder={activeTab === 'active' ? "Buscar membros..." : "Buscar convites..."}
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-[#0f172a] border border-blue-900/30 text-white focus:ring-2 focus:ring-blue-500 outline-none placeholder-slate-500 transition-all"
                    />
                </div>
            </div>

            {/* Content Area */}
            <div className="bg-[#0f172a] border border-blue-900/30 rounded-2xl overflow-hidden shadow-xl min-h-[400px]">
                {activeTab === 'active' ? (
                    // --- ACTIVE USERS TABLE ---
                    <div className="overflow-x-auto">
                        <table className="w-full whitespace-nowrap">
                            <thead className="bg-[#020617]/50 border-b border-blue-900/30">
                                <tr>
                                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase">Membro</th>
                                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase hidden md:table-cell">Email</th>
                                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase">Função</th>
                                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase">Ministério</th>
                                    <th className="text-right py-4 px-6 text-xs font-bold text-slate-400 uppercase">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-blue-900/10">
                                {filteredUsers.map(user => {
                                    const isEditing = editingUser === user.id;
                                    return (
                                        <tr key={user.id} className="hover:bg-white/5 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-blue-900/30 flex items-center justify-center text-blue-300 font-bold border border-blue-500/20 shrink-0">
                                                        {user.name?.charAt(0).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <span className="font-medium text-slate-200 block">{user.name}</span>
                                                        <span className="text-xs text-slate-500 md:hidden">{user.email}</span>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6 text-slate-400 text-sm hidden md:table-cell">{user.email}</td>
                                            <td className="py-4 px-6">
                                                {isEditing ? (
                                                    <select value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })} className="bg-[#020617] border border-blue-500 text-white text-xs rounded p-2 outline-none">
                                                        <option value="viewer">Membro</option>
                                                        <option value="leader">Líder</option>
                                                        <option value="admin">Admin</option>
                                                    </select>
                                                ) : (
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${user.role === 'admin' ? 'bg-purple-900/20 text-purple-300 border-purple-500/30' :
                                                        user.role === 'leader' ? 'bg-blue-900/20 text-blue-300 border-blue-500/30' :
                                                            'bg-slate-800 text-slate-300 border-slate-600/30'
                                                        }`}>
                                                        <Shield size={12} />
                                                        {user.role === 'admin' ? 'ADMIN' : user.role === 'leader' ? 'LÍDER' : 'MEMBRO'}
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-slate-400 text-sm">
                                                {isEditing ? (
                                                    <select value={editForm.ministry_id || ''} onChange={e => setEditForm({ ...editForm, ministry_id: e.target.value })} className="bg-[#020617] border border-blue-500 text-white text-xs rounded p-2 outline-none w-32">
                                                        <option value="">Nenhum</option>
                                                        {ministries.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
                                                    </select>
                                                ) : <span className="flex items-center gap-1">{user.ministry?.name || '-'}</span>}
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <div className="flex items-center justify-end gap-2">
                                                    {isEditing ? (
                                                        <>
                                                            <button onClick={() => setEditingUser(null)} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white transition-colors"><X size={16} /></button>
                                                            <button onClick={() => handleSave(user.id)} className="p-2 bg-emerald-900/20 hover:bg-emerald-900/40 rounded-lg text-emerald-400 hover:text-emerald-300 transition-colors"><Save size={16} /></button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <button onClick={() => handleEdit(user)} className="p-2 hover:bg-blue-900/10 rounded-lg text-slate-500 hover:text-blue-400 transition-colors"><Edit2 size={16} /></button>
                                                            {currentUser.id !== user.id && (
                                                                <button onClick={() => confirmDelete(user)} className="p-2 hover:bg-red-900/10 rounded-lg text-slate-500 hover:text-red-400 transition-colors"><Trash2 size={16} /></button>
                                                            )}
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    // --- INVITES TABLE ---
                    <div className="overflow-x-auto">
                        <table className="w-full whitespace-nowrap">
                            <thead className="bg-[#020617]/50 border-b border-blue-900/30">
                                <tr>
                                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase">Email Convidado</th>
                                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase">Função Prevista</th>
                                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase">Ministério</th>
                                    <th className="text-left py-4 px-6 text-xs font-bold text-slate-400 uppercase">Status</th>
                                    <th className="text-right py-4 px-6 text-xs font-bold text-slate-400 uppercase">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-blue-900/10">
                                {filteredInvites.map(invite => {
                                    // Check if user already joined
                                    const isJoined = users.some(u => u.email?.toLowerCase() === invite.email?.toLowerCase());

                                    return (
                                        <tr key={invite.id} className="hover:bg-white/5 transition-colors">
                                            <td className="py-4 px-6">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-8 h-8 rounded-full bg-slate-800 flex items-center justify-center text-slate-400 border border-slate-700 shrink-0">
                                                        <Mail size={14} />
                                                    </div>
                                                    <span className="font-medium text-slate-200">{invite.email}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-6">
                                                <span className="text-xs uppercase font-bold text-slate-500 border border-slate-700 px-2 py-1 rounded-lg">
                                                    {invite.role === 'admin' ? 'ADMIN' : invite.role === 'leader' ? 'LÍDER' : 'MEMBRO'}
                                                </span>
                                            </td>
                                            <td className="py-4 px-6 text-slate-400 text-sm">
                                                {invite.ministry?.name || '-'}
                                            </td>
                                            <td className="py-4 px-6">
                                                {isJoined ? (
                                                    <span className="inline-flex items-center gap-1 text-emerald-400 text-xs font-bold bg-emerald-900/20 px-2 py-1 rounded-full border border-emerald-500/20">
                                                        <CheckCircle size={12} /> Cadastrado
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-amber-400 text-xs font-bold bg-amber-900/20 px-2 py-1 rounded-full border border-amber-500/20">
                                                        <Clock size={12} /> Pendente
                                                    </span>
                                                )}
                                            </td>
                                            <td className="py-4 px-6 text-right">
                                                <button
                                                    onClick={() => confirmDeleteInvite(invite.id, invite.email)}
                                                    className="p-2 hover:bg-red-900/10 rounded-lg text-slate-500 hover:text-red-400 transition-colors"
                                                    title="Revogar Convite"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })}
                                {filteredInvites.length === 0 && (
                                    <tr>
                                        <td colSpan="5" className="py-10 text-center text-slate-500">
                                            Nenhum convite encontrado.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <div className="bg-blue-900/10 border border-blue-500/20 p-4 rounded-xl flex items-start gap-3">
                <Shield className="text-blue-400 shrink-0 mt-0.5" size={20} />
                <div className="text-sm text-blue-200">
                    <p className="font-bold mb-1">Nota sobre Segurança</p>
                    <p className="opacity-80">
                        O cadastro está operando em <strong>Modo Fechado (Whitelist)</strong>. Novos usuários só conseguem se registrar se o email estiver na lista de convites acima.
                        Ao criar um convite, o email é pré-autorizado para a função e ministério escolhidos.
                    </p>
                </div>
            </div>
        </div>
    );
}
