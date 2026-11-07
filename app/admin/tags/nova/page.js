import Link from 'next/link';
import TagForm from '../TagForm';
import formStyles from '../../categorias/CategoriaForm.module.css';

export const metadata = {
  title: 'Nova tag — Admin — Simplicitude',
};

export default function NovaTagPage() {
  return (
    <div className={formStyles.page}>
      <Link href="/admin/tags" className={formStyles.voltar}>
        ← Tags
      </Link>
      <TagForm mode="create" />
    </div>
  );
}
