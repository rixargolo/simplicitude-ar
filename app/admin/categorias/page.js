import Link from 'next/link';
import { getAllCategorias } from '@/lib/admin/categorias';
import styles from './categorias.module.css';

export const metadata = {
  title: 'Categorias — Admin — Simplicitude',
};

export default async function AdminCategoriasPage() {
  const categorias = await getAllCategorias();

  return (
    <div className={styles.wrap}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Categorias</h1>
        <Link href="/admin/categorias/nova" className={styles.novoLink}>
          Nova categoria
        </Link>
      </div>

      {categorias.length === 0 ? (
        <p className={styles.empty}>Nenhuma categoria cadastrada ainda.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Slug</th>
                <th>Descrição</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {categorias.map((categoria) => (
                <tr key={categoria.id}>
                  <td className={styles.nome}>{categoria.nome}</td>
                  <td>{categoria.slug}</td>
                  <td>{categoria.descricao || '—'}</td>
                  <td>
                    <div className={styles.acoes}>
                      <Link
                        href={`/admin/categorias/${categoria.id}/editar`}
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
