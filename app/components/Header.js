'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Header.module.css';
import LogoAnimado from './LogoAnimado';
import { itensMenu } from '@/lib/navegacao';

export default function Header() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const links = itensMenu();

  const renderLinks = (onClick) =>
    links.map((link) => {
      const ativo = pathname === link.href || pathname.startsWith(`${link.href}/`);
      return (
        <Link
          key={link.href}
          href={link.href}
          className={`${styles.navLink} ${ativo ? styles.navLinkAtivo : ''}`}
          aria-current={ativo ? 'page' : undefined}
          onClick={onClick}
        >
          {link.rotulo}
        </Link>
      );
    });

  return (
    <header className={styles.header}>
      <div className={styles.bar}>
        <Link href="/" className={styles.logoLink} onClick={() => setOpen(false)}>
          <LogoAnimado />
        </Link>

        <nav className={styles.navDesktop} aria-label="Navegação principal">
          {renderLinks()}
        </nav>

        <button
          type="button"
          className={styles.menuBtn}
          aria-expanded={open}
          aria-controls="menu-mobile"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? 'Fechar' : 'Menu'}
        </button>
      </div>

      {open && (
        <nav id="menu-mobile" className={styles.navMobile} aria-label="Navegação principal (mobile)">
          {renderLinks(() => setOpen(false))}
        </nav>
      )}
    </header>
  );
}
