import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getColecaoById } from '@/lib/admin/colecoes';
import { getCategorias } from '@/lib/admin/produtos';
import ColecaoForm from '../../ColecaoForm';
import formStyles from '../../../categorias/CategoriaForm.module.css';

export const metadata = {
  title: 'Editar coleção — Admin — Simplicitude',
};

export default async function EditarColecaoPage({ params }) {
  const { id } = await params;

  const [colecao, categorias] = await Promise.all([getColecaoById(id), getCategorias()]);

  if (!colecao) {
    notFound();
  }

  return (
    <div className={formStyles.page}>
      <Link href="/admin/colecoes" className={formStyles.voltar}>
        ← Coleções
      </Link>
      <ColecaoForm mode="edit" colecao={colecao} categorias={categorias} />
    </div>
  );
}
