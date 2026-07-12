import { getColecoes, getCategorias } from '@/lib/admin/produtos';
import ProdutoForm from '../ProdutoForm';
import formStyles from '../ProdutoForm.module.css';

export const metadata = {
  title: 'Novo produto — Admin — Simplicitude',
};

export default async function NovoProdutoPage() {
  const [colecoes, categorias] = await Promise.all([
    getColecoes(),
    getCategorias(),
  ]);

  return (
    <div className={formStyles.page}>
      <ProdutoForm mode="create" colecoes={colecoes} categorias={categorias} />
    </div>
  );
}
