import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

// Client Supabase para uso em server components e route handlers.
// Lê/escreve a sessão via cookies da requisição atual.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Chamado de um Server Component sem permissão de escrita —
            // pode ser ignorado se houver middleware renovando a sessão.
          }
        },
      },
    },
  );
}
