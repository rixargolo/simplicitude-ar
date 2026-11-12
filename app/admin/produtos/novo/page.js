import Link from 'next/link';
import { getCategorias } from '@/lib/admin/produtos';
import { getColecoes } from '@/lib/admin/colecoes';
import { getTags } from '@/lib/admin/tags';
import ProdutoForm from '../ProdutoForm';
import formStyles from '../ProdutoForm.module.css';

export const metadata = {
  title: 'Novo produto — Admin — Simplicitude',
};

export default async function NovoProdutoPage() {
  const [colecoes, categorias, tags] = await Promise.all([
    getColecoes(),
    getCategorias(),
    getTags(),
  ]);

  return (
    <div className={formStyles.page}>
      <Link href="/admin/produtos" className={formStyles.voltar}>
        ← Produtos
      </Link>
      <ProdutoForm colecoes={colecoes} categorias={categorias} tags={tags} />
    </div>
  );
}
