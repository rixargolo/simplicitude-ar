import { notFound } from 'next/navigation';

// Fonte única do menu (Header e Footer). `status`: 'real' aparece sempre;
// 'mockup' só com NEXT_PUBLIC_MOCKUPS=1 (preview) — em produção fica fora do
// menu e a rota dá 404 (ver exigirMockups).
const ITENS = [
  { href: '/loja', rotulo: 'Loja', status: 'real' },
  { href: '/meditacao', rotulo: 'Meditação', status: 'real' },
  { href: '/sustentabilidade', rotulo: 'Sustentabilidade', status: 'real' },
  { href: '/quem-somos', rotulo: 'Quem somos', status: 'real' },
  { href: '/assinaturas', rotulo: 'Assinaturas', status: 'mockup' },
];

// Comparação literal: o Next só inlina process.env.NEXT_PUBLIC_* assim no client.
export const mockupsLigados = () => process.env.NEXT_PUBLIC_MOCKUPS === '1';

export const itensMenu = () =>
  ITENS.filter((item) => item.status === 'real' || mockupsLigados());

// Rotas sem Header/Footer nem rastreio: login e toda a área administrativa.
export const areaInterna = (pathname) => pathname === '/login' || pathname.startsWith('/admin');

// Onde o SiteChrome tira Header/Footer: a área interna e a página de links da bio (esta mantém o aviso de cookies/GTM).
export const semChrome = (pathname) => areaInterna(pathname) || pathname === '/link-na-bio';

export function exigirMockups() {
  if (!mockupsLigados()) notFound();
}
