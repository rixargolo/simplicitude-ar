import Link from 'next/link';
import styles from './admin.module.css';

export default function AdminPage() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Área Administrativa</h1>
      <p className={styles.welcome}>
        Bem-vindo(a)! Use o menu ao lado para gerenciar produtos, categorias
        e estoque. A gestão de pedidos será implementada em etapas futuras.
      </p>
      <div className={styles.atalhos}>
        <Link href="/admin/produtos/novo" className={styles.atalho}>
          + Novo produto
        </Link>
        <Link href="/admin/categorias/nova" className={styles.atalho}>
          + Nova categoria
        </Link>
        <Link href="/admin/estoque/nova" className={styles.atalho}>
          + Registrar movimentação
        </Link>
      </div>
    </main>
  );
}
