import { notFound } from 'next/navigation';
import Image from 'next/image';
import { getProdutoBySlug } from '@/lib/produtos';
import styles from './produto.module.css';

const formatBRL = (centavos) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(centavos / 100);

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const produto = await getProdutoBySlug(slug);

  if (!produto) {
    return { title: 'Produto não encontrado — Simplicitude' };
  }

  return {
    title: `${produto.nome} — Simplicitude`,
    description: produto.descricao,
  };
}

export default async function ProdutoPage({ params }) {
  const { slug } = await params;
  const produto = await getProdutoBySlug(slug);

  if (!produto) {
    notFound();
  }

  return (
    <main>
      <section className={styles.section}>
        <div className={styles.grid}>
          {produto.imagem_url ? (
            <div className={styles.imgWrap}>
              <Image
                src={produto.imagem_url}
                alt={produto.nome}
                fill
                sizes="(max-width: 640px) 100vw, 480px"
                className={styles.img}
                priority
              />
            </div>
          ) : (
            <div className={styles.imgPlaceholder} aria-hidden="true">
              {produto.nome.charAt(0)}
            </div>
          )}

          <div className={styles.info}>
            <span className={styles.colecao}>{produto.colecao}</span>
            <h1 className={styles.title}>{produto.nome}</h1>
            <p className={styles.descricao}>{produto.descricao}</p>

            <div className={styles.meta}>
              <span className={styles.peso}>{produto.peso_gramas} g</span>
              <span className={styles.preco}>
                {formatBRL(produto.preco_centavos)}
              </span>
            </div>

            <div className={styles.actions}>
              <button className={styles.cta}>Comprar</button>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
