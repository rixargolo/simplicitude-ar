import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getTagById } from '@/lib/admin/tags';
import TagForm from '../../TagForm';
import formStyles from '../../../categorias/CategoriaForm.module.css';

export const metadata = {
  title: 'Editar tag — Admin — Simplicitude',
};

export default async function EditarTagPage({ params }) {
  const { id } = await params;

  const tag = await getTagById(id);

  if (!tag) {
    notFound();
  }

  return (
    <div className={formStyles.page}>
      <Link href="/admin/tags" className={formStyles.voltar}>
        ← Tags
      </Link>
      <TagForm mode="edit" tag={tag} />
    </div>
  );
}
