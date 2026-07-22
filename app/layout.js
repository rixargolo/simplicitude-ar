import {
  Cinzel,
  EB_Garamond,
  Cormorant_Garamond,
  Dancing_Script,
} from 'next/font/google';
import './globals.css';
import Header from './components/Header';
import Footer from './components/Footer';
import SiteChrome from './components/SiteChrome';

const cinzel = Cinzel({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-cinzel',
  display: 'swap',
});

const ebGaramond = EB_Garamond({
  subsets: ['latin'],
  weight: ['400', '600'],
  style: ['normal', 'italic'],
  variable: '--font-eb-garamond',
  display: 'swap',
});

const cormorantGaramond = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

const dancingScript = Dancing_Script({
  subsets: ['latin'],
  weight: ['400', '600'],
  variable: '--font-dancing',
  display: 'swap',
});

export const metadata = {
  title: 'Simplicitude',
  description: 'Chocolate artesanal — Da Floresta à Fábrica',
};

export default function RootLayout({ children }) {
  return (
    <html
      lang="pt-BR"
      className={`${cinzel.variable} ${ebGaramond.variable} ${cormorantGaramond.variable} ${dancingScript.variable}`}
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
