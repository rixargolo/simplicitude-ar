import Link from 'next/link';
import { getProdutosComEstoque } from '@/lib/admin/estoque';
import MovimentacaoForm from '../MovimentacaoForm';
import formStyles from '../MovimentacaoForm.module.css';

export const metadata = {
  title: 'Nova movimentação — Estoque — Admin — Simplicitude',
};

export default async function NovaMovimentacaoPage({ searchParams }) {
  const { produto } = await searchParams;
  const { produtos } = await getProdutosComEstoque();

  return (
    <div className={formStyles.page}>
      <Link href="/admin/estoque" className={formStyles.voltar}>
        ← Estoque
      </Link>
      <MovimentacaoForm produtos={produtos} produtoIdInicial={produto ?? ''} />
    </div>
  );
}
