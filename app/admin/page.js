import Link from 'next/link';
import styles from './admin.module.css';

export default function AdminPage() {
  return (
    <main className={styles.main}>
      <h1 className={styles.title}>Área Administrativa</h1>
      <p className={styles.welcome}>
        Bem-vindo(a)! A gestão de pedidos será implementada em etapas
        futuras.
      </p>
      <Link href="/admin/produtos" className={styles.link}>
        Gerenciar produtos
      </Link>
      <Link href="/admin/categorias" className={styles.link}>
        Gerenciar categorias
      </Link>
      <Link href="/admin/estoque" className={styles.link}>
        Gerenciar estoque
      </Link>
    </main>
  );
}
