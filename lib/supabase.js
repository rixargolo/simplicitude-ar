import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Chaves NEXT_PUBLIC_* são seguras de expor no client — a proteção real dos
// dados é a Row Level Security (RLS) configurada no banco Supabase.
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
