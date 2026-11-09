import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase/middleware', () => ({
  updateSession: vi.fn(async () => 'delegado'),
}));

async function carregarConfig(env) {
  vi.resetModules();
  vi.stubEnv('NEXT_PUBLIC_MOCKUPS', env.mockups ?? '');
  vi.stubEnv('SITE_INDEXAVEL', env.indexavel ?? '');
  vi.stubEnv('NEXT_PUBLIC_GTM_ID', env.gtm ?? '');
  return (await import('../next.config.mjs')).default;
}

async function robots(env) {
  const [{ headers }] = await (await carregarConfig(env)).headers();
  return headers.find((h) => h.key === 'X-Robots-Tag');
}

afterEach(() => vi.unstubAllEnvs());

describe('noindex', () => {
  it('é o padrão', async () => {
    expect(await robots({})).toEqual({ key: 'X-Robots-Tag', value: 'noindex, nofollow' });
  });
  it('some com SITE_INDEXAVEL=1', async () => {
    expect(await robots({ indexavel: '1' })).toBeUndefined();
  });
  it('continua com mockups ligados', async () => {
    expect(await robots({ mockups: '1' })).toBeDefined();
  });
});

describe('CSP', () => {
  async function csp(nodeEnv) {
    vi.stubEnv('NODE_ENV', nodeEnv);
    const [{ headers }] = await (await carregarConfig({})).headers();
    return headers.find((h) => h.key === 'Content-Security-Policy').value;
  }

  it('produção não tem unsafe-eval e segue idêntica à de antes', async () => {
    expect(await csp('production')).toBe(
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline'",
        "style-src 'self' 'unsafe-inline'",
        'img-src \'self\' data: blob: https://jlvpfwyixftybtwnuvxl.supabase.co',
        "media-src 'self' https://jlvpfwyixftybtwnuvxl.supabase.co",
        "font-src 'self' data:",
        "connect-src 'self' https://jlvpfwyixftybtwnuvxl.supabase.co",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
      ].join('; '),
    );
  });

  it('com NEXT_PUBLIC_GTM_ID libera GTM, Preview do Tag Assistant, GA4 e Meta, sem Signals/Ads', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    const [{ headers }] = await (await carregarConfig({ gtm: 'GTM-K9T83L53' })).headers();
    const valor = headers.find((h) => h.key === 'Content-Security-Policy').value;
    expect(valor).toBe(
      [
        "default-src 'self'",
        "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://tagmanager.google.com https://connect.facebook.net",
        "style-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://tagmanager.google.com https://fonts.googleapis.com",
        "img-src 'self' data: blob: https://jlvpfwyixftybtwnuvxl.supabase.co https://www.googletagmanager.com https://*.google-analytics.com https://ssl.gstatic.com https://www.gstatic.com https://www.facebook.com",
        "media-src 'self' https://jlvpfwyixftybtwnuvxl.supabase.co",
        "font-src 'self' data: https://fonts.gstatic.com",
        "connect-src 'self' https://jlvpfwyixftybtwnuvxl.supabase.co https://www.googletagmanager.com https://*.google-analytics.com https://*.google.com https://www.facebook.com https://connect.facebook.net",
        "frame-ancestors 'none'",
        "base-uri 'self'",
        "form-action 'self'",
        "object-src 'none'",
      ].join('; '),
    );
    expect(valor).not.toMatch(/doubleclick|googlesyndication|frame-src/);
  });

  it('desenvolvimento libera unsafe-eval em script-src', async () => {
    expect(await csp('development')).toContain("script-src 'self' 'unsafe-inline' 'unsafe-eval';");
  });
});

describe('trava de build', () => {
  it('falha com SITE_INDEXAVEL=1 e NEXT_PUBLIC_MOCKUPS=1', async () => {
    await expect(carregarConfig({ indexavel: '1', mockups: '1' })).rejects.toThrow(/Build abortado/);
  });
});

describe('proxy', () => {
  async function chamar(mockups, path) {
    vi.resetModules();
    vi.stubEnv('NEXT_PUBLIC_MOCKUPS', mockups);
    const { proxy } = await import('../proxy.js');
    const { updateSession } = await import('@/lib/supabase/middleware');
    return { res: await proxy({ nextUrl: { pathname: path } }), updateSession };
  }

  it.each(['/admin', '/admin/produtos', '/login'])('404 em %s com mockups ligados', async (path) => {
    const { res, updateSession } = await chamar('1', path);
    expect(res.status).toBe(404);
    expect(updateSession).not.toHaveBeenCalled();
  });

  it('delega ao updateSession sem a flag', async () => {
    const { res, updateSession } = await chamar('', '/admin');
    expect(res).toBe('delegado');
    expect(updateSession).toHaveBeenCalledOnce();
  });
});
