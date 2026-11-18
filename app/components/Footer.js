'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './Footer.module.css';
import { itensMenu } from '@/lib/navegacao';
import { PARES_EN, idiomaDoCaminho, textos } from '@/lib/i18n';
import { BotaoPreferenciasCookies } from './Consentimento';
import { WHATSAPP_EXIBICAO, linkWhatsApp } from '@/lib/whatsapp';

// Client só para saber o idioma pela rota (ADR 0002); as políticas seguem em PT (as páginas ainda não têm EN).
export default function Footer() {
  const year = new Date().getFullYear();
  const idioma = idiomaDoCaminho(usePathname());
  const t = textos(idioma).rodape;
  const menu = textos(idioma).menu;

  return (
    <footer className={styles.footer}>
      <div className={styles.top}>
        <div className={styles.column}>
          <Link href="/" className={styles.logoLink} aria-label={t.inicio}>
            <span className={styles.logo} aria-hidden="true" />
          </Link>
          <p className={styles.tagline}>{t.tagline}</p>
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
            {t.rua}
            <br />
            {t.cidade}
          </span>
        </address>

        <nav className={styles.nav} aria-label={t.navegacao}>
          {itensMenu().map((link) => (
            <Link
              key={link.href}
              href={idioma === 'en' ? PARES_EN[link.href] ?? link.href : link.href}
              className={styles.navLink}
            >
              {idioma === 'en' ? menu[link.href] ?? link.rotulo : link.rotulo}
            </Link>
          ))}
        </nav>

        <div className={styles.column}>
          <h2 className={styles.titulo}>{t.politicas}</h2>
          <nav className={styles.nav} aria-label={t.politicas}>
            <Link href="/privacidade" className={styles.navLink}>{t.privacidade}</Link>
            <Link href="/entrega" className={styles.navLink}>{t.entrega}</Link>
            <Link href="/trocas" className={styles.navLink}>{t.trocas}</Link>
            <BotaoPreferenciasCookies className={`${styles.navLink} ${styles.botaoLink}`} />
          </nav>
        </div>
      </div>

      <div className={styles.bottom}>
        <p>© {year} Simplicitude. {t.direitos}</p>
        <p>{t.razao}: 44387834 SHEYLLA TOMÁS SILVA ME</p>
        <p>CNPJ 44.387.834/0001-77</p>
      </div>
    </footer>
  );
}
