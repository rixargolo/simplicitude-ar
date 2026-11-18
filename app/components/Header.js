'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Header.module.css';
import LogoAnimado from './LogoAnimado';
import BuscaHeader from './BuscaHeader';
import { itensMenu } from '@/lib/navegacao';
import {
  COOKIE_IDIOMA,
  COOKIE_IDIOMA_SEGUNDOS,
  PARES_EN,
  caminhoNoOutroIdioma,
  idiomaDoCaminho,
  textos,
} from '@/lib/i18n';

// Só a escolha explícita grava o cookie (ADR 0002): abrir um link /en compartilhado não grava.
const lembrarIdioma = (idioma) => {
  document.cookie = `${COOKIE_IDIOMA}=${idioma}; path=/; max-age=${COOKIE_IDIOMA_SEGUNDOS}; samesite=lax`;
};

const NOME_IDIOMA = { pt: 'Português', en: 'English' };

export default function Header() {
  const [open, setOpen] = useState(false);
  const [buscaAberta, setBuscaAberta] = useState(false);
  const pathname = usePathname();
  const idioma = idiomaDoCaminho(pathname);
  const t = textos(idioma);
  const outro = caminhoNoOutroIdioma(pathname); // seletor só onde existe a versão no outro idioma
  const links = itensMenu();

  const renderLinks = (onClick) =>
    links.map((link) => {
      // no EN o rótulo vem do dicionário e o link vai para a versão EN se existir (senão fica na página PT)
      const href = idioma === 'en' ? PARES_EN[link.href] ?? link.href : link.href;
      const rotulo = idioma === 'en' ? t.menu[link.href] ?? link.rotulo : link.rotulo;
      const ativo = pathname === href || pathname.startsWith(`${href}/`);
      return (
        <Link
          key={link.href}
          href={href}
          className={`${styles.navLink} ${ativo ? styles.navLinkAtivo : ''}`}
          aria-current={ativo ? 'page' : undefined}
          onClick={onClick}
        >
          {rotulo}
        </Link>
      );
    });

  return (
    <header className={styles.header}>
      <div className={styles.bar}>
        <Link href="/" className={styles.logoLink} onClick={() => setOpen(false)}>
          <LogoAnimado />
        </Link>

        <nav className={styles.navDesktop} aria-label={t.header.navegacao}>
          {renderLinks()}
        </nav>

        <div className={styles.acoes}>
          {outro && (
            <Link
              href={outro.href}
              hrefLang={outro.idioma}
              lang={outro.idioma}
              aria-label={NOME_IDIOMA[outro.idioma]}
              className={styles.idioma}
              onClick={() => lembrarIdioma(outro.idioma)}
            >
              {outro.idioma.toUpperCase()}
            </Link>
          )}
          <BuscaHeader
            textos={t.busca}
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
            aria-label={open ? t.header.fechar : t.header.abrir}
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
        <nav id="menu-mobile" className={styles.navMobile} aria-label={t.header.navegacaoMobile}>
          {renderLinks(() => setOpen(false))}
        </nav>
      )}
    </header>
  );
}
