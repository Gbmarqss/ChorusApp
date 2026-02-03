import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Fallback para desenvolvimento local sem Supabase
const isDevelopment = !supabaseUrl || !supabaseKey;

export const supabase = isDevelopment
    ? null
    : createClient(supabaseUrl, supabaseKey);

// Helper para verificar se Supabase está configurado
export const isSupabaseEnabled = () => !isDevelopment && supabase !== null;
