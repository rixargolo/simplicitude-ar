import Link from 'next/link';
import Image from 'next/image';
import { estiloFoto } from '@/lib/foco';
import styles from './GradeCategorias.module.css';

// Grade de categorias da home: cartão claro e arredondado por categoria (estilo do cartão do
// hero), nome em serifa itálica, descrição de 2 linhas, contagem e pílula "Ver produtos".
// `categoria.imagem_url` é opcional (X7): quando vier, a foto entra como faixa 16:9 no topo do
// cartão, enquadrada por foco/zoom (estiloFoto). Com mouse ou foco de teclado o desfoque some; em
// tela de toque não há desfoque (ver .foto::after no CSS). Sem foto, o cartão é o de sempre.
export default function GradeCategorias({ categorias = [] }) {
  if (!categorias || categorias.length === 0) return null;

  return (
    <section className={styles.section} aria-labelledby="categorias-titulo">
      <h2 id="categorias-titulo" className={styles.titulo}>
        Escolha por categoria
      </h2>

      <ul className={styles.grade}>
        {categorias.map((c) => (
          <li key={c.slug} className={styles.cartao}>
            {c.imagem_url && (
              <div className={styles.foto}>
                <Image
                  src={c.imagem_url}
                  alt=""
                  fill
                  sizes="(max-width: 639px) 100vw, (max-width: 1099px) 50vw, 25vw"
                  className={styles.fotoImg}
                  style={estiloFoto(c.imagem_foco_x, c.imagem_foco_y, c.imagem_zoom)}
                />
              </div>
            )}

            <div className={styles.corpo}>
              <h3 className={styles.nome}>
                <Link href={`/loja?categoria=${c.slug}`} className={styles.link}>
                  {c.nome}
                </Link>
              </h3>

              {c.descricao && <p className={styles.descricao}>{c.descricao}</p>}

              <p className={styles.chamada}>
                <span className={styles.ver} aria-hidden="true">
                  Ver produtos <span className={styles.seta}>→</span>
                </span>
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
