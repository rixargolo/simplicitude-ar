// Migra as imagens dos produtos existentes (Alegria, Esperança, Serenidade)
// da raiz do bucket `produtos` para a nova estrutura {produto_id}/principal.{ext},
// e atualiza `imagem_url` de cada produto para apontar para o novo caminho.
// Usa storage.move(), que remove o arquivo original — não deixa duplicata.
//
// Uso:
//   1. Preencha SUPABASE_ADMIN_EMAIL e SUPABASE_ADMIN_PASSWORD no ambiente
//      (login de um usuário admin já cadastrado no Supabase Auth), ex.:
//        SUPABASE_ADMIN_EMAIL=voce@exemplo.com SUPABASE_ADMIN_PASSWORD=senha node scripts/migrar-imagens-produtos.mjs
//   2. Rode a partir da raiz do projeto: node scripts/migrar-imagens-produtos.mjs
//
// O script é idempotente: produtos cujo imagem_url já está sob "{id}/" são
// pulados. Ao final, valida por HTTP que a URL antiga não responde mais e a
// nova responde 200.

import { readFileSync, existsSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const BUCKET = 'produtos';

// Carrega .env.local manualmente (sem dependência de dotenv), sem
// sobrescrever variáveis já definidas no ambiente.
function carregarEnvLocal() {
  const caminho = new URL('../.env.local', import.meta.url);
  if (!existsSync(caminho)) return;

  const conteudo = readFileSync(caminho, 'utf-8');
  for (const linha of conteudo.split('\n')) {
    const l = linha.trim();
    if (!l || l.startsWith('#')) continue;
    const igual = l.indexOf('=');
    if (igual === -1) continue;
    const chave = l.slice(0, igual).trim();
    const valor = l.slice(igual + 1).trim();
    if (process.env[chave] === undefined) {
      process.env[chave] = valor;
    }
  }
}

carregarEnvLocal();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const ADMIN_EMAIL = process.env.SUPABASE_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.SUPABASE_ADMIN_PASSWORD;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error(
    'Faltam NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (esperado em .env.local).',
  );
  process.exit(1);
}

if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
  console.error(
    'Defina SUPABASE_ADMIN_EMAIL e SUPABASE_ADMIN_PASSWORD no ambiente antes de rodar este script.',
  );
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function extensaoDaUrl(url) {
  const { pathname } = new URL(url);
  const partes = pathname.split('.');
  return partes.length > 1 ? partes.pop().toLowerCase() : 'jpg';
}

// Caminho do objeto dentro do bucket, extraído da URL pública
// (".../storage/v1/object/public/produtos/<caminho>").
function caminhoNoBucket(url) {
  const marcador = `/storage/v1/object/public/${BUCKET}/`;
  const { pathname } = new URL(url);
  const idx = pathname.indexOf(marcador);
  if (idx === -1) return null;
  return decodeURIComponent(pathname.slice(idx + marcador.length));
}

async function main() {
  console.log('Autenticando...');
  const { error: authError } = await supabase.auth.signInWithPassword({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
  });
  if (authError) {
    console.error('Falha ao autenticar:', authError.message);
    process.exit(1);
  }

  const { data: produtos, error: produtosError } = await supabase
    .from('produtos')
    .select('id, nome, imagem_url')
    .order('nome', { ascending: true });

  if (produtosError) {
    console.error('Falha ao buscar produtos:', produtosError.message);
    process.exit(1);
  }

  let migrados = 0;
  let pulados = 0;

  for (const produto of produtos) {
    if (!produto.imagem_url) {
      console.log(`- ${produto.nome}: sem imagem_url, pulando.`);
      pulados++;
      continue;
    }

    const caminhoAntigo = caminhoNoBucket(produto.imagem_url);
    if (!caminhoAntigo) {
      console.log(
        `- ${produto.nome}: imagem_url não aponta para o bucket "${BUCKET}", pulando.`,
      );
      pulados++;
      continue;
    }

    if (caminhoAntigo.startsWith(`${produto.id}/`)) {
      console.log(`- ${produto.nome}: já migrado (${caminhoAntigo}), pulando.`);
      pulados++;
      continue;
    }

    const ext = extensaoDaUrl(produto.imagem_url);
    const caminhoNovo = `${produto.id}/principal.${ext}`;

    console.log(`- ${produto.nome}: ${caminhoAntigo} -> ${caminhoNovo}`);

    const { error: moveError } = await supabase.storage
      .from(BUCKET)
      .move(caminhoAntigo, caminhoNovo);

    if (moveError) {
      console.error(`  Falha ao mover: ${moveError.message}`);
      continue;
    }

    const { data: publicUrlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(caminhoNovo);

    const { error: updateError } = await supabase
      .from('produtos')
      .update({ imagem_url: publicUrlData.publicUrl })
      .eq('id', produto.id);

    if (updateError) {
      console.error(`  Falha ao atualizar imagem_url: ${updateError.message}`);
      continue;
    }

    migrados++;

    // Validação HTTP: URL antiga deve ter deixado de existir, nova deve responder 200.
    const urlAntiga = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET}/${caminhoAntigo}`;
    const [respAntiga, respNova] = await Promise.all([
      fetch(urlAntiga, { method: 'HEAD' }),
      fetch(publicUrlData.publicUrl, { method: 'HEAD' }),
    ]);
    console.log(
      `  Verificação: antiga -> HTTP ${respAntiga.status} (esperado 400/404), nova -> HTTP ${respNova.status} (esperado 200)`,
    );
  }

  console.log(`\nConcluído: ${migrados} migrados, ${pulados} pulados.`);
  await supabase.auth.signOut();
}

main();
