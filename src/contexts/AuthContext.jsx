import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
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
        let isMounted = true;

        // Check active session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (!isMounted) return;
            setSession(session);
            if (session?.user) {
                loadUserProfile(session.user.id);
            } else {
                setLoading(false);
            }
        });

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!isMounted) return;
            setSession(session);
            if (session?.user) {
                loadUserProfile(session.user.id);
            } else {
                setUser(null);
                setLoading(false);
            }
        });

        return () => {
            isMounted = false;
            subscription.unsubscribe();
        };
    }, []);

    const loadUserProfile = async (userId) => {
        if (!userId) return;

        try {
            // FIX: Explicitly specify !ministry_id to avoid ambiguity with user_ministries table
            const { data, error } = await supabase
                .from('users')
                .select('*, ministry:ministries!ministry_id(id, name)')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('Error loading user profile:', error);
                // Mantenha o usuário anterior se existir para evitar redirecionamentos agressivos
                setUser(prev => prev);
            } else {
                setUser(data);
            }
        } catch (error) {
            console.error('Unexpected error loading user profile:', error);
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

            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('is_active, must_change_password')
                .eq('id', data.user.id)
                .single();

            if (userError) throw userError;

            if (!userData?.is_active) {
                await supabase.auth.signOut();
                throw new Error('Sua conta está desativada. Entre em contato com o administrador.');
            }

            if (data.session?.user) {
                await loadUserProfile(data.session.user.id);
            }

            return {
                ...data,
                mustChangePassword: userData?.must_change_password || false
            };
        } catch (error) {
            setLoading(false);
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

    const value = useMemo(() => ({
        user,
        session,
        loading,
        isAdmin: user?.role === 'admin' || user?.role === 'superadmin',
        isSuperAdmin: user?.role === 'superadmin',
        signIn,
        signOut,
        resetPassword,
        updatePassword,
        refreshProfile: () => loadUserProfile(session?.user?.id)
    }), [user, session, loading]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}