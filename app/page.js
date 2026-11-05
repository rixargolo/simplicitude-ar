import Link from 'next/link';
import Image from 'next/image';
import { getProdutosRecentes } from '@/lib/produtos';
import { slidesVisiveis } from '@/lib/carrossel';
import HeroCarrossel from './components/HeroCarrossel';
import VitrineProdutos from './components/VitrineProdutos';
import styles from './home.module.css';

export const metadata = {
  title: 'Simplicitude — Da Floresta à Fábrica',
  description:
    'Chocolate artesanal e alimentos plant-based com ingredientes agroflorestais do Sul da Bahia.',
};

// Slides do hero. `imagem` é opcional ({ src, alt }): sem ela o slide mostra um
// placeholder no preview e é omitido em produção (ver slidesVisiveis). Fotos 16:9,
// 2400×1350, pendentes com a dona; texto provisório.
const SLIDES = [
  {
    id: 'loja',
    rotulo: 'Loja',
    titulo: 'Chocolate da floresta',
    texto:
      'Plant-based e feito com ingredientes agroflorestais, nutre corpo e alma — e ajuda a regenerar a Mata Atlântica.',
    cta: { rotulo: 'Ver a loja', href: '/loja' },
  },
  {
    id: 'bem-estar',
    rotulo: 'Bem-estar',
    titulo: 'Chocolate para meditar',
    texto:
      'A Coleção Inspirar une ervas e especiarias a meditações guiadas em áudio, narradas por Bruna Santos.',
    cta: { rotulo: 'Conhecer a meditação', href: '/meditacao' },
  },
];

export default async function HomePage() {
  const produtos = await getProdutosRecentes();
  const slides = slidesVisiveis(SLIDES);

  return (
    <main>
      {slides.length > 0 && <HeroCarrossel slides={slides} />}

      <VitrineProdutos produtos={produtos} />

      <section className={styles.teaser}>
        <h2 className={styles.sectionTitle}>Meditação</h2>
        <p className={styles.teaserText}>
          A Simplicitude traz uma linha especial de chocolates para
          meditação. A Coleção Inspirar apresenta chocolates com ervas e
          especiarias que promovem bem estar. Cada blend tem a intenção de
          despertar uma emoção, através das propriedades de seus
          ingredientes. São três sabores que, associados à práticas de
          meditação e atenção plena, inspiram bons sentimentos e uma
          deliciosa sensação de Simplicitude.
        </p>
        <Link href="/meditacao" className={styles.cta}>
          Acesse a meditação guiada
        </Link>
      </section>

      <section className={styles.duotoneTeaser}>
        <Image
          src="/quem-somos/cabruca.jpg"
          alt="Plantio de cacau em sistema Cabruca, dentro da Mata Atlântica"
          fill
          sizes="100vw"
          className={styles.duotoneImg}
        />
        <div className={styles.duotoneOverlay} aria-hidden="true" />
        <div className={styles.duotoneStripes} aria-hidden="true" />
        <div className={styles.duotoneContent}>
          <p className={styles.pullQuote}>
            Da floresta à fábrica — cacau de agrofloresta, cultivado por
            quatro gerações.
          </p>
          <Link href="/quem-somos" className={styles.duotoneCta}>
            Conheça nossa história
          </Link>
        </div>
      </section>
    </main>
  );
}
