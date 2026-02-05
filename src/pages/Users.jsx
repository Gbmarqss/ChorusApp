import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { createClient } from '@supabase/supabase-js';
import { Search, Trash2, Edit2, Plus, UserPlus, Key, Copy, CheckCircle, Clock, X, AlertTriangle, Shield, Mail, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import Input from '../components/ui/Input';
import Modal from '../components/ui/Modal';
import MultiSelect from '../components/ui/MultiSelect';

export default function Users() {
    const { user: currentUser } = useAuth();
    const toast = useToast();

    // Data States
    const [users, setUsers] = useState([]);
    const [ministries, setMinistries] = useState([]);

    // UI States
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Modals
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [deleteModal, setDeleteModal] = useState({ isOpen: false, user: null });
    const [successModalOpen, setSuccessModalOpen] = useState(false);

    // Forms
    const [createForm, setCreateForm] = useState({
        name: '',
        email: '',
        ministry_ids: [],
        role: 'member',
        temp_password: ''
    });

    const [editForm, setEditForm] = useState({
        id: '',
        name: '',
        email: '',
        ministry_ids: [],
        role: ''
    });

    const [generatedCredentials, setGeneratedCredentials] = useState(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);

            // Fetch Ministries
            const { data: minData, error: minError } = await supabase
                .from('ministries')
                .select('id, name')
                .order('name');

            if (minError) throw minError;
            setMinistries(minData || []);

            // Fetch Users with Ministries
            const { data: usersData, error: usersError } = await supabase
                .from('users')
                .select(`
                    *,
                    user_ministries (
                        ministry:ministries (id, name)
                    )
                `)
                .order('name');

            if (usersError) throw usersError;

            // Transform data to flatten ministries
            const transformedUsers = usersData?.map(u => ({
                ...u,
                ministries: u.user_ministries?.map(um => um.ministry).filter(Boolean) || []
            })) || [];

            setUsers(transformedUsers);

        } catch (error) {
            console.error('[Users] Error loading data:', error);
            toast.error(`Erro ao carregar dados: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    const validatePassword = (password) => {
        if (password.length < 6) return "A senha deve ter no mínimo 6 caracteres.";
        return null;
    };

    const handleCreateUser = async () => {
        // Validações
        if (!createForm.name || !createForm.email || createForm.ministry_ids.length === 0 || !createForm.temp_password) {
            toast.error('Preencha todos os campos obrigatórios (incluindo ao menos um ministério).');
            return;
        }

        const passwordError = validatePassword(createForm.temp_password);
        if (passwordError) {
            toast.error(passwordError);
            return;
        }

        setIsSubmitting(true);

        try {
            // 0. Criar cliente temporário ISOLADO
            const tempSupabase = createClient(
                import.meta.env.VITE_SUPABASE_URL,
                import.meta.env.VITE_SUPABASE_ANON_KEY,
                {
                    auth: {
                        persistSession: false,
                        autoRefreshToken: false,
                        detectSessionInUrl: false
                    }
                }
            );

            // 1. Criar usuário no Auth
            const { data: authData, error: authError } = await tempSupabase.auth.signUp({
                email: createForm.email.toLowerCase().trim(),
                password: createForm.temp_password,
                options: {
                    data: { name: createForm.name.trim() }
                }
            });

            if (authError) throw authError;

            if (!authData.user) {
                throw new Error('Erro ao criar usuário. Email pode já estar em uso.');
            }

            const userId = authData.user.id;

            // 2. Criar registro na tabela users
            // Mantemos ministry_id como o primeiro selecionado para compatibilidade retroativa, se necessário
            const { error: userError } = await supabase
                .from('users')
                .insert([{
                    id: userId,
                    email: createForm.email.toLowerCase().trim(),
                    name: createForm.name.trim(),
                    role: createForm.role,
                    ministry_id: createForm.ministry_ids[0] || null,
                    is_active: true,
                    must_change_password: true
                }]);

            if (userError) throw userError;

            // 3. Inserir Ministérios na tabela de junção
            if (createForm.ministry_ids.length > 0) {
                const ministryInserts = createForm.ministry_ids.map(mid => ({
                    user_id: userId,
                    ministry_id: mid
                }));

                const { error: minRelError } = await supabase
                    .from('user_ministries')
                    .insert(ministryInserts);

                if (minRelError) throw minRelError;
            }

            // Sucesso
            setGeneratedCredentials({
                email: createForm.email,
                password: createForm.temp_password
            });

            setCreateModalOpen(false);
            setSuccessModalOpen(true);

            // Limpar form
            setCreateForm({
                name: '',
                email: '',
                ministry_ids: [],
                role: 'member',
                temp_password: ''
            });

            loadData();

        } catch (error) {
            console.error('[Users] Error creating user:', error);
            if (error.message.includes('rate limit')) {
                toast.error('Limite de segurança atingido. Aguarde alguns minutos antes de criar outro usuário (Restrição do Supabase).');
            } else if (error.message.includes('already registered')) {
                toast.error('Este email já está cadastrado.');
            } else {
                toast.error(`Erro ao criar usuário: ${error.message}`);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const openEditModal = (user) => {
        setEditForm({
            id: user.id,
            name: user.name,
            email: user.email,
            ministry_ids: user.ministries?.map(m => m.id) || [],
            role: user.role
        });
        setEditModalOpen(true);
    };

    const handleUpdateUser = async () => {
        setIsSubmitting(true);
        try {
            // 1. Atualizar dados básicos
            const { error: userError } = await supabase
                .from('users')
                .update({
                    name: editForm.name,
                    role: editForm.role,
                    ministry_id: editForm.ministry_ids[0] || null // Compatibilidade
                })
                .eq('id', editForm.id);

            if (userError) throw userError;

            // 2. Atualizar Ministérios (Delete All + Insert All strategy is simplest for small lists)

            // Delete existing
            const { error: delError } = await supabase
                .from('user_ministries')
                .delete()
                .eq('user_id', editForm.id);

            if (delError) throw delError;

            // Insert new
            if (editForm.ministry_ids.length > 0) {
                const ministryInserts = editForm.ministry_ids.map(mid => ({
                    user_id: editForm.id,
                    ministry_id: mid
                }));

                const { error: insError } = await supabase
                    .from('user_ministries')
                    .insert(ministryInserts);

                if (insError) throw insError;
            }

            toast.success('Usuário atualizado!');
            setEditModalOpen(false);
            loadData();

        } catch (error) {
            console.error('[Users] Update error:', error);
            toast.error(`Erro ao atualizar: ${error.message}`);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        try {
            const { error } = await supabase
                .from('users')
                .delete()
                .eq('id', deleteModal.user.id);

            if (error) throw error;

            toast.success('Usuário removido!');
            setDeleteModal({ isOpen: false, user: null });
            loadData();

        } catch (error) {
            console.error('[Users] Deletion error:', error);
            toast.error(`Erro ao deletar: ${error.message}`);
        }
    };

    const copyToClipboard = (text) => {
        navigator.clipboard.writeText(text);
        toast.success('Copiado!');
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const getRoleBadge = (role) => {
        const badges = {
            superadmin: 'bg-purple-900/30 text-purple-300 border-purple-500/30',
            admin: 'bg-blue-900/30 text-blue-300 border-blue-500/30',
            leader: 'bg-emerald-900/30 text-emerald-300 border-emerald-500/30',
            member: 'bg-slate-800 text-slate-300 border-slate-600',
            viewer: 'bg-slate-900 text-slate-400 border-slate-700'
        };
        const labels = {
            superadmin: 'SuperAdmin',
            admin: 'Admin',
            leader: 'Líder',
            member: 'Membro',
            viewer: 'Visualizador'
        };
        return (
            <span className={`px-3 py-1 rounded-full text-xs font-bold border ${badges[role] || badges.member}`}>
                {labels[role] || role}
            </span>
        );
    };

    const ministryOptions = ministries.map(m => ({ value: m.id, label: m.name }));

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8 animate-fade-in-up">

            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-white mb-1">Equipe</h1>
                    <p className="text-slate-400">Gerencie os membros e permissões do sistema.</p>
                </div>
                <button
                    onClick={() => setCreateModalOpen(true)}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg hover:shadow-blue-500/20 flex items-center gap-2"
                >
                    <UserPlus size={20} />
                    Novo Usuário
                </button>
            </div>

            {/* Search */}
            <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Buscar por nome ou email..."
                    className="w-full bg-[#0f172a] border border-blue-900/30 rounded-xl py-4 pl-12 pr-4 text-white placeholder-slate-500 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                />
            </div>

            {/* Users Table */}
            <div className="bg-[#0f172a] border border-blue-900/30 rounded-2xl overflow-hidden shadow-xl">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-[#020617] border-b border-blue-900/30">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Usuário</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Ministérios</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Função</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-slate-400 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-slate-400 uppercase tracking-wider">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-blue-900/10">
                            {filteredUsers.map(user => {
                                const isSuperAdminRow = user.role === 'superadmin';
                                const isCurrentUser = user.id === currentUser?.id;

                                return (
                                    <tr key={user.id} className="hover:bg-blue-900/5 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-slate-700 to-slate-600 flex items-center justify-center text-white font-bold text-sm">
                                                    {user.name?.charAt(0)}
                                                </div>
                                                <div>
                                                    <div className="font-bold text-white">{user.name}</div>
                                                    <div className="text-sm text-slate-500">{user.email}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex flex-wrap gap-1">
                                                {user.ministries && user.ministries.length > 0 ? (
                                                    user.ministries.map(m => (
                                                        <span key={m.id} className="text-xs bg-slate-800 text-slate-300 px-2 py-1 rounded-md border border-slate-700">
                                                            {m.name}
                                                        </span>
                                                    ))
                                                ) : (
                                                    <span className="text-slate-600 italic text-sm">Nenhum</span>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {getRoleBadge(user.role)}
                                        </td>
                                        <td className="px-6 py-4">
                                            {user.is_active ? (
                                                <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
                                                    <CheckCircle size={16} /> Ativo
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-amber-400 text-sm font-medium">
                                                    <Clock size={16} /> Pendente
                                                </div>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => openEditModal(user)}
                                                    className="p-2 text-blue-400 hover:bg-blue-500/10 rounded-lg transition-colors"
                                                    title="Editar Detalhes"
                                                >
                                                    <Edit2 size={18} />
                                                </button>

                                                {!isSuperAdminRow && !isCurrentUser && (
                                                    <button
                                                        onClick={() => setDeleteModal({ isOpen: true, user })}
                                                        className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                                                        title="Remover Usuário"
                                                    >
                                                        <Trash2 size={18} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                {filteredUsers.length === 0 && (
                    <div className="text-center py-12 text-slate-500">
                        Nenhum usuário encontrado.
                    </div>
                )}
            </div>

            {/* CREATE MODAL */}
            <Modal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                title="Novo Usuário"
                type="default"
                showCancel={false} // Disable default footer actions as we have custom
            >
                <div className="space-y-4">
                    <Input
                        label="Nome Completo"
                        icon={User}
                        value={createForm.name}
                        onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                        placeholder="Ex: João Silva"
                    />
                    <Input
                        label="Email"
                        icon={Mail}
                        type="email"
                        value={createForm.email}
                        onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                        placeholder="joao@exemplo.com"
                    />

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <MultiSelect
                                label="Ministérios"
                                options={ministryOptions}
                                value={createForm.ministry_ids}
                                onChange={(newVal) => setCreateForm({ ...createForm, ministry_ids: newVal })}
                                placeholder="Selecione..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Função</label>
                            <div className="relative">
                                <select
                                    value={createForm.role}
                                    onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
                                    className="w-full bg-[#020617] border border-blue-900/30 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
                                >
                                    <option value="member">Membro</option>
                                    <option value="leader">Líder</option>
                                    <option value="admin">Admin</option>
                                    {currentUser?.role === 'superadmin' && <option value="superadmin">SuperAdmin</option>}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">▼</div>
                            </div>
                        </div>
                    </div>

                    <Input
                        label="Senha Temporária"
                        icon={Key}
                        value={createForm.temp_password}
                        onChange={(e) => setCreateForm({ ...createForm, temp_password: e.target.value })}
                        placeholder="Mínimo 6 caracteres"
                    />

                    <div className="flex justify-end pt-4 gap-3">
                        <button
                            onClick={() => setCreateModalOpen(false)}
                            className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-xl"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleCreateUser}
                            disabled={isSubmitting}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Criando...' : 'Criar Usuário'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* EDIT MODAL */}
            <Modal
                isOpen={editModalOpen}
                onClose={() => setEditModalOpen(false)}
                title="Editar Usuário"
                type="default"
                showCancel={false} // FIX: Disable default Modal cancel button to avoid duplicate
            >
                <div className="space-y-4">
                    <Input
                        label="Nome"
                        value={editForm.name}
                        onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    />
                    {/* Email is read-only for editing to avoid auth complexity */}
                    <div className="opacity-50">
                        <Input
                            label="Email (Não editável)"
                            value={editForm.email}
                            disabled={true}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <MultiSelect
                                label="Ministérios"
                                options={ministryOptions}
                                value={editForm.ministry_ids}
                                onChange={(newVal) => setEditForm({ ...editForm, ministry_ids: newVal })}
                                placeholder="Selecione..."
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Função</label>
                            <div className="relative">
                                <select
                                    value={editForm.role}
                                    onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                                    className="w-full bg-[#020617] border border-blue-900/30 rounded-xl p-3 text-white focus:ring-2 focus:ring-blue-500 outline-none appearance-none cursor-pointer"
                                    disabled={editForm.role === 'superadmin' && currentUser?.role !== 'superadmin'}
                                >
                                    <option value="member">Membro</option>
                                    <option value="leader">Líder</option>
                                    <option value="admin">Admin</option>
                                    {currentUser?.role === 'superadmin' && <option value="superadmin">SuperAdmin</option>}
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500">▼</div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4 gap-3">
                        <button
                            onClick={() => setEditModalOpen(false)}
                            className="bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 px-6 rounded-xl"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={handleUpdateUser}
                            disabled={isSubmitting}
                            className="bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 px-6 rounded-xl flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
                        </button>
                    </div>
                </div>
            </Modal>

            {/* SUCCESS CREDENTIALS MODAL */}
            <Modal
                isOpen={successModalOpen}
                onClose={() => setSuccessModalOpen(false)}
                title="Usuário Criado com Sucesso"
                type="default"
            >
                <div className="text-center space-y-6">
                    <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                        <CheckCircle size={32} className="text-emerald-500" />
                    </div>

                    <p className="text-slate-300">
                        Copie as credenciais abaixo e envie para o novo usuário.
                    </p>

                    <div className="bg-[#020617] border border-blue-900/30 rounded-xl p-4 space-y-4 text-left">
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Email</label>
                            <div className="flex justify-between items-center mt-1">
                                <code className="text-blue-300 font-mono">{generatedCredentials?.email}</code>
                                <button onClick={() => copyToClipboard(generatedCredentials?.email)} className="text-slate-500 hover:text-white p-1">
                                    <Copy size={16} />
                                </button>
                            </div>
                        </div>
                        <div className="h-px bg-slate-800"></div>
                        <div>
                            <label className="text-xs font-bold text-slate-500 uppercase">Senha Temporária</label>
                            <div className="flex justify-between items-center mt-1">
                                <code className="text-emerald-300 font-mono text-lg">{generatedCredentials?.password}</code>
                                <button onClick={() => copyToClipboard(generatedCredentials?.password)} className="text-slate-500 hover:text-white p-1">
                                    <Copy size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="bg-amber-900/20 border border-amber-500/20 p-4 rounded-xl text-left flex gap-3">
                        <AlertTriangle className="text-amber-500 shrink-0" size={20} />
                        <p className="text-xs text-amber-200">
                            Essa senha só será exibida uma vez. O usuário será solicitado a trocá-la no primeiro login.
                        </p>
                    </div>

                    <button
                        onClick={() => setSuccessModalOpen(false)}
                        className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-3 rounded-xl"
                    >
                        Fechar
                    </button>
                </div>
            </Modal>

            {/* DELETE MODAL */}
            <Modal
                isOpen={deleteModal.isOpen}
                onClose={() => setDeleteModal({ isOpen: false, user: null })}
                onConfirm={handleDelete}
                title="Confirmar Exclusão"
                message={`Tem certeza que deseja remover "${deleteModal.user?.name}"? Essa ação é irreversível.`}
                confirmText="Excluir Usuário"
                type="danger"
            />
        </div>
    );
}