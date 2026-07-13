// Vincula os áudios de meditação guiada de Esperança e Serenidade, já
// enviados ao bucket `meditacao`, aos respectivos produtos — preenchendo
// `produtos.audio_url` (e garantindo `tem_meditacao=true`).
//
// Uso:
//   1. Preencha SUPABASE_ADMIN_EMAIL e SUPABASE_ADMIN_PASSWORD no ambiente
//      (login de um usuário admin já cadastrado no Supabase Auth), ex.:
//        SUPABASE_ADMIN_EMAIL=voce@exemplo.com SUPABASE_ADMIN_PASSWORD=senha node scripts/vincular-audio-meditacao.mjs
//   2. Rode a partir da raiz do projeto: node scripts/vincular-audio-meditacao.mjs
//
// O script é idempotente: produtos cujo audio_url já aponta para o arquivo
// esperado são pulados. Ao final, valida por HTTP que cada áudio responde 200.

import { readFileSync, existsSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';

const BUCKET = 'meditacao';

// nome do produto (como está em produtos.nome) -> arquivo no bucket `meditacao`
const AUDIOS = [
  { nome: 'Esperança', arquivo: 'esperanca.mp3' },
  { nome: 'Serenidade', arquivo: 'serenidade.mp3' },
];

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

  let atualizados = 0;
  let pulados = 0;

  for (const { nome, arquivo } of AUDIOS) {
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET)
      .getPublicUrl(arquivo);
    const audioUrl = publicUrlData.publicUrl;

    const { data: produto, error: produtoError } = await supabase
      .from('produtos')
      .select('id, nome, tem_meditacao, audio_url')
      .eq('nome', nome)
      .maybeSingle();

    if (produtoError) {
      console.error(`- ${nome}: falha ao buscar produto: ${produtoError.message}`);
      continue;
    }
    if (!produto) {
      console.error(`- ${nome}: produto não encontrado, pulando.`);
      pulados++;
      continue;
    }

    if (produto.tem_meditacao && produto.audio_url === audioUrl) {
      console.log(`- ${nome}: já vinculado (${audioUrl}), pulando.`);
      pulados++;
      continue;
    }

    console.log(`- ${nome}: vinculando ${audioUrl}`);

    const { error: updateError } = await supabase
      .from('produtos')
      .update({ audio_url: audioUrl, tem_meditacao: true })
      .eq('id', produto.id);

    if (updateError) {
      console.error(`  Falha ao atualizar: ${updateError.message}`);
      continue;
    }

    atualizados++;

    const resp = await fetch(audioUrl, { method: 'HEAD' });
    console.log(`  Verificação: ${audioUrl} -> HTTP ${resp.status} (esperado 200)`);
  }

  console.log(`\nConcluído: ${atualizados} atualizados, ${pulados} pulados.`);
  await supabase.auth.signOut();
}

main();
