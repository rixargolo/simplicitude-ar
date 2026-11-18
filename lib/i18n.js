// Tradução com fallback para o PT (ADR 0002). O PT mora na tabela-base; os outros idiomas, em `*_traducoes`.
// Campo de tradução vazio ou só com espaços cai no PT. Hoje só /meditacao tem versão EN (I2 enxuta).
import pt from './i18n/pt.js';
import en from './i18n/en.js';

export const IDIOMA_BASE = 'pt';

// Páginas que têm versão EN: PT sem prefixo → EN em /en/... Fonte única do par (proxy, seletor, menu, sitemap, metadados).
// Desvio do ADR: sem app/[lang]; cada página EN é uma pasta em app/en/. Página nova em EN = uma linha aqui.
export const PARES_EN = { '/meditacao': '/en/meditacao' };

export const COOKIE_IDIOMA = 'idioma';
export const COOKIE_IDIOMA_SEGUNDOS = 60 * 60 * 24 * 365;

const PAISES_ANGLOFONOS = ['US', 'GB', 'IE', 'CA', 'AU', 'NZ'];

const semBarraFinal = (p) => (p.length > 1 ? p.replace(/\/+$/, '') : p);

// 'en' em /en e /en/...; o resto é PT. (Não usar startsWith('/en'): casaria com /entrega.)
export const idiomaDoCaminho = (pathname) => (pathname === '/en' || pathname.startsWith('/en/') ? 'en' : 'pt');

// Endereço da mesma página no outro idioma: { href, idioma } ou null se a página não tem par.
export function caminhoNoOutroIdioma(pathname) {
  const p = semBarraFinal(pathname);
  if (PARES_EN[p]) return { href: PARES_EN[p], idioma: 'en' };
  const chavePt = Object.keys(PARES_EN).find((k) => PARES_EN[k] === p);
  return chavePt ? { href: chavePt, idioma: 'pt' } : null;
}

// País da requisição. Aceita o cabeçalho do Netlify (`x-nf-geo`, JSON em base64, e `x-country`), do Cloudflare e do
// CloudFront; trocar de hospedagem é mexer só aqui (ADR 0001). Sem cabeçalho (ou ilegível) = null.
export function paisDaRequisicao(headers) {
  const direto = headers.get('x-country') ?? headers.get('cf-ipcountry') ?? headers.get('cloudfront-viewer-country');
  if (direto) return direto.toUpperCase();
  try {
    const geo = headers.get('x-nf-geo');
    return geo ? JSON.parse(atob(geo))?.country?.code?.toUpperCase() ?? null : null;
  } catch {
    return null;
  }
}

// Maior q de cada idioma no Accept-Language ("en-US,en;q=0.9,pt;q=0.8"); 0 = ausente.
function pesosDeIdioma(acceptLanguage) {
  const pesos = {};
  for (const item of acceptLanguage.split(',')) {
    const [tag, ...params] = item.trim().split(';');
    const q = Number(params.find((x) => x.trim().startsWith('q='))?.trim().slice(2) ?? 1);
    const lang = tag.trim().toLowerCase().split('-')[0];
    if (lang && lang !== '*' && q > (pesos[lang] ?? 0)) pesos[lang] = q;
  }
  return pesos;
}

// Idioma a abrir numa URL sem prefixo (ADR 0002, §3): 1) o cookie manda; 2) sem Accept-Language, PT (Googlebot e
// prévias do WhatsApp/Instagram não o enviam); 3) EN só se o cabeçalho prefere EN a PT e (PT nem está na lista ou o
// país é anglófono); 4) senão PT.
export function idiomaPreferido({ cookie, acceptLanguage, pais }) {
  if (cookie === 'en' || cookie === 'pt') return cookie;
  if (!acceptLanguage) return 'pt';
  const { en: qEn = 0, pt: qPt = 0 } = pesosDeIdioma(acceptLanguage);
  if (qEn <= qPt) return 'pt';
  return qPt === 0 || PAISES_ANGLOFONOS.includes(pais) ? 'en' : 'pt';
}

// Dicionário do idioma: o EN sobre o PT; texto EN vazio cai no PT. Chaves só do EN (`menu`) entram como estão
// (vazias viram undefined: quem lê usa `??`).
export function mesclar(base, sobre) {
  if (Array.isArray(base)) return base.map((v, i) => mesclar(v, sobre?.[i]));
  if (typeof base === 'object' || typeof sobre === 'object') {
    const chaves = new Set([...Object.keys(base ?? {}), ...Object.keys(sobre ?? {})]);
    return Object.fromEntries([...chaves].map((k) => [k, mesclar(base?.[k], sobre?.[k])]));
  }
  return typeof sobre === 'string' && sobre.trim() ? sobre : base;
}

const DICIONARIOS = { pt: mesclar(pt, undefined), en: mesclar(pt, en) };
export const textos = (idioma) => DICIONARIOS[idioma] ?? DICIONARIOS.pt;

// true quando todo texto do EN está preenchido: só então a versão EN é indexada e entra no sitemap com hreflang.
const folhas = (v) => (v && typeof v === 'object' ? Object.values(v).flatMap(folhas) : [v]);
export const traducaoCompleta = (dicionario = en) => folhas(dicionario).every((s) => typeof s === 'string' && s.trim());

// Produto no idioma pedido, com a categoria traduzida. `audio_idioma` diz de que idioma é o áudio em `audio_url`: 'en' só se
// produto_traducoes.audio_url está preenchido; senão toca o PT e a página mostra o aviso (ADR 0002, §4).
export function traduzirProduto(produto, idioma) {
  const achar = (linhas) => linhas?.find((t) => t.idioma === idioma);
  const trad = achar(produto.produto_traducoes);
  return {
    ...traduzir(produto, trad, idioma),
    categorias: traduzir(produto.categorias, achar(produto.categorias?.categoria_traducoes), idioma),
    audio_idioma: idioma !== IDIOMA_BASE && trad?.audio_url?.trim() ? idioma : IDIOMA_BASE,
  };
}

// O que o admin faz ao salvar a seção "English (opcional)": algum campo preenchido grava (upsert); tudo vazio
// apaga a linha se ela existia, senão não faz nada (assim salvar não exige a tabela antes do SQL).
export function acaoTraducao(valores, existia) {
  if (Object.values(valores).some((v) => typeof v === 'string' && v.trim())) return 'gravar';
  return existia ? 'apagar' : 'nada';
}

// `traducao` é a linha de `*_traducoes` do idioma pedido (ou null/undefined). Ignora chaves que não são
// texto traduzível (`idioma`, `*_id`) e valores que não são texto.
export function traduzir(registro, traducao, idioma) {
  if (!registro || !traducao || idioma === IDIOMA_BASE) return registro;
  const campos = {};
  for (const [chave, valor] of Object.entries(traducao)) {
    if (chave === 'idioma' || chave.endsWith('_id')) continue;
    if (typeof valor === 'string' && valor.trim()) campos[chave] = valor;
  }
  return { ...registro, ...campos };
}
