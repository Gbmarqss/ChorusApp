import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';

const AuthContext = createContext({});

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState(null);

    useEffect(() => {
        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            setSession(session);
            if (session?.user) {
                loadUserProfile(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setSession(session);
            if (session?.user) {
                loadUserProfile(session.user.id);
            } else {
                setUser(null);
                setLoading(false);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    const loadUserProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('users')
                .select('*, ministry:ministries(id, name)')
                .eq('id', userId)
                .single();

            if (error) throw error;

            setUser(data);
        } catch (error) {
            console.error('Error loading user profile:', error);
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const signIn = async (email, password) => {
        setLoading(true);
        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            // Verificar se usuário está ativo
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('is_active')
                .eq('id', data.user.id)
                .single();

            if (userError) throw userError;

            if (!userData?.is_active) {
                await supabase.auth.signOut();
                throw new Error('Conta não ativada. Use o código de ativação recebido para ativar sua conta.');
            }

            // Load profile
            if (data.session?.user) {
                await loadUserProfile(data.session.user.id);
            }
            return data;
        } catch (error) {
            setLoading(false);
            throw error;
        }
    };

    /**
     * Ativa conta de usuário usando código de ativação
     * Usado no primeiro acesso
     */
    const activateAccount = async (email, code, password, name) => {
        try {
            // 1. Validar código e email
            const { data: validationResult, error: validationError } = await supabase
                .rpc('activate_user_account', {
                    p_email: email.toLowerCase().trim(),
                    p_code: code.toUpperCase().trim()
                });

            if (validationError) throw validationError;

            if (!validationResult?.success) {
                throw new Error(validationResult?.error || 'Código inválido ou já utilizado');
            }

            const userId = validationResult.user_id;

            // 2. Criar usuário no Supabase Auth
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email: email.toLowerCase().trim(),
                password,
                options: {
                    data: { name }
                }
            });

            if (authError) throw authError;

            // 3. Atualizar nome do usuário na tabela users
            const { error: updateError } = await supabase
                .from('users')
                .update({ name })
                .eq('id', userId);

            if (updateError) console.error('Error updating name:', updateError);

            return authData;
        } catch (error) {
            console.error('[AuthContext] Activation error:', error);
            throw error;
        }
    };

    const signOut = async () => {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
        setUser(null);
        setSession(null);
    };

    const resetPassword = async (email) => {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
    };

    const updatePassword = async (newPassword) => {
        const { error } = await supabase.auth.updateUser({
            password: newPassword,
        });
        if (error) throw error;
    };

    const value = {
        user,
        session,
        loading,
        signIn,
        signOut,
        activateAccount,
        resetPassword,
        updatePassword,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
