// SEO (puro): endereço canônico e lista de páginas do sitemap.
import { PARES_EN } from './i18n.js';

// Endereço público oficial. Fixo de propósito: o canonical é sempre o domínio real, mesmo no preview
// (o preview segue fora do índice pelo noindex do next.config.mjs).
export const URL_SITE = 'https://simplicitude.com.br';

// URL canônica de um caminho: domínio real + caminho, sem query nem hash.
export function urlCanonica(caminho = '/') {
  const limpo = String(caminho).split(/[?#]/)[0];
  const comBarra = limpo.startsWith('/') ? limpo : `/${limpo}`;
  return `${URL_SITE}${comBarra}`;
}

// Páginas públicas fixas que entram no sitemap. Fora de propósito: /sustentabilidade (só tem o aviso "em
// breve"), /busca (noindex), /link-na-bio, /assinaturas, /admin e /login.
export const PAGINAS_SITEMAP = [
  { caminho: '/', changeFrequency: 'weekly', priority: 1 },
  { caminho: '/loja', changeFrequency: 'weekly', priority: 0.9 },
  { caminho: '/meditacao', changeFrequency: 'monthly', priority: 0.7 },
  { caminho: '/quem-somos', changeFrequency: 'yearly', priority: 0.5 },
  { caminho: '/privacidade', changeFrequency: 'yearly', priority: 0.2 },
  { caminho: '/entrega', changeFrequency: 'yearly', priority: 0.3 },
  { caminho: '/trocas', changeFrequency: 'yearly', priority: 0.3 },
];

// Entradas do sitemap: páginas fixas + uma por produto ativo (/loja/{slug}). Sem lastModified: `produtos` não
// tem updated_at e uma data inventada seria pior do que nenhuma.
// `enCompleto` (traducaoCompleta, lib/i18n.js): só então o par PT ↔ EN entra, com hreflang nas duas entradas.
export function entradasSitemap(slugs = [], { enCompleto = false } = {}) {
  const fixas = PAGINAS_SITEMAP.flatMap(({ caminho, changeFrequency, priority }) => {
    const entrada = { url: urlCanonica(caminho), changeFrequency, priority };
    const caminhoEn = PARES_EN[caminho];
    if (!enCompleto || !caminhoEn) return [entrada];
    const alternates = { languages: { 'pt-BR': entrada.url, en: urlCanonica(caminhoEn), 'x-default': entrada.url } };
    return [
      { ...entrada, alternates },
      { ...entrada, url: urlCanonica(caminhoEn), alternates },
    ];
  });
  const produtos = slugs
    .filter((slug) => typeof slug === 'string' && slug)
    .map((slug) => ({
      url: urlCanonica(`/loja/${slug}`),
      changeFrequency: 'weekly',
      priority: 0.8,
    }));
  return [...fixas, ...produtos];
}
