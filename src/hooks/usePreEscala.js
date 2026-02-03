import { useState, useEffect } from 'react';
import { supabase, isSupabaseEnabled } from '../supabaseClient';

/**
 * Hook para gerenciar pré-escala com sincronização Supabase
 * Fallback para localStorage se Supabase não estiver configurado
 */
export function usePreEscala(id) {
    const [preEscala, setPreEscala] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (isSupabaseEnabled()) {
            loadFromSupabase();
            subscribeToChanges();
        } else {
            loadFromLocalStorage();
        }
    }, [id]);

    const loadFromSupabase = async () => {
        try {
            const { data, error } = await supabase
                .from('pre_escalas')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            setPreEscala(data);
        } catch (err) {
            console.error('Erro ao carregar do Supabase:', err);
            setError(err.message);
            // Fallback para localStorage
            loadFromLocalStorage();
        } finally {
            setLoading(false);
        }
    };

    const loadFromLocalStorage = () => {
        try {
            const saved = localStorage.getItem(`chorus_pre_escala_${id}`);
            if (saved) {
                setPreEscala(JSON.parse(saved));
            }
        } catch (err) {
            console.error('Erro ao carregar do localStorage:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const subscribeToChanges = () => {
        if (!isSupabaseEnabled()) return;

        const subscription = supabase
            .channel(`pre_escala_${id}`)
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'pre_escalas',
                filter: `id=eq.${id}`
            }, (payload) => {
                console.log('Atualização em tempo real:', payload);
                setPreEscala(payload.new);
            })
            .subscribe();

        return () => {
            subscription.unsubscribe();
        };
    };

    const updatePreEscala = async (updates) => {
        if (isSupabaseEnabled()) {
            try {
                const { error } = await supabase
                    .from('pre_escalas')
                    .update({
                        ...updates,
                        atualizado_em: new Date().toISOString()
                    })
                    .eq('id', id);

                if (error) throw error;

                setPreEscala(prev => ({ ...prev, ...updates }));
                return { success: true };
            } catch (err) {
                console.error('Erro ao atualizar no Supabase:', err);
                // Fallback para localStorage
                updateLocalStorage(updates);
                return { success: false, error: err.message };
            }
        } else {
            updateLocalStorage(updates);
            return { success: true };
        }
    };

    const updateLocalStorage = (updates) => {
        const updated = { ...preEscala, ...updates };
        localStorage.setItem(`chorus_pre_escala_${id}`, JSON.stringify(updated));
        setPreEscala(updated);
    };

    const createPreEscala = async (data) => {
        if (isSupabaseEnabled()) {
            try {
                const { error } = await supabase
                    .from('pre_escalas')
                    .insert([{
                        id: data.id,
                        data: data.data,
                        aprovacoes: data.aprovacoes || {},
                        historico: data.historico || [],
                        status: 'rascunho',
                        criado_em: new Date().toISOString()
                    }]);

                if (error) throw error;
                return { success: true };
            } catch (err) {
                console.error('Erro ao criar no Supabase:', err);
                // Fallback para localStorage
                localStorage.setItem(`chorus_pre_escala_${data.id}`, JSON.stringify(data));
                return { success: false, error: err.message };
            }
        } else {
            localStorage.setItem(`chorus_pre_escala_${data.id}`, JSON.stringify(data));
            return { success: true };
        }
    };

    return {
        preEscala,
        loading,
        error,
        updatePreEscala,
        createPreEscala,
        isSupabaseEnabled: isSupabaseEnabled()
    };
}
