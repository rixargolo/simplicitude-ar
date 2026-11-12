import Form from 'next/form';
import Link from 'next/link';
import { getProdutosBusca } from '@/lib/produtos';
import { buscarProdutos, normalizarTermo, TERMO_MAX, TERMO_MIN } from '@/lib/busca';
import { SIZES_CARD_GRADE } from '@/lib/fotos';
import CardProduto from '../components/CardProduto';
import styles from './busca.module.css';


// Resultados de busca não entram no Google, nem depois do go-live (quando o X-Robots-Tag global sair).
export async function generateMetadata({ searchParams }) {
  const { q } = await searchParams;
  const termo = normalizarTermo(q);
  return {
    title: termo ? `Busca: ${termo} — Simplicitude` : 'Busca — Simplicitude',
    robots: { index: false, follow: true },
  };
}

// X16: dinâmica (lê searchParams). Termo curto não consulta o banco; o termo nunca vira filtro de consulta (lib/busca.js).
export default async function BuscaPage({ searchParams }) {
  const { q } = await searchParams;
  const termo = normalizarTermo(q);
  const { total, produtos } = termo ? buscarProdutos(await getProdutosBusca(), termo) : { total: 0, produtos: [] };

  return (
    <main className={styles.pagina}>
      <h1 className={styles.titulo}>Busca</h1>

      <Form action="/busca" role="search" prefetch={false} className={styles.form}>
        <label htmlFor="busca-q" className={styles.soLeitor}>
          Buscar produtos
        </label>
        <input
          id="busca-q"
          type="search"
          name="q"
          defaultValue={termo}
          required
          minLength={TERMO_MIN}
          maxLength={TERMO_MAX}
          placeholder="Buscar produtos"
          autoComplete="off"
          className={styles.campo}
        />
        <button type="submit" className={styles.botao}>
          Buscar
        </button>
      </Form>

      {/* role=status: o leitor de tela anuncia o resultado quando a página muda */}
      <p role="status" className={styles.status}>
        {!termo
          ? `Digite pelo menos ${TERMO_MIN} letras para buscar.`
          : total === 0
            ? `Nada encontrado para “${termo}”.`
            : `${total} ${total === 1 ? 'produto' : 'produtos'} para “${termo}”${
                total > produtos.length ? `. Mostrando ${produtos.length}; refine a busca.` : ''
              }`}
      </p>

      {termo && total === 0 && (
        <p className={styles.vazio}>
          <Link href="/loja" className={styles.vazioLink}>
            Ver todos os produtos na loja
          </Link>
        </p>
      )}

      {produtos.length > 0 && (
        <ul className={styles.grade}>
          {produtos.map((produto) => (
            <li key={produto.id}>
              <CardProduto produto={produto} Titulo="h2" sizes={SIZES_CARD_GRADE} />
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
