import Link from 'next/link';
import { getColecoes } from '@/lib/admin/colecoes';
import { getCategorias } from '@/lib/admin/produtos';
import OrdemColecoes from './OrdemColecoes';
import styles from '../novidades/novidades.module.css';

export const metadata = {
  title: 'Coleções — Admin — Simplicitude',
};

export default async function AdminColecoesPage() {
  const [colecoes, categorias] = await Promise.all([getColecoes(), getCategorias()]);

  return (
    <div className={styles.wrap}>
      <div className={styles.topo}>
        <h1 className={styles.title}>Coleções</h1>
        <Link href="/admin/colecoes/nova" className={`${styles.botao} ${styles.link}`}>
          Nova coleção
        </Link>
      </div>
      <p className={styles.ajuda}>Cada coleção pertence a uma categoria. A ordem vale dentro da categoria.</p>
      {colecoes.length === 0 ? (
        <p className={styles.ajuda}>Nenhuma coleção cadastrada ainda.</p>
      ) : (
        <OrdemColecoes colecoes={colecoes} categorias={categorias} />
      )}
    </div>
  );
}
