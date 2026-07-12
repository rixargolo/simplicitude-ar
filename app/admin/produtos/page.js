import Link from 'next/link';
import Image from 'next/image';
import { getAllProdutos, getColecoes } from '@/lib/admin/produtos';
import ToggleAtivo from './ToggleAtivo';
import styles from './produtos.module.css';

export const metadata = {
  title: 'Produtos — Admin — Simplicitude',
};

const formatBRL = (centavos) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(centavos / 100);

export default async function AdminProdutosPage() {
  const [produtos, colecoes] = await Promise.all([
    getAllProdutos(),
    getColecoes(),
  ]);

  const nomeColecao = new Map(colecoes.map((c) => [c.id, c.nome]));

  return (
    <div className={styles.wrap}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Produtos</h1>
        <Link href="/admin/produtos/novo" className={styles.novoLink}>
          Novo produto
        </Link>
      </div>

      {produtos.length === 0 ? (
        <p className={styles.empty}>Nenhum produto cadastrado ainda.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Imagem</th>
                <th>Nome</th>
                <th>Coleção</th>
                <th>Preço</th>
                <th>Estoque</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {produtos.map((produto) => (
                <tr key={produto.id}>
                  <td>
                    {produto.imagem_url ? (
                      <div className={styles.imgWrap}>
                        <Image
                          src={produto.imagem_url}
                          alt={produto.nome}
                          fill
                          sizes="48px"
                          className={styles.img}
                        />
                      </div>
                    ) : (
                      <div className={styles.imgPlaceholder} aria-hidden="true">
                        {produto.nome.charAt(0)}
                      </div>
                    )}
                  </td>
                  <td className={styles.nome}>{produto.nome}</td>
                  <td>{nomeColecao.get(produto.colecao_id) ?? '—'}</td>
                  <td className={styles.preco}>
                    {formatBRL(produto.preco_centavos)}
                  </td>
                  <td>{produto.estoque ?? '—'}</td>
                  <td>
                    <ToggleAtivo id={produto.id} ativo={produto.ativo} />
                  </td>
                  <td>
                    <div className={styles.acoes}>
                      <Link
                        href={`/admin/produtos/${produto.id}/editar`}
                        className={styles.editarLink}
                      >
                        Editar
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
