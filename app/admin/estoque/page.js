import Link from 'next/link';
import { getProdutosComEstoque } from '@/lib/admin/estoque';
import styles from './estoque.module.css';

export const metadata = {
  title: 'Estoque — Admin — Simplicitude',
};

export default async function AdminEstoquePage() {
  const { produtos, colecoes } = await getProdutosComEstoque();

  const nomeColecao = new Map(colecoes.map((c) => [c.id, c.nome]));

  return (
    <div className={styles.wrap}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Estoque</h1>
        <div className={styles.headerActions}>
          <Link href="/admin/estoque/historico" className={styles.secundarioLink}>
            Ver histórico
          </Link>
          <Link href="/admin/estoque/nova" className={styles.novoLink}>
            Nova movimentação
          </Link>
        </div>
      </div>

      {produtos.length === 0 ? (
        <p className={styles.empty}>Nenhum produto cadastrado ainda.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Coleção</th>
                <th>Estoque atual</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((produto) => (
                <tr key={produto.id}>
                  <td className={styles.nome}>{produto.nome}</td>
                  <td>{nomeColecao.get(produto.colecao_id) ?? '—'}</td>
                  <td
                    className={`${styles.estoque} ${
                      produto.estoque === 0 ? styles.estoqueZerado : ''
                    }`}
                  >
                    {produto.estoque ?? '—'}
                  </td>
                  <td>
                    <div className={styles.acoes}>
                      <Link
                        href={`/admin/estoque/nova?produto=${produto.id}`}
                        className={styles.editarLink}
                      >
                        Registrar movimentação
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
