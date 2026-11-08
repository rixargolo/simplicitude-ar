'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Header.module.css';
import LogoAnimado from './LogoAnimado';
import BuscaHeader from './BuscaHeader';
import { itensMenu } from '@/lib/navegacao';

export default function Header() {
  const [open, setOpen] = useState(false);
  const [buscaAberta, setBuscaAberta] = useState(false);
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

        <div className={styles.acoes}>
          <BuscaHeader
            aberta={buscaAberta}
            onAbrir={() => {
              setBuscaAberta(true);
              setOpen(false);
            }}
            onFechar={() => setBuscaAberta(false)}
          />
          <button
            type="button"
            className={styles.menuBtn}
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            aria-expanded={open}
            aria-controls="menu-mobile"
            onClick={() => {
              setOpen((v) => !v);
              setBuscaAberta(false);
            }}
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav id="menu-mobile" className={styles.navMobile} aria-label="Navegação principal (mobile)">
          {renderLinks(() => setOpen(false))}
        </nav>
      )}
    </header>
  );
}
