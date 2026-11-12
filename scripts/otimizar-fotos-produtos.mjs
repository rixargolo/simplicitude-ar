// Reprocessa as fotos de produto que já estão no Storage: gera as versões otimizadas (lib/fotos.js:
// larguras em WebP + prévia og 1200×630), aponta produto_imagens.caminho e a cópia produtos.imagem_url
// para elas e guarda o arquivo original em produto_imagens.caminho_original.
// NUNCA remove nada do Storage: os originais ficam até você validar (apagá-los é outra fatia).
//
// Pré-requisito: migration 20261111120000_fotos_otimizadas.sql aplicada.
//
// Uso (a partir da raiz, com SUPABASE_ADMIN_EMAIL / SUPABASE_ADMIN_PASSWORD no ambiente):
//   node scripts/otimizar-fotos-produtos.mjs --simular   # só lista o que faria, sem enviar nada
//   node scripts/otimizar-fotos-produtos.mjs             # executa
// Idempotente: pula foto já otimizada ou já reprocessada (caminho_original preenchido).
// Usa `sharp` (já em node_modules, vem do Next) e a mesma especificação do admin (lib/fotos.js).

import { readFileSync, existsSync } from 'node:fs';
import { randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import {
  COR_FUNDO_OG,
  LARGURAS,
  OG,
  QUALIDADE_JPEG,
  QUALIDADE_WEBP,
  caminhoDaUrl,
  fotoOtimizada,
  retanguloContido,
  urlLargura,
  urlOg,
} from '../lib/fotos.js';

const BUCKET = 'produtos';
const SIMULAR = process.argv.includes('--simular');

function carregarEnvLocal() {
  const caminho = new URL('../.env.local', import.meta.url);
  if (!existsSync(caminho)) return;
  for (const linha of readFileSync(caminho, 'utf-8').split('\n')) {
    const l = linha.trim();
    if (!l || l.startsWith('#')) continue;
    const igual = l.indexOf('=');
    if (igual === -1) continue;
    const chave = l.slice(0, igual).trim();
    if (process.env[chave] === undefined) process.env[chave] = l.slice(igual + 1).trim();
  }
}
carregarEnvLocal();

const { NEXT_PUBLIC_SUPABASE_URL: URL_SB, NEXT_PUBLIC_SUPABASE_ANON_KEY: ANON, SUPABASE_ADMIN_EMAIL, SUPABASE_ADMIN_PASSWORD } = process.env;
if (!URL_SB || !ANON) {
  console.error('Faltam NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY (esperado em .env.local).');
  process.exit(1);
}

const supabase = createClient(URL_SB, ANON);
const urlPublica = (caminho) => supabase.storage.from(BUCKET).getPublicUrl(caminho).data.publicUrl;
const kb = (n) => `${Math.round(n / 1024)} KB`;

// Gera as 5 versões a partir do original: { larguras: { 320: Buffer, … }, og: Buffer }
export async function gerar(original) {
  const larguras = {};
  for (const largura of LARGURAS) {
    larguras[largura] = await sharp(original) // .rotate() aplica a orientação EXIF; sharp já descarta os metadados
      .rotate()
      .resize({ width: largura, withoutEnlargement: true })
      .webp({ quality: Math.round(QUALIDADE_WEBP * 100), effort: 6 })
      .toBuffer();
  }
  // dimensões já com a orientação EXIF aplicada (5–8 = girada 90°, largura e altura trocam)
  const { width, height, orientation = 1 } = await sharp(original).metadata();
  const [w, h] = orientation >= 5 ? [height, width] : [width, height];
  const r = retanguloContido(w, h, OG.largura, OG.altura);
  const foto = await sharp(original).rotate().resize({ width: r.largura, height: r.altura, fit: 'fill' }).png().toBuffer();
  const og = await sharp({ create: { width: OG.largura, height: OG.altura, channels: 3, background: COR_FUNDO_OG } })
    .composite([{ input: foto, left: r.x, top: r.y }])
    .jpeg({ quality: Math.round(QUALIDADE_JPEG * 100) })
    .toBuffer();
  return { larguras, og };
}

async function main() {
if (!SIMULAR && (!SUPABASE_ADMIN_EMAIL || !SUPABASE_ADMIN_PASSWORD)) {
  console.error('Defina SUPABASE_ADMIN_EMAIL e SUPABASE_ADMIN_PASSWORD no ambiente antes de rodar.');
  process.exit(1);
}
  if (!SIMULAR) {
    const { error } = await supabase.auth.signInWithPassword({ email: SUPABASE_ADMIN_EMAIL, password: SUPABASE_ADMIN_PASSWORD });
    if (error) {
      console.error('Falha ao autenticar:', error.message);
      process.exit(1);
    }
  }
  console.log(SIMULAR ? 'SIMULAÇÃO: nada será enviado nem alterado.\n' : 'Executando.\n');

  const { data: linhas, error } = await supabase
    .from('produto_imagens')
    .select('id, produto_id, caminho, caminho_original, produtos(nome, ativo, imagem_url)')
    .order('produto_id');
  if (error) {
    console.error('Falha ao ler produto_imagens (a migration foi aplicada?):', error.message);
    process.exit(1);
  }
  // simulação sem login só enxerga produto ativo (RLS): suficiente para a lista, mas avisa
  if (SIMULAR) console.log('(sem login a simulação só enxerga fotos de produtos ativos)\n');

  const pendentes = linhas.filter((l) => !l.caminho_original && !l.caminho.startsWith('/') && !fotoOtimizada(l.caminho));
  console.log(`${linhas.length} fotos em produto_imagens; ${pendentes.length} para reprocessar.\n`);

  const resumo = [];
  let falhas = 0;
  for (const linha of pendentes) {
    const nome = `${linha.produtos?.nome ?? linha.produto_id} (${linha.caminho})`;
    if (SIMULAR) {
      console.log(`- ${nome}`);
      continue;
    }

    const enviados = [];
    try {
      const { data: blob, error: erroBaixar } = await supabase.storage.from(BUCKET).download(linha.caminho);
      if (erroBaixar) throw new Error(`download: ${erroBaixar.message}`);
      const original = Buffer.from(await blob.arrayBuffer());
      const v = await gerar(original);

      const novo = `${linha.produto_id}/${randomUUID()}-${LARGURAS[LARGURAS.length - 1]}.webp`;
      const arquivos = [
        ...LARGURAS.map((l) => [urlLargura(novo, l), v.larguras[l], 'image/webp']),
        [urlOg(novo), v.og, 'image/jpeg'],
      ];
      for (const [c, buf, contentType] of arquivos) {
        enviados.push(c);
        const { error: erroEnviar } = await supabase.storage.from(BUCKET).upload(c, buf, { cacheControl: '31536000', contentType, upsert: false });
        if (erroEnviar) throw new Error(`upload de ${c}: ${erroEnviar.message}`);
      }

      const { error: erroLinha } = await supabase
        .from('produto_imagens')
        .update({ caminho: novo, caminho_original: linha.caminho })
        .eq('id', linha.id);
      if (erroLinha) throw new Error(`update produto_imagens: ${erroLinha.message}`);

      // a cópia em produtos só muda se era esta foto (a principal)
      if (caminhoDaUrl(linha.produtos?.imagem_url) === linha.caminho) {
        const { error: erroCopia } = await supabase.from('produtos').update({ imagem_url: urlPublica(novo) }).eq('id', linha.produto_id);
        if (erroCopia) throw new Error(`update produtos.imagem_url: ${erroCopia.message}`);
      }

      resumo.push({ foto: nome, original: kb(original.length), '640': kb(v.larguras[640].length), '1600': kb(v.larguras[1600].length), og: kb(v.og.length) });
      console.log(`✓ ${nome}: ${kb(original.length)} → ${kb(v.larguras[1600].length)} (1600) / ${kb(v.larguras[640].length)} (640)`);
    } catch (e) {
      falhas++;
      console.error(`✗ ${nome}: ${e.message}`);
      // o que subiu antes do erro é nosso e nada aponta para ele ainda; o original não é tocado
      if (enviados.length > 0) await supabase.storage.from(BUCKET).remove(enviados);
    }
  }

  // avisos: produto com foto só em produtos.imagem_url (sem linha em produto_imagens) não é reprocessado aqui
  const { data: produtos } = await supabase.from('produtos').select('id, nome, imagem_url');
  const comLinha = new Set(linhas.map((l) => l.produto_id));
  for (const p of produtos ?? []) {
    if (p.imagem_url && !comLinha.has(p.id) && !fotoOtimizada(p.imagem_url)) {
      console.warn(`⚠ ${p.nome}: tem imagem_url mas nenhuma linha em produto_imagens; rode supabase/scripts/x1_reconciliar_produto_imagens.sql e este script de novo.`);
    }
  }

  if (resumo.length > 0) console.table(resumo);
  console.log(`\n${SIMULAR ? 'Simulação concluída' : `Concluído: ${resumo.length} reprocessadas, ${falhas} com erro`}. Nada foi removido do Storage.`);
  if (falhas > 0) process.exitCode = 1;
}

// só roda quando executado direto (importar para testar `gerar` não dispara nada)
if (process.argv[1] === fileURLToPath(import.meta.url)) main();
