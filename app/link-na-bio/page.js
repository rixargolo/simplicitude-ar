import Link from 'next/link';
import styles from './page.module.css';
import { BotaoPreferenciasCookies } from '../components/Consentimento';
import { linkWhatsApp } from '@/lib/whatsapp';

export const metadata = {
  title: 'Links — Simplicitude',
  description: 'Chocolate artesanal da Simplicitude: presentes, loja, meditação e contato.',
};

// Ícones inline (traço estilo Lucide, o do WhatsApp é o mesmo do BotaoComprar): sem biblioteca, herdam a cor do botão.
const ICONES = {
  presente: (
    <>
      <rect x="3" y="8" width="18" height="4" rx="1" />
      <path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7M7.5 8a2.5 2.5 0 0 1 0-5C11 3 12 8 12 8s1-5 4.5-5a2.5 2.5 0 0 1 0 5" />
    </>
  ),
  sacola: (
    <>
      <path d="M5 8h14l-1 12H6L5 8Z" />
      <path d="M9 8V6a3 3 0 0 1 6 0v2" />
    </>
  ),
  folha: (
    <>
      <path d="M11 20A7 7 0 0 1 9.8 6.1C15.5 5 17 4.48 19 2c1 2 2 4.18 2 8 0 5.5-4.78 10-10 10Z" />
      <path d="M2 21c0-3 1.85-5.36 5.08-6C9.5 14.52 12 13 13 12" />
    </>
  ),
  whatsapp: <path fill="currentColor" stroke="none" d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />,
  envelope: (
    <>
      <rect x="2" y="4" width="20" height="16" rx="2" />
      <path d="m22 7-10 5L2 7" />
    </>
  ),
  globo: (
    <>
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" />
    </>
  ),
};

// Links fixos no código (sem admin). `externo` abre em nova aba; `destaque` é o botão preenchido.
const LINKS = [
  { rotulo: 'Presentes para o Natal', icone: 'presente', href: '/loja?categoria=presentes', destaque: true },
  { rotulo: 'Loja', icone: 'sacola', href: '/loja' },
  { rotulo: 'Meditação', icone: 'folha', href: '/meditacao' },
  {
    rotulo: 'WhatsApp',
    icone: 'whatsapp',
    href: linkWhatsApp('Olá! Vim pelo link da bio'),
    externo: true,
  },
  { rotulo: 'E-mail', icone: 'envelope', href: 'mailto:viva@simplicitude.com.br', externo: true },
  { rotulo: 'Acesse o site', icone: 'globo', href: '/' },
];

export default function LinkNaBioPage() {
  return (
    <main className={styles.main}>
      <header className={styles.topo}>
        <span className={styles.simbolo} aria-hidden="true" />
        <h1 className={styles.h1}>
          <span className={styles.logo} role="img" aria-label="Simplicitude" />
        </h1>
        <p className={styles.mote}>Salvar o mundo comendo chocolate</p>
      </header>

      <ul className={styles.lista}>
        {LINKS.map(({ rotulo, icone, href, destaque, externo }) => {
          const classe = `${styles.botao} ${destaque ? styles.destaque : ''}`;
          const conteudo = (
            <>
              <svg
                className={styles.icone}
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                focusable="false"
              >
                {ICONES[icone]}
              </svg>
              {rotulo}
            </>
          );
          return (
            <li key={href}>
              {externo ? (
                <a
                  href={href}
                  className={classe}
                  {...(href.startsWith('http') && { target: '_blank', rel: 'noopener noreferrer' })}
                >
                  {conteudo}
                </a>
              ) : (
                <Link href={href} className={classe}>
                  {conteudo}
                </Link>
              )}
            </li>
          );
        })}
      </ul>

      <BotaoPreferenciasCookies className={styles.cookies} />
    </main>
  );
}
