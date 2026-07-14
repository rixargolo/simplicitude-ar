import { notFound } from 'next/navigation';
import Link from 'next/link';
import {
  getProdutoById,
  getColecoes,
  getCategorias,
} from '@/lib/admin/produtos';
import ProdutoForm from '../../ProdutoForm';
import formStyles from '../../ProdutoForm.module.css';

export const metadata = {
  title: 'Editar produto — Admin — Simplicitude',
};

export default async function EditarProdutoPage({ params }) {
  const { id } = await params;

  const [produto, colecoes, categorias] = await Promise.all([
    getProdutoById(id),
    getColecoes(),
    getCategorias(),
  ]);

  if (!produto) {
    notFound();
  }

  return (
    <div className={formStyles.page}>
      <Link href="/admin/produtos" className={formStyles.voltar}>
        ← Produtos
      </Link>
      <ProdutoForm
        mode="edit"
        produto={produto}
        colecoes={colecoes}
        categorias={categorias}
      />
    </div>
  );
}
