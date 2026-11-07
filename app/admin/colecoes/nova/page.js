import Link from 'next/link';
import { getCategorias } from '@/lib/admin/produtos';
import ColecaoForm from '../ColecaoForm';
import formStyles from '../../categorias/CategoriaForm.module.css';

export const metadata = {
  title: 'Nova coleção — Admin — Simplicitude',
};

export default async function NovaColecaoPage() {
  const categorias = await getCategorias();

  return (
    <div className={formStyles.page}>
      <Link href="/admin/colecoes" className={formStyles.voltar}>
        ← Coleções
      </Link>
      <ColecaoForm mode="create" categorias={categorias} />
    </div>
  );
}
