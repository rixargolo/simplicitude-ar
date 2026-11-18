import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { URL_SITE, urlCanonica, entradasSitemap, PAGINAS_SITEMAP } from '@/lib/site';
import robots from '@/app/robots';

describe('urlCanonica', () => {
  it('junta o domínio oficial ao caminho', () => {
    expect(urlCanonica('/loja')).toBe('https://simplicitude.com.br/loja');
    expect(urlCanonica('/loja/bombons')).toBe('https://simplicitude.com.br/loja/bombons');
  });

  it('a home termina em barra', () => {
    expect(urlCanonica('/')).toBe('https://simplicitude.com.br/');
    expect(urlCanonica()).toBe('https://simplicitude.com.br/');
  });

  it('descarta query e hash', () => {
    expect(urlCanonica('/loja?categoria=presentes')).toBe('https://simplicitude.com.br/loja');
    expect(urlCanonica('/loja?colecao=inspirar#topo')).toBe('https://simplicitude.com.br/loja');
  });

  it('aceita caminho sem barra inicial', () => {
    expect(urlCanonica('loja')).toBe('https://simplicitude.com.br/loja');
  });
});

describe('entradasSitemap', () => {
  const urls = entradasSitemap(['bombons', 'esperanca']).map((e) => e.url);

  it('traz as páginas públicas e os produtos ativos', () => {
    for (const { caminho } of PAGINAS_SITEMAP) expect(urls).toContain(urlCanonica(caminho));
    expect(urls).toContain(`${URL_SITE}/loja/bombons`);
    expect(urls).toContain(`${URL_SITE}/loja/esperanca`);
  });

  it('deixa de fora admin, login, link-na-bio, busca, assinaturas e sustentabilidade', () => {
    const feio = ['/admin', '/login', '/link-na-bio', '/busca', '/assinaturas', '/sustentabilidade'];
    for (const caminho of feio) {
      expect(urls.some((u) => u.startsWith(`${URL_SITE}${caminho}`))).toBe(false);
    }
  });

  it('nenhuma URL tem parâmetros', () => {
    expect(urls.some((u) => u.includes('?'))).toBe(false);
  });

  it('ignora slug vazio e sem produto lista só as páginas fixas', () => {
    expect(entradasSitemap(['', null, undefined])).toHaveLength(PAGINAS_SITEMAP.length);
    expect(entradasSitemap()).toHaveLength(PAGINAS_SITEMAP.length);
  });
});

describe('robots', () => {
  const r = robots();

  it('libera o site e bloqueia /admin e /login', () => {
    expect(r.rules.allow).toBe('/');
    expect(r.rules.disallow).toEqual(['/admin', '/login']);
  });

  it('aponta para o sitemap do domínio oficial', () => {
    expect(r.sitemap).toBe('https://simplicitude.com.br/sitemap.xml');
  });
});

describe('netlify.toml: 301 do endereço antigo', () => {
  const toml = readFileSync(new URL('../netlify.toml', import.meta.url), 'utf8');
  const bloco = toml.split('[[redirects]]')[1] ?? '';
  const campo = (nome) => bloco.match(new RegExp(`^\\s*${nome}\\s*=\\s*"?([^"\\n]+)"?`, 'm'))?.[1].trim();

  it('só o host exato simplicitude-ar.netlify.app, mantendo o caminho', () => {
    expect(campo('from')).toBe('https://simplicitude-ar.netlify.app/*');
    expect(campo('to')).toBe('https://simplicitude.com.br/:splat');
  });

  it('é 301 e forçado (vale mesmo havendo arquivo no caminho)', () => {
    expect(campo('status')).toBe('301');
    expect(campo('force')).toBe('true');
  });

  it('não usa curinga de host (previews v1-- e deploy-preview continuam no ar)', () => {
    expect(campo('from')).not.toMatch(/\*\.|\*--|netlify\.app\/\*.*netlify/);
    expect(campo('from')?.startsWith('https://simplicitude-ar.netlify.app/')).toBe(true);
  });
});

describe('par PT ↔ EN da meditação', () => {
  it('sem o EN completo o sitemap não lista /en/meditacao nem hreflang', () => {
    const e = entradasSitemap(['a']);
    expect(e.some((x) => x.url.includes('/en/'))).toBe(false);
    expect(e.some((x) => x.alternates)).toBe(false);
  });

  it('com o EN completo lista as duas URLs, cada uma com o par', () => {
    const e = entradasSitemap(['a'], { enCompleto: true });
    const pt = e.find((x) => x.url === `${URL_SITE}/meditacao`);
    const en = e.find((x) => x.url === `${URL_SITE}/en/meditacao`);
    const languages = { 'pt-BR': `${URL_SITE}/meditacao`, en: `${URL_SITE}/en/meditacao`, 'x-default': `${URL_SITE}/meditacao` };
    expect(pt.alternates).toEqual({ languages });
    expect(en.alternates).toEqual({ languages });
    expect(e.filter((x) => x.alternates)).toHaveLength(2); // só esse par
  });
});

describe('QR code impresso: /meditation-eng', () => {
  it('é 301 (não 308) para /en/meditacao', async () => {
    const { default: config } = await import('../next.config.mjs');
    expect(await config.redirects()).toEqual([
      { source: '/meditation-eng', destination: '/en/meditacao', statusCode: 301 },
    ]);
  });
});
