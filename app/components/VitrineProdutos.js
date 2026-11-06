'use client';

import { useRef } from 'react';
import Link from 'next/link';
import CardProduto from './CardProduto';
import styles from './VitrineProdutos.module.css';

// Vitrine da home: à esquerda título (derivado do critério de ordem, ver lib/vitrine.js),
// chips de categoria e link para a loja; à direita, carrossel scroll-snap que vai até a
// borda da tela (o próximo card aparece cortado) com setas no desktop.
export default function VitrineProdutos({ titulo, produtos, categorias = [] }) {
  const trackRef = useRef(null);

  if (!produtos || produtos.length === 0) return null;

  function scrollByAmount(direction) {
    const track = trackRef.current;
    if (!track) return;
    const slide = track.querySelector(`.${styles.slide}`);
    const amount = slide ? slide.getBoundingClientRect().width + 24 : track.clientWidth;
    track.scrollBy({ left: direction * amount, behavior: 'smooth' });
  }

  return (
    <section className={styles.section} aria-labelledby="vitrine-titulo">
      <div className={styles.intro}>
        <h2 id="vitrine-titulo" className={styles.titulo}>
          {titulo} <em className={styles.enfase}>da floresta</em>
        </h2>

        {categorias.length > 0 && (
          <ul className={styles.chips}>
            {categorias.map((c) => (
              <li key={c.slug}>
                <Link href={`/loja?categoria=${c.slug}`} className={styles.chip}>
                  {c.nome}
                </Link>
              </li>
            ))}
          </ul>
        )}

        <Link href="/loja" className={styles.botao}>
          Ver toda a loja
        </Link>
      </div>

      <div className={styles.trilho}>
        <button
          type="button"
          className={`${styles.arrow} ${styles.arrowPrev}`}
          onClick={() => scrollByAmount(-1)}
          aria-label="Produtos anteriores"
        >
          ‹
        </button>

        <div className={styles.track} ref={trackRef}>
          {produtos.map((produto) => (
            <CardProduto
              key={produto.id}
              produto={produto}
              className={styles.slide}
              sizes="(max-width: 900px) 70vw, 18rem"
            />
          ))}
        </div>

        <button
          type="button"
          className={`${styles.arrow} ${styles.arrowNext}`}
          onClick={() => scrollByAmount(1)}
          aria-label="Próximos produtos"
        >
          ›
        </button>
      </div>
    </section>
  );
}
