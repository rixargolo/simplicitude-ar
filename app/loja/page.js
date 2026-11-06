import Link from 'next/link';
import { getProdutos, getCategoriasComProdutos, filtrarPorCategoria } from '@/lib/produtos';
import CardProduto from '../components/CardProduto';
import styles from './loja.module.css';

export const metadata = {
  title: 'Loja — Simplicitude',
  description:
    'Chocolates artesanais Simplicitude — Da Floresta à Fábrica.',
};

const FRASE_PADRAO = 'Chocolate da floresta, feito à mão no Sul da Bahia.';

export default async function LojaPage({ searchParams }) {
  const { categoria } = await searchParams;
  const [todos, categorias] = await Promise.all([getProdutos(), getCategoriasComProdutos()]);
  // slug desconhecido cai em "Todas" (ver filtrarPorCategoria)
  const { ativa, produtos } = filtrarPorCategoria(todos, categorias, categoria);

  return (
    <main className={styles.section}>
      <header className={styles.cabecalho}>
        <h1 className={styles.titulo}>{ativa ? ativa.nome : 'Loja'}</h1>
        <p className={styles.frase}>{ativa?.descricao || FRASE_PADRAO}</p>
      </header>

      {categorias.length > 0 && (
        <nav aria-label="Categorias" className={styles.filtro}>
          <ul className={styles.chips}>
            <li>
              <Link
                href="/loja"
                className={styles.chip}
                aria-current={ativa ? undefined : 'page'}
              >
                Todas
              </Link>
            </li>
            {categorias.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/loja?categoria=${c.slug}`}
                  className={styles.chip}
                  aria-current={ativa?.slug === c.slug ? 'page' : undefined}
                >
                  {c.nome}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {produtos.length === 0 ? (
        <p className={styles.vazio}>
          A floresta está preparando a próxima colheita. Volte em breve — ou{' '}
          <Link href="/quem-somos" className={styles.vazioLink}>
            conheça a nossa história
          </Link>
          .
        </p>
      ) : (
        <ul className={styles.grade}>
          {produtos.map((produto) => (
            <li key={produto.id}>
              <CardProduto
                produto={produto}
                Titulo="h2"
                sizes="(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 18rem"
              />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
