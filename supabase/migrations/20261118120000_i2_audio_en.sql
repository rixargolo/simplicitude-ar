-- I2 enxuta (ADR 0002): áudio da meditação em inglês.
-- Acrescenta produto_traducoes.audio_url (URL do áudio EN; vazio = a página /en/meditacao toca o PT com aviso).
-- Aditiva: a `main` não conhece a coluna. O admin da `v1` passa a gravá-la, então aplicar ANTES do deploy.
-- Reexecutável. Já aplicado em produção em 2026-11-18.

alter table public.produto_traducoes
  add column if not exists audio_url text;
