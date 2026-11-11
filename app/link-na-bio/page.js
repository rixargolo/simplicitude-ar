import Link from 'next/link';
import styles from './page.module.css';
import { BotaoPreferenciasCookies } from '../components/Consentimento';
import { WHATSAPP_EXIBICAO, linkWhatsApp } from '@/lib/whatsapp';

export const metadata = {
  title: 'Links — Simplicitude',
  description: 'Chocolate artesanal da Simplicitude: presentes, loja, meditação e contato.',
};

// Links fixos no código (sem admin). `externo` abre em nova aba; `destaque` é o botão preenchido.
const LINKS = [
  { rotulo: 'Presentes de Natal', href: '/loja?categoria=presentes', destaque: true },
  { rotulo: 'Loja', href: '/loja' },
  { rotulo: 'Meditação', href: '/meditacao' },
  {
    rotulo: `WhatsApp ${WHATSAPP_EXIBICAO}`,
    href: linkWhatsApp('Olá! Vim pelo link da bio'),
    externo: true,
  },
  { rotulo: 'E-mail viva@simplicitude.com.br', href: 'mailto:viva@simplicitude.com.br', externo: true },
  { rotulo: 'Acesse o site', href: '/' },
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
        {LINKS.map(({ rotulo, href, destaque, externo }) => {
          const classe = `${styles.botao} ${destaque ? styles.destaque : ''}`;
          return (
            <li key={href}>
              {externo ? (
                <a
                  href={href}
                  className={classe}
                  {...(href.startsWith('http') && { target: '_blank', rel: 'noopener noreferrer' })}
                >
                  {rotulo}
                </a>
              ) : (
                <Link href={href} className={classe}>
                  {rotulo}
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
