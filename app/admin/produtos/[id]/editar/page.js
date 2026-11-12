import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getProdutoById, getCategorias } from '@/lib/admin/produtos';
import { getColecoes } from '@/lib/admin/colecoes';
import { getTags } from '@/lib/admin/tags';
import ProdutoForm from '../../ProdutoForm';
import formStyles from '../../ProdutoForm.module.css';

export const metadata = {
  title: 'Editar produto — Admin — Simplicitude',
};

export default async function EditarProdutoPage({ params }) {
  const { id } = await params;

  const [produto, colecoes, categorias, tags] = await Promise.all([
    getProdutoById(id),
    getColecoes(),
    getCategorias(),
    getTags(),
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
        produto={produto}
        colecoes={colecoes}
        categorias={categorias}
        tags={tags}
      />
    </div>
  );
}
