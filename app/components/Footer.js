import Link from 'next/link';
import styles from './Footer.module.css';
import { itensMenu } from '@/lib/navegacao';
import { BotaoPreferenciasCookies } from './Consentimento';
import { WHATSAPP_EXIBICAO, linkWhatsApp } from '@/lib/whatsapp';

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.top}>
        <div className={styles.column}>
          <Link href="/" className={styles.logoLink} aria-label="Simplicitude — página inicial">
            <span className={styles.logo} aria-hidden="true" />
          </Link>
          <p className={styles.tagline}>Da Floresta à Fábrica</p>
        </div>

        <address className={styles.address}>
          <a href={linkWhatsApp()} target="_blank" rel="noreferrer noopener">
            WhatsApp {WHATSAPP_EXIBICAO}
          </a>
          <a href="mailto:viva@simplicitude.com.br">viva@simplicitude.com.br</a>
          <a href="https://instagram.com/simplicitude.co" target="_blank" rel="noreferrer noopener">
            @simplicitude.co
          </a>
          <span>
            Rua Clarindo Teixeira, nº20, 1º andar
            <br />
            Centro, Coaraci, Bahia, Brasil.
          </span>
        </address>

        <nav className={styles.nav} aria-label="Navegação (rodapé)">
          {itensMenu().map((link) => (
            <Link key={link.href} href={link.href} className={styles.navLink}>
              {link.rotulo}
            </Link>
          ))}
        </nav>

        <div className={styles.column}>
          <h2 className={styles.titulo}>Políticas</h2>
          <nav className={styles.nav} aria-label="Políticas">
            <Link href="/privacidade" className={styles.navLink}>Privacidade</Link>
            <Link href="/entrega" className={styles.navLink}>Entrega</Link>
            <Link href="/trocas" className={styles.navLink}>Trocas e devoluções</Link>
            <BotaoPreferenciasCookies className={`${styles.navLink} ${styles.botaoLink}`} />
          </nav>
        </div>
      </div>

      <div className={styles.bottom}>
        <p>© {year} Simplicitude. Todos os direitos reservados.</p>
        <p>Razão social: 44387834 SHEYLLA TOMÁS SILVA ME</p>
        <p>CNPJ 44.387.834/0001-77</p>
      </div>
    </footer>
  );
}
