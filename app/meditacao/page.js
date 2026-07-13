import Image from 'next/image';
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
      <section className={styles.hero}>
        <Image
          src="/meditacao/hero.png"
          alt="Três chocolates da Coleção Inspirar dispostos sobre uma tábua de madeira"
          fill
          sizes="100vw"
          className={styles.heroImg}
          priority
        />
        <div className={styles.heroDuotone} aria-hidden="true" />
        <div className={styles.heroStripes} aria-hidden="true" />
        <div className={styles.heroGradient} aria-hidden="true" />
        <div className={styles.heroCaption}>
          <h1 className={styles.heroTitle}>Degustação Meditativa</h1>
          <span className={styles.heroUnderline} aria-hidden="true" />
        </div>
      </section>

      <section className={styles.intro}>
        <p className={styles.introLead}>
          Viva uma experiência única com chocolates que te conduzem numa
          jornada sensorial e emocional.
        </p>
        <p className={styles.introBody}>
          A Coleção Inspirar é uma linha exclusiva da Simplicitude, criada
          para harmonizar os benefícios nutricionais e sensoriais dos
          chocolates com práticas de meditação e atenção plena. Cada
          chocolate desta coleção é feito com ervas e especiarias
          especialmente selecionadas para inspirar diferentes sentimentos.
        </p>
        <p className={styles.introBody}>
          Além de deliciar o paladar, estes chocolates conectam corpo e
          mente de forma holística, através de meditações guiadas pela voz
          serena de Bruna Santos.
        </p>
      </section>

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
