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

// Pílula do seletor: globo + nome do OUTRO idioma escrito nele mesmo (lang no rótulo). O nome acessível repete o texto
// visível ("Mudar idioma: English") para quem comanda por voz (WCAG 2.5.3). Link + cookie só no clique, como antes.
function SeletorIdioma({ outro, rotulo, className, aoClicar }) {
  return (
    <Link
      href={outro.href}
      hrefLang={outro.idioma}
      aria-label={`${rotulo}: ${NOME_IDIOMA[outro.idioma]}`}
      className={className}
      onClick={() => {
        lembrarIdioma(outro.idioma);
        aoClicar?.();
      }}
    >
      <svg className={styles.idiomaIcone} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <circle cx="12" cy="12" r="9" />
        <path d="M3 12h18" />
        <path d="M12 3c2.5 2.5 3.8 5.5 3.8 9s-1.3 6.5-3.8 9c-2.5-2.5-3.8-5.5-3.8-9S9.5 5.5 12 3z" />
      </svg>
      <span lang={outro.idioma} className={styles.idiomaNome}>{NOME_IDIOMA[outro.idioma]}</span>
    </Link>
  );
}

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
    <header className={`${styles.header} ${outro ? styles.comIdioma : ''}`}>
      <div className={styles.bar}>
        <Link href="/" className={styles.logoLink} onClick={() => setOpen(false)}>
          <LogoAnimado />
        </Link>

        <nav className={styles.navDesktop} aria-label={t.header.navegacao}>
          {renderLinks()}
        </nav>

        <div className={styles.acoes}>
          {outro && <SeletorIdioma outro={outro} rotulo={t.header.mudarIdioma} className={styles.idioma} />}
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
          {outro && (
            <SeletorIdioma
              outro={outro}
              rotulo={t.header.mudarIdioma}
              className={`${styles.idioma} ${styles.idiomaMenu}`}
              aoClicar={() => setOpen(false)}
            />
          )}
        </nav>
      )}
    </header>
  );
}
