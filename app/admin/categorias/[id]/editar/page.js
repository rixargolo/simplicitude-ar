import { notFound } from 'next/navigation';
import { getCategoriaById } from '@/lib/admin/categorias';
import CategoriaForm from '../../CategoriaForm';
import formStyles from '../../CategoriaForm.module.css';

export const metadata = {
  title: 'Editar categoria — Admin — Simplicitude',
};

export default async function EditarCategoriaPage({ params }) {
  const { id } = await params;

  const categoria = await getCategoriaById(id);

  if (!categoria) {
    notFound();
  }

  return (
    <div className={formStyles.page}>
      <CategoriaForm mode="edit" categoria={categoria} />
    </div>
  );
}
