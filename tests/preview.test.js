import { afterEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/supabase/middleware', () => ({
  updateSession: vi.fn(async () => 'delegado'),
}));

async function carregarConfig(env) {
  vi.resetModules();
  vi.stubEnv('NEXT_PUBLIC_MOCKUPS', env.mockups ?? '');
  vi.stubEnv('SITE_INDEXAVEL', env.indexavel ?? '');
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
