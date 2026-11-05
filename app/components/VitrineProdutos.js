'use client';

import { useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { slugify } from '@/lib/produtos';
import styles from './VitrineProdutos.module.css';

const formatBRL = (centavos) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(centavos / 100);

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
            <Link
              key={produto.id}
              href={`/loja/${slugify(produto.nome)}`}
              className={styles.slide}
            >
              <div className={styles.slideImgWrap}>
                {produto.imagem_url ? (
                  <Image
                    src={produto.imagem_url}
                    alt={produto.nome}
                    fill
                    sizes="(max-width: 900px) 70vw, 18rem"
                    className={styles.slideImg}
                  />
                ) : (
                  <span className={styles.inicial} aria-hidden="true">
                    {produto.nome.charAt(0)}
                  </span>
                )}
                {produto.estoque === 0 && <span className={styles.esgotado}>Esgotado</span>}
              </div>

              <div className={styles.slideBody}>
                {produto.categorias?.nome && (
                  <span className={styles.categoria}>{produto.categorias.nome}</span>
                )}
                <h3 className={styles.slideTitle}>{produto.nome}</h3>
                {produto.descricao && <p className={styles.descricao}>{produto.descricao}</p>}
                <span className={styles.slidePreco}>{formatBRL(produto.preco_centavos)}</span>
              </div>
            </Link>
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
