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
const contentSecurityPolicy = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline'",
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob: ${supabaseOrigin}`,
  `media-src 'self' ${supabaseOrigin}`,
  "font-src 'self' data:",
  `connect-src 'self' ${supabaseOrigin}`,
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
  env: { NEXT_PUBLIC_MOCKUPS: process.env.NEXT_PUBLIC_MOCKUPS ?? '' },
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
