import { urlCanonica } from '@/lib/site';

// Igual em todos os ambientes: o preview fica fora do índice pelo X-Robots-Tag (next.config.mjs), e bloquear
// o preview aqui impediria o Google de ver esse header.
export default function robots() {
  return {
    rules: { userAgent: '*', allow: '/', disallow: ['/admin', '/login'] },
    sitemap: urlCanonica('/sitemap.xml'),
  };
}
