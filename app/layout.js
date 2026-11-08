import localFont from 'next/font/local';
import './globals.css';
import Header from './components/Header';
import Footer from './components/Footer';
import SiteChrome from './components/SiteChrome';

// Fontes hospedadas no projeto (app/fonts, subconjunto latin): o build não depende do
// Google Fonts, que já derrubou o build no Netlify. Ver app/fonts/LEIA-ME.md.
const fraunces = localFont({
  src: [
    { path: './fonts/fraunces-latin.woff2', weight: '300 700', style: 'normal' },
    { path: './fonts/fraunces-italic-latin.woff2', weight: '300 700', style: 'italic' },
  ],
  variable: '--font-fraunces',
  display: 'swap',
  adjustFontFallback: 'Times New Roman',
});

const assistant = localFont({
  src: [
    { path: './fonts/assistant-400-latin.woff2', weight: '400', style: 'normal' },
    { path: './fonts/assistant-600-latin.woff2', weight: '600', style: 'normal' },
  ],
  variable: '--font-assistant',
  display: 'swap',
  adjustFontFallback: 'Arial',
});

// Amsterdam One: carregada mas sem uso por enquanto (`--font-accent`); a dona vai indicar onde
// entra. preload:false evita baixar 45 KB à toa; o arquivo só é buscado se algum CSS a usar.
const amsterdam = localFont({
  src: './fonts/amsterdam-one-latin.woff2',
  weight: '400',
  variable: '--font-amsterdam',
  display: 'swap',
  preload: false,
});

// SITE_URL (opcional, ADR 0001): endereço público, base das URLs absolutas de og:image e afins.
// No go-live = https://simplicitude.com.br; sem ela, o endereço do preview. URL inválida aborta o build.
// A imagem padrão vem de app/opengraph-image.png; a indexação segue por SITE_INDEXAVEL (next.config.mjs).
export const metadata = {
  metadataBase: new URL(process.env.SITE_URL || 'https://simplicitude-ar.netlify.app'),
  title: 'Simplicitude',
  description: 'Chocolate artesanal — Da Floresta à Fábrica',
  openGraph: { siteName: 'Simplicitude', locale: 'pt_BR', type: 'website' },
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="pt-BR"
      className={`${fraunces.variable} ${assistant.variable} ${amsterdam.variable}`}
      suppressHydrationWarning // o script inline da logo altera a class do <html> antes da hidratação
    >
      <body>
        <script
          // Decide, antes de qualquer paint, se a logo vai animar nesta carga —
          // evita o flash do PNG estático aparecendo antes do traçado começar
          // (useLayoutEffect só age depois da hidratação, tarde demais para o
          // 1º frame vindo do HTML gerado pelo servidor). Mesmas condições e
          // mesma chave de sessionStorage do LogoAnimado — mudou uma, muda a outra.
          dangerouslySetInnerHTML={{
            __html: `(function(){try{
              if (location.pathname === '/' &&
                  !sessionStorage.getItem('simplicitude:logoAnimada') &&
                  !matchMedia('(prefers-reduced-motion: reduce)').matches) {
                document.documentElement.classList.add('logo-animar');
              }
            }catch(e){}})();`,
          }}
        />
        <SiteChrome header={<Header />} footer={<Footer />}>
          {children}
        </SiteChrome>
      </body>
    </html>
  );
}
