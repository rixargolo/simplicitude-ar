import Link from 'next/link';
import CategoriaForm from '../CategoriaForm';
import formStyles from '../CategoriaForm.module.css';

export const metadata = {
  title: 'Nova categoria — Admin — Simplicitude',
};

export default function NovaCategoriaPage() {
  return (
    <div className={formStyles.page}>
      <Link href="/admin/categorias" className={formStyles.voltar}>
        ← Categorias
      </Link>
      <CategoriaForm mode="create" />
    </div>
  );
}
