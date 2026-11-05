import localFont from 'next/font/local';
import './globals.css';
import Header from './components/Header';
import Footer from './components/Footer';
import SiteChrome from './components/SiteChrome';
import SeletorPaleta from './components/SeletorPaleta';
import { scriptPaleta } from '@/lib/paletas';

// Fontes hospedadas no projeto (app/fonts, subconjunto latin, variáveis): o build não
// depende do Google Fonts, que já derrubou o build no Netlify. Ver app/fonts/LEIA-ME.md.
const cinzel = localFont({
  src: './fonts/cinzel-latin.woff2',
  weight: '400 900',
  variable: '--font-cinzel',
  display: 'swap',
  adjustFontFallback: 'Times New Roman',
});

const ebGaramond = localFont({
  src: [
    { path: './fonts/eb-garamond-latin.woff2', weight: '400 800', style: 'normal' },
    { path: './fonts/eb-garamond-italic-latin.woff2', weight: '400 800', style: 'italic' },
  ],
  variable: '--font-eb-garamond',
  display: 'swap',
  adjustFontFallback: 'Times New Roman',
});

const cormorantGaramond = localFont({
  src: [
    { path: './fonts/cormorant-garamond-latin.woff2', weight: '300 700', style: 'normal' },
    { path: './fonts/cormorant-garamond-italic-latin.woff2', weight: '300 700', style: 'italic' },
  ],
  variable: '--font-cormorant',
  display: 'swap',
  adjustFontFallback: 'Times New Roman',
});

export const metadata = {
  title: 'Simplicitude',
  description: 'Chocolate artesanal — Da Floresta à Fábrica',
};

export default function RootLayout({ children }) {
  const paleta = scriptPaleta(); // null em produção (sem NEXT_PUBLIC_MOCKUPS=1)
  return (
    <html
      lang="pt-BR"
      className={`${cinzel.variable} ${ebGaramond.variable} ${cormorantGaramond.variable}`}
      suppressHydrationWarning // scripts inline alteram style/data-/class do <html> antes da hidratação
    >
      <body>
        {paleta && (
          // Paleta do preview aplicada antes da 1ª pintura (sem flash), ver lib/paletas.js
          <script dangerouslySetInnerHTML={{ __html: paleta }} />
        )}
        {paleta && <SeletorPaleta />}
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
