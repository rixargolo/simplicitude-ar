import { getProdutos } from '@/lib/produtos';
import ApresentacaoProduto from '../components/ApresentacaoProduto';
import MeditacaoPlayer from '../components/MeditacaoPlayer';
import styles from './meditacao.module.css';

export const metadata = {
  title: 'Meditação — Simplicitude',
  description:
    'Coleção Inspirar — chocolates com meditações guiadas na voz de Bruna Santos.',
};

export default async function MeditacaoPage() {
  const produtos = await getProdutos();
  const produtosComMeditacao = produtos.filter(
    (produto) => produto.tem_meditacao,
  );

  return (
    <main>
      <h1 className={styles.sectionTitleHero}>Degustação Meditativa</h1>
      <h2 className={styles.sectionTitle}>Chocolates para Meditação</h2>

      {produtosComMeditacao.length === 0 ? (
        <p className={styles.empty}>
          Nenhum chocolate com meditação guiada disponível no momento.
        </p>
      ) : (
        produtosComMeditacao.map((produto) => (
          <ApresentacaoProduto key={produto.id} produto={produto}>
            <MeditacaoPlayer audioUrl={produto.audio_url} />
          </ApresentacaoProduto>
        ))
      )}
    </main>
  );
}
