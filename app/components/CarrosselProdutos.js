'use client';

import { useRef } from 'react';
import CardProduto from './CardProduto';
import styles from './CarrosselProdutos.module.css';

// Trilho scroll-snap de CardProduto com setas no desktop e toque no celular; o próximo card aparece
// cortado na borda direita. Usado pela vitrine da home e pelos carrosséis da /loja (X14). Não renderiza
// título nem link: quem usa põe o cabeçalho. `rotulo` distingue as setas quando há vários na página
// (leitor de tela); `Titulo` é o nível do nome do produto no card; `className` entra no elemento raiz
// (a vitrine zera o respiro da esquerda com `--pad-esq: 0`).
export default function CarrosselProdutos({ produtos, rotulo, sizes, Titulo, className = '' }) {
  const trackRef = useRef(null);

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
      <button
        type="button"
        className={`${styles.arrow} ${styles.arrowPrev}`}
        onClick={() => scrollByAmount(-1)}
        aria-label={`${nome} anteriores`}
      >
        ‹
      </button>

      <div className={styles.track} ref={trackRef}>
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

      <button
        type="button"
        className={`${styles.arrow} ${styles.arrowNext}`}
        onClick={() => scrollByAmount(1)}
        aria-label={`${nome} seguintes`}
      >
        ›
      </button>
    </div>
  );
}
