import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProdutoBySlug } from '@/lib/produtos';
import ApresentacaoProduto from '../../components/ApresentacaoProduto';
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
        <ApresentacaoProduto produto={produto}>
          <div className={styles.meta}>
            <span className={styles.peso}>{produto.peso_gramas} g</span>
            <span className={styles.preco}>
              {formatBRL(produto.preco_centavos)}
            </span>
          </div>

          <div className={styles.actions}>
            <button className={styles.cta}>Comprar</button>
            {produto.tem_meditacao && (
              <Link href="/meditacao" className={styles.meditacaoLink}>
                Meditação guiada disponível
              </Link>
            )}
          </div>
        </ApresentacaoProduto>
      </section>
    </main>
  );
}
