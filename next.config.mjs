/** @type {import('next').NextConfig} */

// Host do Storage do Supabase — derivado da env para não duplicar a string,
// com fallback para o host conhecido do projeto. Usado nos remotePatterns de
// imagem e na Content-Security-Policy abaixo.
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  'https://jlvpfwyixftybtwnuvxl.supabase.co';
const supabaseHost = new URL(supabaseUrl).host;
const supabaseOrigin = `https://${supabaseHost}`;

// CSP inicial e pragmática: protege o site (frame-ancestors) e libera apenas o
// Storage do Supabase para imagens/áudio e as chamadas REST/Auth/Storage.
// 'unsafe-inline' em script/style é intencional para não quebrar os scripts de
// hidratação do Next e o next/font — próximo passo de endurecimento é migrar
// para CSP baseada em nonce.
// 'unsafe-eval' só no next dev (o React em dev usa eval); a CSP de produção não muda.
// Google Tag Manager (GA4 + Meta Pixel dentro do container): só entra na CSP quando há
// NEXT_PUBLIC_GTM_ID; sem ele (preview, dev) a CSP fica como estava. Segue a doc oficial
// (developers.google.com/tag-platform/security/guides/csp): GTM + Preview do Tag Assistant +
// GA4 sem recursos de Ads. Fora de propósito: Google Signals/Ads (*.g.doubleclick.net,
// *.google.<TLD>, pagead2.googlesyndication.com, frame-src).
const gtmId = process.env.NEXT_PUBLIC_GTM_ID ?? '';
const gtm = (lista) => (gtmId ? ` ${lista}` : '');
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === 'development' ? " 'unsafe-eval'" : ''}${gtm('https://www.googletagmanager.com https://tagmanager.google.com https://connect.facebook.net')}`,
  `style-src 'self' 'unsafe-inline'${gtm('https://www.googletagmanager.com https://tagmanager.google.com https://fonts.googleapis.com')}`,
  `img-src 'self' data: blob: ${supabaseOrigin}${gtm('https://www.googletagmanager.com https://*.google-analytics.com https://ssl.gstatic.com https://www.gstatic.com https://www.facebook.com')}`,
  `media-src 'self' ${supabaseOrigin}`,
  `font-src 'self' data:${gtm('https://fonts.gstatic.com')}`,
  `connect-src 'self' ${supabaseOrigin}${gtm('https://www.googletagmanager.com https://*.google-analytics.com https://*.google.com https://www.facebook.com https://connect.facebook.net')}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join('; ');

// Envs próprias (ADR 0001, nada de CONTEXT/URL do Netlify). Padrão seguro: não indexar.
const mockups = process.env.NEXT_PUBLIC_MOCKUPS === '1';
const indexavel = process.env.SITE_INDEXAVEL === '1';
if (mockups && indexavel) {
  throw new Error(
    'Build abortado: SITE_INDEXAVEL=1 junto com NEXT_PUBLIC_MOCKUPS=1 publicaria mockups no domínio real.',
  );
}

const securityHeaders = [
  ...(indexavel
    ? []
    : [{ key: 'X-Robots-Tag', value: 'noindex, nofollow' }]),
  { key: 'Content-Security-Policy', value: contentSecurityPolicy },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  {
    key: 'Permissions-Policy',
    value: 'camera=(), microphone=(), geolocation=()',
  },
];

const nextConfig = {
  poweredByHeader: false,
  // Sem a env definida o Next não inlina o valor no client e o minificador não descarta o
  // código de preview (menu/rodapé de mockup). Definir '' garante a eliminação em produção.
  // Idem para NEXT_PUBLIC_GTM_ID: vazio = o aviso de cookies e o GTM saem do bundle.
  env: {
    NEXT_PUBLIC_MOCKUPS: process.env.NEXT_PUBLIC_MOCKUPS ?? '',
    NEXT_PUBLIC_GTM_ID: gtmId,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: supabaseHost,
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
