'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import CardProduto from './CardProduto';
import styles from './CarrosselProdutos.module.css';

// Trilho scroll-snap de CardProduto com setas no desktop e toque no celular; o próximo card aparece
// cortado na borda direita. Usado pela vitrine da home e pelos carrosséis da /loja (X14). Não renderiza
// título nem link: quem usa põe o cabeçalho. `rotulo` distingue as setas quando há vários na página
// (leitor de tela); `Titulo` é o nível do nome do produto no card; `className` entra no elemento raiz
// (a vitrine zera o respiro da esquerda com `--pad-esq: 0`). `cabecalho` (opcional) ocupa o lugar do 1º card,
// com a largura dele (título da coleção na /loja); a seta "anterior" só aparece depois que ele saiu da tela.
// Setas e pontos só existem quando o trilho de fato rola (conteúdo mais largo que a tela); a seta "seguinte"
// some ao chegar ao fim. Os pontos (uma "página" = uma largura de tela) indicam que há mais a ver.
const INICIAL = { rolavel: false, noInicio: true, noFim: true, paginas: 1, atual: 0 };

export default function CarrosselProdutos({ produtos, rotulo, sizes, Titulo, cabecalho, className = '' }) {
  const trackRef = useRef(null);
  const cabRef = useRef(null);
  const [m, setM] = useState(INICIAL);

  const medir = useCallback(() => {
    const t = trackRef.current;
    if (!t) return;
    const max = t.scrollWidth - t.clientWidth;
    const rolavel = max > 8; // folga de subpixel
    const paginas = rolavel ? Math.ceil(t.scrollWidth / t.clientWidth) : 1;
    const prox = {
      rolavel,
      // com título, a seta "anterior" só entra depois que ele saiu inteiro (senão cobre o texto)
      noInicio: t.scrollLeft < Math.max(8, cabRef.current?.offsetWidth ?? 0),
      noFim: t.scrollLeft >= max - 8,
      paginas,
      atual: rolavel ? Math.round((t.scrollLeft / max) * (paginas - 1)) : 0,
    };
    // só troca o estado se algo mudou (onScroll dispara o tempo todo)
    setM((a) => (Object.keys(prox).every((k) => a[k] === prox[k]) ? a : prox));
  }, []);

  useEffect(() => {
    medir();
    const ro = new ResizeObserver(medir);
    ro.observe(trackRef.current);
    return () => ro.disconnect();
  }, [medir, produtos.length]);

  function scrollByAmount(direction) {
    const track = trackRef.current;
    if (!track) return;
    const slide = track.querySelector(`.${styles.slide}`);
    const amount = slide ? slide.getBoundingClientRect().width + 24 : track.clientWidth;
    track.scrollBy({ left: direction * amount, behavior: 'smooth' });
  }

  const nome = rotulo ? `${rotulo}: produtos` : 'Produtos';

  return (
    <div className={`${styles.trilho} ${className}`}>
      {m.rolavel && !m.noInicio && (
        <button
          type="button"
          className={`${styles.arrow} ${styles.arrowPrev}`}
          onClick={() => scrollByAmount(-1)}
          aria-label={`${nome} anteriores`}
        >
          ‹
        </button>
      )}

      <div className={styles.track} ref={trackRef} onScroll={medir}>
        {cabecalho && (
          <div className={styles.cabecalho} ref={cabRef}>
            {cabecalho}
          </div>
        )}
        {produtos.map((produto) => (
          <CardProduto
            key={produto.id}
            produto={produto}
            Titulo={Titulo}
            className={styles.slide}
            sizes={sizes}
          />
        ))}
      </div>

      {m.rolavel && !m.noFim && (
        <button
          type="button"
          className={`${styles.arrow} ${styles.arrowNext}`}
          onClick={() => scrollByAmount(1)}
          aria-label={`${nome} seguintes`}
        >
          ›
        </button>
      )}

      {m.rolavel && m.paginas > 1 && (
        <div className={styles.pontos} aria-hidden="true">
          {Array.from({ length: m.paginas }, (_, i) => (
            <span key={i} className={i === m.atual ? `${styles.ponto} ${styles.pontoAtivo}` : styles.ponto} />
          ))}
        </div>
      )}
    </div>
  );
}
