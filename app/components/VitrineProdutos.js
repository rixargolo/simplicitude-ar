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

// Vitrine de produtos da home: carrossel com scroll horizontal (scroll-snap)
// dos produtos ativos mais recentemente cadastrados, com setas de navegação
// e link para a loja completa.
export default function VitrineProdutos({ produtos }) {
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
    <section className={styles.section}>
      <div className={styles.header}>
        <h2 className={styles.sectionTitle}>Confira nossa Loja</h2>
        <Link href="/loja" className={styles.verTodos}>
          Ver todos
        </Link>
      </div>

      <div className={styles.carousel}>
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
              {produto.imagem_url ? (
                <div className={styles.slideImgWrap}>
                  <Image
                    src={produto.imagem_url}
                    alt={produto.nome}
                    fill
                    sizes="(max-width: 640px) 60vw, 240px"
                    className={styles.slideImg}
                  />
                  {produto.estoque === 0 && (
                    <span className={styles.esgotado}>Esgotado</span>
                  )}
                </div>
              ) : (
                <div className={styles.imgPlaceholder} aria-hidden="true">
                  {produto.nome.charAt(0)}
                  {produto.estoque === 0 && (
                    <span className={styles.esgotado}>Esgotado</span>
                  )}
                </div>
              )}

              <div className={styles.slideBody}>
                <h3 className={styles.slideTitle}>{produto.nome}</h3>
                <span className={styles.slidePreco}>
                  {formatBRL(produto.preco_centavos)}
                </span>
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
