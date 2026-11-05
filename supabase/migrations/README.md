# Migrations do banco

Regras:

1. **Toda mudança de banco vira um arquivo novo aqui**, nomeado `AAAAMMDDHHMMSS_descricao_curta.sql`.
2. **Nunca se edita um arquivo já aplicado.** Para corrigir, crie outro arquivo.
3. Cada arquivo começa com um comentário (o que faz, a fatia, "já aplicado em produção em <data>")
   e é **reexecutável** (`if not exists`, `drop policy if exists` etc.).
4. O Code entrega o SQL já nesse formato junto com a fatia; o SQL é rodado à mão no SQL Editor do Supabase.
5. SQL de **dados** que se repete (ex.: reconciliar `produto_imagens` no go-live) não é migration:
   vai em [`../scripts/`](../scripts/).

O baseline do schema inteiro (`supabase db pull`) é o B-1b do plano e ainda não existe: estas migrations
cobrem só as mudanças a partir do A6b.
