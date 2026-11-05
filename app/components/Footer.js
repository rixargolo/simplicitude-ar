import Link from 'next/link';
import styles from './Footer.module.css';
import { itensMenu, mockupsLigados } from '@/lib/navegacao';

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
          <a href="https://wa.me/5573920026708" target="_blank" rel="noreferrer noopener">
            WhatsApp (73) 9 2002-6708
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
      </div>

      <div className={styles.bottom}>
        <p>© {year} Simplicitude. Todos os direitos reservados.</p>
        {/* Só no preview: em produção a linha some até a dona enviar os dados (check do D2). */}
        {mockupsLigados() && <p>Razão social e CNPJ a confirmar.</p>}
      </div>
    </footer>
  );
}
