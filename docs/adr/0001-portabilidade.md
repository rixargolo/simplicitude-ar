# ADR 0001 — Portabilidade

**Status:** aceito · **Data:** 2026-11-04

## Contexto

O projeto roda em Netlify + Supabase e deve poder migrar (ex.: AWS) sem reescrita grande.
Multi-cloud e camadas de abstração genéricas estão fora de escopo.

## Decisão

Usar só recursos padrão de Next.js, Postgres e HTTP. Isolar cada fornecedor em **um** módulo
de `lib/`. As regras abaixo valem para todo código novo.

| Ponto | Lock-in hoje | Regra (menor custo) | Custo para migrar |
|---|---|---|---|
| Deploy | Baixo (`@netlify/plugin-nextjs`, `netlify.toml` só com o build) | Nada de `netlify/functions`, Edge Functions, Blobs, Forms ou `@netlify/*` no app | `output: 'standalone'` (container) ou OpenNext |
| Funções serverless | — | Só route handlers do Next (`app/api/**`) | Zero |
| Tarefas agendadas | — | Tarefa = rota HTTP com segredo; agendador externo (GitHub Actions) | Trocar o agendador |
| Envs de plataforma | Risco de usar `URL`/`CONTEXT` do Netlify | Envs próprias: `SITE_URL`, `SITE_INDEXAVEL`, `NEXT_PUBLIC_MOCKUPS` | Zero |
| `next/image` | Image CDN do Netlify, transparente | Nada | Otimizador padrão (sharp) |
| Postgres | **Alto: schema só no painel** | Migrations SQL no repo; lógica em SQL/plpgsql | `pg_dump`/restore |
| RLS com `auth.uid()` | Médio | RLS só para o admin; fluxo público pelo servidor | Reescrever as policies do admin |
| supabase-js/PostgREST | Médio (admin escreve do browser) | Código novo acessa o banco só no servidor, em `lib/`; a dívida do admin fica registrada | Reescrever `lib/admin/*` e forms (só se trocar o banco) |
| Supabase Auth | Baixo (2 usuários) | Convidado mantém compradores fora do Auth | Recriar 2 usuários |
| Supabase Storage | Baixo (URLs absolutas) | Aceito | Copiar objetos (API S3) + 1 `UPDATE … replace(host)` |
| InfinitePay | — | Só `lib/checkout/infinitepay.js` | Novo módulo |
| E-mail transacional | — | Só `lib/email.js` via `fetch`, no subdomínio `send.` | 1 arquivo + DNS de `send.` |
| DNS / e-mail principal | **GoDaddy (temporária)** | O go-live muda só `@`/`www`; a saída da GoDaddy é uma mudança separada | Recriar a zona + migrar caixas |

## Consequências

A portabilidade custa ~zero agora, porque é disciplina e não código. A dívida aceita é o
acesso direto do browser ao banco no admin.
