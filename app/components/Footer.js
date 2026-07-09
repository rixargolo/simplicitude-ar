import Link from 'next/link';
import Image from 'next/image';
import styles from './Footer.module.css';

const NAV_LINKS = [
  { href: '/', label: 'Início' },
  { href: '/quem-somos', label: 'Quem Somos' },
  { href: '/meditacao', label: 'Meditação' },
  { href: '/loja', label: 'Loja' },
  { href: '/contato', label: 'Contato' },
];

export default function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.top}>
        <div className={styles.column}>
          <Link href="/" className={styles.logoLink}>
            <Image
              src="/marca/logo-simplicitude-677w.png"
              alt="Simplicitude"
              width={677}
              height={118}
              className={styles.logo}
            />
          </Link>

          <address className={styles.address}>
            Rua Clarindo Teixeira, nº20, 1º andar
            <br />
            Centro, Coaraci, Bahia, Brasil.
            <br />
            (73) 99140-8689
            <br />
            <a href="mailto:viva@simplicitude.com.br">
              viva@simplicitude.com.br
            </a>
            <br />
            <a
              href="https://instagram.com/simplicitude.co"
              target="_blank"
              rel="noreferrer noopener"
            >
              @simplicitude.co
            </a>
          </address>
        </div>

        <nav className={styles.column} aria-label="Navegação (rodapé)">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={styles.navLink}>
              {link.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className={styles.bottom}>
        <p className={styles.tagline}>Da Floresta à Fábrica</p>
        <p className={styles.copyright}>
          © {year} Simplicitude. Todos os direitos reservados.
        </p>
      </div>
    </footer>
  );
}
