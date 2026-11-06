import { notFound } from 'next/navigation';
import { headers } from 'next/headers';
import Link from 'next/link';
import { getProdutoBySlug, getFotosDoProduto } from '@/lib/produtos';
import ApresentacaoProduto from '../../components/ApresentacaoProduto';
import BotaoComprar from '../../components/BotaoComprar';
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
    // O resto do compartilhamento (imagem 1200x630, metadataBase) é o A11.
    openGraph: {
      title: produto.nome,
      ...(produto.imagem_url && { images: [produto.imagem_url] }),
    },
  };
}

export default async function ProdutoPage({ params }) {
  const { slug } = await params;
  const produto = await getProdutoBySlug(slug);

  if (!produto) {
    notFound();
  }

  const fotos = await getFotosDoProduto(produto);

  // Endereço absoluto da página para a mensagem do WhatsApp; vale no preview e no domínio novo.
  const h = await headers();
  const proto = h.get('x-forwarded-proto') ?? 'https';
  const url = `${proto}://${h.get('host')}/loja/${slug}`;
  const esgotado = produto.estoque === 0;

  return (
    <main>
      <section className={styles.section}>
        <ApresentacaoProduto produto={produto} fotos={fotos} Titulo="h1">
          <div className={styles.meta}>
            <span className={styles.peso}>{produto.peso_gramas} g</span>
            <span className={styles.preco}>
              {formatBRL(produto.preco_centavos)}
            </span>
          </div>

          <div className={styles.actions}>
            {esgotado && <span className={styles.esgotado}>Esgotado</span>}
            <BotaoComprar
              nome={produto.nome}
              url={url}
              rotulo={esgotado ? 'Consultar no WhatsApp' : 'Comprar'}
            />
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
