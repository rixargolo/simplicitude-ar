import Link from 'next/link';
import { getProdutos, getCategoriasComProdutos, getColecoesPublicas, montarLoja } from '@/lib/produtos';
import CardProduto from '../components/CardProduto';
import CarrosselProdutos from '../components/CarrosselProdutos';
import BarraDeslizante from './BarraDeslizante';
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

  // h1 "Loja" (fixo) → h2 da categoria → h3 da coleção → h4 nome do produto. Só o "Todas" com uma lista só
  // (grade sem título de categoria) tem o nome do produto direto em h2.
  const nomeGrade = !ativa ? 'h2' : colecaoAtiva ? 'h4' : 'h3';

  return (
    <main className={styles.pagina}>
      {/* hero fixo: não muda com categoria nem coleção (vai evoluir depois); descrição da categoria fica de fora por enquanto */}
      <header className={styles.topo}>
        <h1 className={styles.titulo}>Loja</h1>
        <p className={styles.frase}>{FRASE_PADRAO}</p>
      </header>

      {categorias.length > 0 && (
        <nav aria-label="Categorias" className={`${styles.filtro} ${styles.barra}`}>
          <BarraDeslizante>
            <li>
              <Link
                href="/loja"
                className={styles.chip}
                aria-current={ativa || colecaoAtiva ? undefined : 'page'}
              >
                Tudo
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
          </BarraDeslizante>
        </nav>
      )}

      {/* espaço da subcategoria sempre reservado: o título abaixo fica à mesma distância do menu com ou sem coleções */}
      <div className={styles.subSlot}>
        {ativa && colecoesDaCategoria.length > 0 && (
          <nav aria-label={`Coleções de ${ativa.nome}`} className={`${styles.filtro} ${styles.barra} ${styles.sub}`}>
            <BarraDeslizante>
              <li>
                <Link
                  href={`/loja?categoria=${ativa.slug}`}
                  className={styles.chip}
                  aria-current={colecaoAtiva ? undefined : 'page'}
                >
                  Tudo em {ativa.nome}
                </Link>
              </li>
              {colecoesDaCategoria.map((c) => (
                <li key={c.slug}>
                  <Link
                    href={`/loja?colecao=${c.slug}`}
                    className={styles.chip}
                    aria-current={colecaoAtiva?.slug === c.slug ? 'page' : undefined}
                  >
                    {c.nome}
                  </Link>
                </li>
              ))}
            </BarraDeslizante>
          </nav>
        )}
      </div>

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
          <section className={styles.secao}>
            {ativa && (
              <header className={styles.secaoCab}>
                <h2 className={styles.secaoTitulo}>{ativa.nome}</h2>
              </header>
            )}
            {colecaoAtiva && (
              <div className={styles.tituloSolto}>
                <h3 className={styles.listaTitulo}>{colecaoAtiva.nome}</h3>
              </div>
            )}
            <ul className={styles.grade}>
              {grade.map((produto) => (
                <li key={produto.id}>
                  <CardProduto produto={produto} Titulo={nomeGrade} sizes={SIZES_GRADE} />
                </li>
              ))}
            </ul>
          </section>
        )
      ) : (
        secoes.map((s) => {
          const nome = s.categoria?.nome ?? 'Outros';
          const varias = s.listas.length > 1;
          return (
            <section key={s.categoria?.slug ?? 'outros'} className={styles.secao}>
              <header className={styles.secaoCab}>
                <h2 className={styles.secaoTitulo}>{nome}</h2>
              </header>

              {s.listas.map((l) => {
                // "Mais {categoria}" só quando há coleção ao lado; a lista única da categoria não leva título
                const titulo = l.colecao ? l.colecao.nome : varias ? `Mais ${nome}` : null;
                return (
                  <div key={l.colecao?.id ?? 'resto'} className={styles.lista}>
                    <CarrosselProdutos
                      cabecalho={titulo && <h3 className={styles.listaTitulo}>{titulo}</h3>}
                      produtos={l.produtos}
                      rotulo={titulo ?? nome}
                      Titulo="h4"
                      sizes={SIZES_CARROSSEL}
                    />
                  </div>
                );
              })}

              {!ativa && s.categoria && (
                <div className={styles.secaoRodape}>
                  <Link href={`/loja?categoria=${s.categoria.slug}`} className={styles.verMais}>
                    Ver tudo
                  </Link>
                </div>
              )}
            </section>
          );
        })
      )}
    </main>
  );
}
