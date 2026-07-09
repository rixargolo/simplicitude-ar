'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import styles from './Header.module.css';

const NAV_LINKS = [
  { href: '/', label: 'Início' },
  { href: '/quem-somos', label: 'Quem Somos' },
  { href: '/meditacao', label: 'Meditação' },
  { href: '/loja', label: 'Loja' },
  { href: '/contato', label: 'Contato' },
];

export default function Header() {
  const [open, setOpen] = useState(false);

  return (
    <header className={styles.header}>
      <div className={styles.bar}>
        <Link href="/" className={styles.logoLink} onClick={() => setOpen(false)}>
          <Image
            src="/marca/logo-simplicitude-677w.png"
            alt="Simplicitude"
            width={677}
            height={118}
            sizes="(max-width: 1024px) 30.7vw, 30.7vw"
            className={styles.logo}
            priority
          />
        </Link>

        <nav className={styles.navDesktop} aria-label="Navegação principal">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={styles.navLink}>
              {link.label}
            </Link>
          ))}
        </nav>

        <button
          type="button"
          className={styles.burger}
          aria-label={open ? 'Fechar menu' : 'Abrir menu'}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

      {open && (
        <nav className={styles.navMobile} aria-label="Navegação principal (mobile)">
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={styles.navLink}
              onClick={() => setOpen(false)}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      )}
    </header>
  );
}
