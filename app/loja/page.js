import Link from 'next/link';
import Image from 'next/image';
import { getProdutos, slugify, rotuloCategoria } from '@/lib/produtos';
import styles from './loja.module.css';

export const metadata = {
  title: 'Loja — Simplicitude',
  description:
    'Chocolates artesanais Simplicitude — Da Floresta à Fábrica.',
};

const formatBRL = (centavos) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(centavos / 100);

export default async function LojaPage() {
  const produtos = await getProdutos();

  return (
    <main>
      <section className={styles.section}>
        <h1 className={styles.sectionTitle}>Loja</h1>

        {produtos.length === 0 ? (
          <p className={styles.empty}>
            Nenhum produto disponível no momento.
          </p>
        ) : (
          <div className={styles.grid}>
            {produtos.map((produto) => {
              const rotulo = rotuloCategoria(produto);
              return (
                <Link
                  key={produto.id}
                  href={`/loja/${slugify(produto.nome)}`}
                  className={styles.card}
                >
                  {produto.imagem_url ? (
                    <div className={styles.cardImgWrap}>
                      <Image
                        src={produto.imagem_url}
                        alt={produto.nome}
                        fill
                        sizes="(max-width: 640px) 100vw, 300px"
                        className={styles.cardImg}
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

                  <div className={styles.cardBody}>
                    {rotulo && (
                      <span className={styles.cardColecao}>{rotulo}</span>
                    )}
                    <h2 className={styles.cardTitle}>{produto.nome}</h2>
                    <p className={styles.cardDescricao}>
                      {produto.descricao}
                    </p>
                    <div className={styles.cardMeta}>
                      <span className={styles.cardPeso}>
                        {produto.peso_gramas} g
                      </span>
                      <span className={styles.cardPreco}>
                        {formatBRL(produto.preco_centavos)}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </main>
  );
}
