import Link from 'next/link';
import { getTags } from '@/lib/admin/tags';
import styles from '../categorias/categorias.module.css';

export const metadata = {
  title: 'Tags — Admin — Simplicitude',
};

export default async function AdminTagsPage() {
  const tags = await getTags();

  return (
    <div className={styles.wrap}>
      <div className={styles.headerRow}>
        <h1 className={styles.title}>Tags</h1>
        <Link href="/admin/tags/nova" className={styles.novoLink}>
          Nova tag
        </Link>
      </div>

      {tags.length === 0 ? (
        <p className={styles.empty}>Nenhuma tag cadastrada ainda.</p>
      ) : (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Slug</th>
                <th>EN</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {tags.map((tag) => (
                <tr key={tag.id}>
                  <td className={styles.nome}>{tag.nome}</td>
                  <td>{tag.slug}</td>
                  <td>{tag.tag_traducoes.length > 0 ? 'EN ✓' : '—'}</td>
                  <td>
                    <div className={styles.acoes}>
                      <Link href={`/admin/tags/${tag.id}/editar`} className={styles.editarLink}>
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
