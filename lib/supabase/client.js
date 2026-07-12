import { createBrowserClient } from '@supabase/ssr';

// Client Supabase para uso em client components ('use client').
// Diferente de lib/supabase.js (sessão em localStorage, só leitura pública),
// este client grava a sessão em cookies — necessário para o middleware
// conseguir ler o usuário autenticado e proteger rotas.
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}
