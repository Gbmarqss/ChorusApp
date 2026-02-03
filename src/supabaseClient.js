import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Debug: Log environment variables (remove after fixing)
if (typeof window !== 'undefined') {
    console.log('[Supabase] URL exists:', !!supabaseUrl);
    console.log('[Supabase] Key exists:', !!supabaseKey);
    console.log('[Supabase] URL value:', supabaseUrl ? `${supabaseUrl.substring(0, 20)}...` : 'MISSING');
}

// Validate environment variables
if (!supabaseUrl || !supabaseKey) {
    console.error('[Supabase] Missing environment variables!');
    console.error('[Supabase] VITE_SUPABASE_URL:', supabaseUrl ? 'SET' : 'MISSING');
    console.error('[Supabase] VITE_SUPABASE_ANON_KEY:', supabaseKey ? 'SET' : 'MISSING');
    throw new Error(
        'Missing Supabase environment variables. ' +
        'Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file or Vercel dashboard.'
    );
}

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper para verificar se Supabase está configurado
export const isSupabaseEnabled = () => !!supabase;

