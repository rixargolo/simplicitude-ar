import Link from 'next/link';
import Image from 'next/image';
import styles from './GradeCategorias.module.css';

// Grade de categorias da home: um campo de cor cheio por categoria, nome grande em serifa
// itálica. `categoria.imagem_url` é opcional (a coluna só nasce no C2): quando vier, a foto
// entra no topo do cartão sem mexer no resto.
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
                  sizes="(max-width: 720px) 100vw, 50vw"
                  className={styles.fotoImg}
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
                {c.total} {c.total === 1 ? 'produto' : 'produtos'}
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
