import Link from 'next/link';
import { getProdutos, getCategoriasComProdutos, getColecoesPublicas, montarLoja } from '@/lib/produtos';
import CardProduto from '../components/CardProduto';
import CarrosselProdutos from '../components/CarrosselProdutos';
import styles from './loja.module.css';

export const metadata = {
  title: 'Loja — Simplicitude',
  description:
    'Chocolates artesanais Simplicitude — Da Floresta à Fábrica.',
};

const FRASE_PADRAO = 'Chocolate da floresta, feito à mão no Sul da Bahia.';
const SIZES_CARROSSEL = '(max-width: 900px) 70vw, 18rem';
const SIZES_GRADE = '(max-width: 640px) 50vw, (max-width: 1100px) 33vw, 18rem';

// X14: topo só de texto (sem foto nem cartão), filtro por categoria (?categoria=) e coleção (?colecao=) e, em "Todas", um carrossel
// por coleção de cada categoria. Tudo no servidor (links), funciona sem JS. Regras em montarLoja (lib/produtos.js).
export default async function LojaPage({ searchParams }) {
  const { categoria, colecao } = await searchParams;
  const [todos, categorias, colecoes] = await Promise.all([
    getProdutos(),
    getCategoriasComProdutos(),
    getColecoesPublicas(),
  ]);
  const { categoria: ativa, colecao: colecaoAtiva, colecoesDaCategoria, secoes, grade } = montarLoja(
    todos,
    categorias,
    colecoes,
    { categoria, colecao },
  );

  // h1 → (h2 da categoria, só em "Todas") → h3/h2 da lista → nome do produto
  const comTituloDeCategoria = !ativa;
  const Lista = comTituloDeCategoria ? 'h3' : 'h2';
  const NomeCard = comTituloDeCategoria ? 'h4' : 'h3';

  return (
    <main className={styles.pagina}>
      <header className={styles.topo}>
        <div>
          {colecaoAtiva && ativa && <span className={styles.rotulo}>{ativa.nome}</span>}
          <h1 className={styles.titulo}>{colecaoAtiva?.nome ?? ativa?.nome ?? 'Loja'}</h1>
        </div>
        <p className={styles.frase}>
          {(colecaoAtiva ? colecaoAtiva.descricao : ativa?.descricao) || FRASE_PADRAO}
        </p>
      </header>

      {categorias.length > 0 && (
        <nav aria-label="Categorias" className={styles.filtro}>
          <ul className={styles.chips}>
            <li>
              <Link
                href="/loja"
                className={styles.chip}
                aria-current={ativa || colecaoAtiva ? undefined : 'page'}
              >
                Todas
              </Link>
            </li>
            {categorias.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/loja?categoria=${c.slug}`}
                  className={styles.chip}
                  aria-current={ativa?.slug === c.slug ? (colecaoAtiva ? 'true' : 'page') : undefined}
                >
                  {c.nome}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {ativa && colecoesDaCategoria.length > 0 && (
        <nav aria-label={`Coleções de ${ativa.nome}`} className={styles.filtro}>
          <ul className={styles.chips}>
            <li>
              <Link
                href={`/loja?categoria=${ativa.slug}`}
                className={`${styles.chip} ${styles.chipLeve}`}
                aria-current={colecaoAtiva ? undefined : 'page'}
              >
                Tudo em {ativa.nome}
              </Link>
            </li>
            {colecoesDaCategoria.map((c) => (
              <li key={c.slug}>
                <Link
                  href={`/loja?colecao=${c.slug}`}
                  className={`${styles.chip} ${styles.chipLeve}`}
                  aria-current={colecaoAtiva?.slug === c.slug ? 'page' : undefined}
                >
                  {c.nome}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      )}

      {grade ? (
        grade.length === 0 ? (
          <p className={styles.vazio}>
            A floresta está preparando a próxima colheita. Volte em breve — ou{' '}
            <Link href="/quem-somos" className={styles.vazioLink}>
              conheça a nossa história
            </Link>
            .
          </p>
        ) : (
          <ul className={styles.grade}>
            {grade.map((produto) => (
              <li key={produto.id}>
                <CardProduto produto={produto} Titulo="h2" sizes={SIZES_GRADE} />
              </li>
            ))}
          </ul>
        )
      ) : (
        secoes.map((s) => {
          const nome = s.categoria?.nome ?? 'Outros';
          const varias = s.listas.length > 1;
          return (
            <section key={s.categoria?.slug ?? 'outros'} className={styles.secao}>
              {comTituloDeCategoria && (
                <header className={styles.secaoCab}>
                  <div>
                    <h2 className={styles.secaoTitulo}>{nome}</h2>
                    {s.categoria?.descricao && <p className={styles.secaoDesc}>{s.categoria.descricao}</p>}
                  </div>
                  {s.categoria && (
                    <Link href={`/loja?categoria=${s.categoria.slug}`} className={styles.verMais}>
                      Ver tudo
                    </Link>
                  )}
                </header>
              )}

              {s.listas.map((l) => {
                // "Mais {categoria}" só quando há coleção ao lado; a lista única da categoria não leva título
                const titulo = l.colecao ? l.colecao.nome : varias ? `Mais ${nome}` : null;
                return (
                  <div key={l.colecao?.id ?? 'resto'} className={styles.lista}>
                    {titulo && (
                      <div className={styles.listaCab}>
                        <Lista className={styles.listaTitulo}>{titulo}</Lista>
                        {l.colecao && (
                          <Link href={`/loja?colecao=${l.colecao.slug}`} className={styles.verMais}>
                            Ver coleção
                          </Link>
                        )}
                      </div>
                    )}
                    <CarrosselProdutos
                      produtos={l.produtos}
                      rotulo={titulo ?? nome}
                      Titulo={NomeCard}
                      sizes={SIZES_CARROSSEL}
                    />
                  </div>
                );
              })}
            </section>
          );
        })
      )}
    </main>
  );
}
