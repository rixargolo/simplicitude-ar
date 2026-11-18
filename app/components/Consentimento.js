'use client';

import { Suspense, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  EVENTO_PREFERENCIAS,
  cookiesParaApagar,
  deveCarregarGtm,
  gravarEscolha,
  gtmIdValido,
  lerEscolha,
  mostrarBanner,
  origemNaoEncontrado,
} from '@/lib/consentimento';
import { idiomaDoCaminho } from '@/lib/i18n';
import styles from './Consentimento.module.css';

// Comparação literal: o Next só inlina process.env.NEXT_PUBLIC_* assim (fixada em next.config.mjs).
const GTM_ID = gtmIdValido(process.env.NEXT_PUBLIC_GTM_ID);

// O EN vale nas rotas /en/... (hoje só /en/meditacao, ADR 0002, I2 enxuta).
const TEXTOS = {
  pt: {
    aviso:
      'Coletamos alguns dados para o site funcionar (essenciais) e outros para medir o uso e melhorar sua experiência (você pode personalizar). Ao continuar navegando, você está ciente disso.',
    saibaMais: 'Saiba mais',
    ok: 'OK',
    personalizar: 'Personalizar',
    titulo: 'Preferências de cookies',
    essenciais: 'Essenciais',
    essenciaisTexto: 'Fazem o site funcionar e guardam a sua escolha sobre cookies. Sempre ativos.',
    medicao: 'Medição e marketing',
    medicaoTexto:
      'Google Analytics e Meta Pixel, para medir o uso do site e mostrar anúncios. Ao desativar, apagamos esses cookies e recarregamos a página.',
    salvar: 'Salvar',
    aria: 'Aviso de cookies',
  },
  en: {
    aviso:
      'We collect some data so the site works (essential) and some to measure usage and improve your experience (you can customize). By continuing to browse, you acknowledge this.',
    saibaMais: 'Learn more',
    ok: 'OK',
    personalizar: 'Customize',
    titulo: 'Cookie preferences',
    essenciais: 'Essential',
    essenciaisTexto: 'They make the site work and remember your cookie choice. Always on.',
    medicao: 'Measurement and marketing',
    medicaoTexto:
      'Google Analytics and Meta Pixel, to measure site usage and show ads. If you turn this off, we delete these cookies and reload the page.',
    salvar: 'Save',
    aria: 'Cookie notice',
  },
};

const SNIPPET_GTM = `(function(w,d,s,l,i){w[l]=w[l]||[];w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer',${JSON.stringify(GTM_ID)});`;

// Caminhos (sem query) das duas últimas páginas vistas, para o evento de 404 saber de onde o visitante veio.
const navegacao = { atual: null, anterior: null };

// page_view virtual a cada rota (o App Router navega sem recarregar). Sem dados pessoais.
function RastreioPagina() {
  const pathname = usePathname();
  const busca = useSearchParams().toString();
  useEffect(() => {
    if (navegacao.atual !== pathname) {
      navegacao.anterior = navegacao.atual;
      navegacao.atual = pathname;
    }
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'page_view',
      page_path: busca ? `${pathname}?${busca}` : pathname,
      page_location: window.location.href,
    });
  }, [pathname, busca]);
  return null;
}

export default function Consentimento() {
  // idiomaDoCaminho, não startsWith('/en'): /entrega mostraria o aviso em inglês
  const t = TEXTOS[idiomaDoCaminho(usePathname())];
  const [pronto, setPronto] = useState(false);
  const [escolha, setEscolha] = useState(null);
  const [painel, setPainel] = useState(false);
  const [medicao, setMedicao] = useState(true);
  const tituloRef = useRef(null);

  useEffect(() => {
    setEscolha(lerEscolha(window.localStorage));
    setPronto(true);
  }, []);

  useEffect(() => {
    const abrir = () => {
      setMedicao(escolha !== 'recusado');
      setPainel(true);
    };
    window.addEventListener(EVENTO_PREFERENCIAS, abrir);
    return () => window.removeEventListener(EVENTO_PREFERENCIAS, abrir);
  }, [escolha]);

  useEffect(() => {
    if (painel) tituloRef.current?.focus();
  }, [painel]);

  if (!GTM_ID || !pronto) return null;

  const carregar = deveCarregarGtm(GTM_ID, escolha);

  function aceitar() {
    gravarEscolha(window.localStorage, 'aceito');
    setEscolha('aceito');
    setPainel(false);
  }

  function salvar() {
    if (medicao) return aceitar();
    gravarEscolha(window.localStorage, 'recusado');
    if (escolha === 'recusado') return setPainel(false);
    cookiesParaApagar(document.cookie, window.location.hostname).forEach((c) => {
      document.cookie = c;
    });
    window.location.reload(); // limpa o script e o dataLayer já carregados
  }

  return (
    <>
      {carregar && (
        <>
          <Script id="gtm" strategy="afterInteractive">
            {SNIPPET_GTM}
          </Script>
          <Suspense fallback={null}>
            <RastreioPagina />
          </Suspense>
        </>
      )}

      {(painel || mostrarBanner(GTM_ID, escolha)) && (
        <section
          className={styles.aviso}
          aria-label={painel ? t.titulo : t.aria}
          onKeyDown={(e) => e.key === 'Escape' && painel && setPainel(false)}
        >
          {painel ? (
            <div className={styles.painel}>
              <h2 className={styles.titulo} ref={tituloRef} tabIndex={-1}>
                {t.titulo}
              </h2>
              <label className={styles.opcao}>
                <input type="checkbox" role="switch" checked disabled />
                <span>
                  <strong>{t.essenciais}</strong>
                  <span className={styles.ajuda}>{t.essenciaisTexto}</span>
                </span>
              </label>
              <label className={styles.opcao}>
                <input
                  type="checkbox"
                  role="switch"
                  checked={medicao}
                  onChange={(e) => setMedicao(e.target.checked)}
                />
                <span>
                  <strong>{t.medicao}</strong>
                  <span className={styles.ajuda}>{t.medicaoTexto}</span>
                </span>
              </label>
              <div className={styles.botoes}>
                <button type="button" className={styles.botao} onClick={salvar}>
                  {t.salvar}
                </button>
              </div>
            </div>
          ) : (
            <div className={styles.corpo}>
              <p className={styles.texto}>
                {t.aviso}{' '}
                <Link href="/privacidade" className={styles.link}>
                  {t.saibaMais}
                </Link>
              </p>
              <div className={styles.botoes}>
                <button type="button" className={styles.botao} onClick={aceitar}>
                  {t.ok}
                </button>
                <button
                  type="button"
                  className={`${styles.botao} ${styles.contorno}`}
                  onClick={() => {
                    setMedicao(true);
                    setPainel(true);
                  }}
                >
                  {t.personalizar}
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </>
  );
}

// Evento page_not_found: renderizado pela página 404, uma vez por exibição (o ref barra o StrictMode).
// Só empurra quando o GTM carregaria (mesma regra do page_view). Sem dados pessoais: caminho sem query.
export function EventoNaoEncontrado() {
  const pathname = usePathname();
  const enviado = useRef(null);
  useEffect(() => {
    if (enviado.current === pathname) return;
    enviado.current = pathname;
    if (!deveCarregarGtm(GTM_ID, lerEscolha(window.localStorage))) return;
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      event: 'page_not_found',
      page_path: pathname,
      origem_404: origemNaoEncontrado(navegacao, pathname, document.referrer, window.location.origin),
    });
  }, [pathname]);
  return null;
}

// Link "Preferências de cookies" do rodapé: reabre o painel. Some sem GTM ID (preview/dev).
export function BotaoPreferenciasCookies({ className }) {
  if (!GTM_ID) return null;
  return (
    <button
      type="button"
      className={className}
      onClick={() => window.dispatchEvent(new Event(EVENTO_PREFERENCIAS))}
    >
      Preferências de cookies
    </button>
  );
}
