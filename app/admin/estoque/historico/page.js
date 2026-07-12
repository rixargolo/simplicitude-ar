import Link from 'next/link';
import { getMovimentacoes } from '@/lib/admin/estoque';
import styles from '../estoque.module.css';

export const metadata = {
  title: 'Histórico de estoque — Admin — Simplicitude',
};

const TIPO_LABEL = {
  reposicao: 'Reposição',
  ajuste: 'Ajuste',
  venda: 'Venda',
  cancelamento: 'Cancelamento',
};

const TIPO_CLASS = {
  reposicao: 'tipoReposicao',
  ajuste: 'tipoAjuste',
  venda: 'tipoVenda',
  cancelamento: 'tipoCancelamento',
};

const formatData = (iso) =>
  new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(iso));

export default async function HistoricoEstoquePage() {
  const movimentacoes = await getMovimentacoes();

  return (
    <div className={styles.wrap}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Histórico de estoque</h1>
        <div className={styles.headerActions}>
          <Link href="/admin/estoque" className={styles.secundarioLink}>
            Voltar
          </Link>
          <Link href="/admin/estoque/nova" className={styles.novoLink}>
            Nova movimentação
          </Link>
        </div>
      </div>

      {movimentacoes.length === 0 ? (
        <p className={styles.empty}>Nenhuma movimentação registrada ainda.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Data</th>
                <th>Produto</th>
                <th>Tipo</th>
                <th>Quantidade</th>
                <th>Estoque resultante</th>
                <th>Observação</th>
              </tr>
            </thead>
            <tbody>
              {movimentacoes.map((mov) => (
                <tr key={mov.id}>
                  <td>{formatData(mov.created_at)}</td>
                  <td className={styles.nome}>{mov.produtos?.nome ?? '—'}</td>
                  <td>
                    <span
                      className={`${styles.tipoPill} ${
                        styles[TIPO_CLASS[mov.tipo]] ?? ''
                      }`}
                    >
                      {TIPO_LABEL[mov.tipo] ?? mov.tipo}
                    </span>
                  </td>
                  <td
                    className={
                      mov.quantidade < 0
                        ? styles.quantidadeNegativa
                        : styles.quantidadePositiva
                    }
                  >
                    {mov.quantidade > 0 ? `+${mov.quantidade}` : mov.quantidade}
                  </td>
                  <td>{mov.estoque_resultante ?? '—'}</td>
                  <td>{mov.observacao ?? '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
