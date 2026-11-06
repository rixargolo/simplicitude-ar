'use client';

import { useEffect, useReducer, useRef, useSyncExternalStore } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { reducer } from '@/lib/carrossel';
import FotoPendente from './FotoPendente';
import styles from './HeroCarrossel.module.css';

const INTERVALO_MS = 6000;
const MOVIMENTO_REDUZIDO = '(prefers-reduced-motion: reduce)';

// Tudo o que muda de um layout para outro fica aqui e no CSS (`.sobreposto …`).
// O markup é o mesmo: um 2º layout (ex.: `dividido`) é uma entrada nova neste mapa
// mais um bloco no CSS. `especFoto` é a única fonte do texto dos placeholders.
const LAYOUTS = {
  sobreposto: {
    sizes: '100vw',
    especFoto:
      'Foto do slide: horizontal 16:9, 2400×1350 px (mínimo 1920×1080), JPG ou WebP. Assunto no centro e canto inferior esquerdo calmo (o cartão cobre essa área).',
  },
};

const assinarMovimento = (aviso) => {
  const mq = window.matchMedia(MOVIMENTO_REDUZIDO);
  mq.addEventListener('change', aviso);
  return () => mq.removeEventListener('change', aviso);
};
const movimentoReduzido = () => window.matchMedia(MOVIMENTO_REDUZIDO).matches;

// slides: [{ id, rotulo, titulo, texto, cta: { rotulo, href }, imagem?: { src, alt } }]
export default function HeroCarrossel({ slides, layout = 'sobreposto' }) {
  const total = slides.length;
  const config = LAYOUTS[layout];
  const [estado, dispatch] = useReducer(reducer, {
    indice: 0,
    total,
    pausado: false,
    interagindo: false,
  });
  const reduzido = useSyncExternalStore(assinarMovimento, movimentoReduzido, () => false);
  // hover e foco de teclado pausam por motivos independentes
  const motivos = useRef({ hover: false, foco: false });

  const interagir = (chave, valor) => {
    motivos.current[chave] = valor;
    dispatch({ tipo: 'interagir', valor: motivos.current.hover || motivos.current.foco });
  };

  // Um timer por slide: navegar à mão (muda `indice`) reinicia a contagem.
  useEffect(() => {
    if (reduzido || total < 2 || estado.pausado || estado.interagindo) return;
    const id = setTimeout(() => dispatch({ tipo: 'tick' }), INTERVALO_MS);
    return () => clearTimeout(id);
  }, [reduzido, total, estado.indice, estado.pausado, estado.interagindo]);

  return (
    <section
      className={`${styles.raiz} ${styles[layout]}`}
      aria-roledescription="carrossel"
      aria-label="Destaques"
      onMouseEnter={() => interagir('hover', true)}
      onMouseLeave={() => interagir('hover', false)}
      onFocus={(e) => e.target.matches(':focus-visible') && interagir('foco', true)}
      onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && interagir('foco', false)}
      onTouchStart={() => !estado.pausado && dispatch({ tipo: 'alternarPausa' })}
    >
      <div className={styles.palco} aria-live={estado.pausado || reduzido ? 'polite' : 'off'}>
        {slides.map((slide, i) => {
          const ativo = i === estado.indice;
          const Titulo = i === 0 ? 'h1' : 'h2';
          return (
            <div
              key={slide.id}
              className={`${styles.slide} ${ativo ? styles.slideAtivo : ''}`}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} de ${total}`}
              aria-hidden={!ativo}
              inert={!ativo}
            >
              <div className={styles.foto}>
                {slide.imagem ? (
                  <Image
                    src={slide.imagem.src}
                    alt={slide.imagem.alt}
                    fill
                    sizes={config.sizes}
                    preload={i === 0}
                    className={styles.img}
                    style={slide.imagem.posicao ? { objectPosition: slide.imagem.posicao } : undefined}
                  />
                ) : (
                  <FotoPendente especificacao={config.especFoto} />
                )}
              </div>
              <div className={styles.cartao}>
                <Titulo className={styles.titulo}>{slide.titulo}</Titulo>
                <p className={styles.texto}>{slide.texto}</p>
                <Link href={slide.cta.href} className={styles.botao}>
                  {slide.cta.rotulo}
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {total > 1 && (
        <div className={styles.controles}>
          <button
            type="button"
            className={styles.seta}
            onClick={() => dispatch({ tipo: 'voltar' })}
            aria-label="Slide anterior"
          >
            ‹
          </button>
          {slides.map((slide, i) => (
            <button
              key={slide.id}
              type="button"
              className={`${styles.ponto} ${i === estado.indice ? styles.pontoAtivo : ''}`}
              onClick={() => dispatch({ tipo: 'ir', indice: i })}
              aria-label={`Slide ${i + 1}: ${slide.rotulo}`}
              aria-current={i === estado.indice}
            />
          ))}
          <button
            type="button"
            className={styles.seta}
            onClick={() => dispatch({ tipo: 'avancar' })}
            aria-label="Próximo slide"
          >
            ›
          </button>
        </div>
      )}
    </section>
  );
}
