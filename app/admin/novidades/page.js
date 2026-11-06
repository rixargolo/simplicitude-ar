import { getAllProdutos } from '@/lib/admin/produtos';
import CuradoriaNovidades from './CuradoriaNovidades';
import styles from './novidades.module.css';

export const metadata = {
  title: 'Novidades — Admin — Simplicitude',
};

export default async function AdminNovidadesPage() {
  const produtos = await getAllProdutos();

  return (
    <div className={styles.wrap}>
      <h1 className={styles.title}>Novidades</h1>
      <CuradoriaNovidades produtos={produtos} />
    </div>
  );
}
