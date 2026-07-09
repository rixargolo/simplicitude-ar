import Link from 'next/link';
import Image from 'next/image';
import styles from './home.module.css';

export const metadata = {
  title: 'Simplicitude — Da Floresta à Fábrica',
  description:
    'Chocolate artesanal e alimentos plant-based com ingredientes agroflorestais do Sul da Bahia.',
};

// Gerador pseudo-aleatório com seed fixa: garante o mesmo resultado no
// render do servidor e na hidratação do cliente (Math.random() causaria
// hydration mismatch aqui).
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const PARTICLE_COUNT = 100;
const rand = mulberry32(1337);

const PARTICLES = Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
  left: rand() * 100,
  top: rand() * 100,
  size: 2 + rand() * 1.5,
  color: i % 2 === 0 ? 'var(--gold)' : 'var(--cream)',
  duration: 15 + rand() * 15,
  delay: rand() * -30,
}));

export default function HomePage() {
  return (
    <main>
      <section className={styles.hero}>
        <div className={styles.particles} aria-hidden="true">
          {PARTICLES.map((p, i) => (
            <span
              key={i}
              className={styles.particle}
              style={{
                left: `${p.left}%`,
                top: `${p.top}%`,
                width: `${p.size}px`,
                height: `${p.size}px`,
                background: p.color,
                animationDuration: `${p.duration}s`,
                animationDelay: `${p.delay}s`,
              }}
            />
          ))}
        </div>
        <div className={styles.vignette} aria-hidden="true" />

        <div className={styles.heroInner}>
          <div className={styles.heroImageWrap}>
            <div className={styles.heroGlow} aria-hidden="true" />
            <Image
              src="/home/composicao_chocolate.png"
              alt="Composição de chocolate Simplicitude sobre folha e prato"
              width={662}
              height={984}
              sizes="(max-width: 900px) 70vw, 45vw"
              className={styles.heroImage}
              priority
            />
            <div className={styles.heroImageOverlay} aria-hidden="true" />
          </div>

          <div className={styles.heroContent}>
            <Image
              src="/marca/s_estilizado.png"
              alt="Simplicitude"
              width={110}
              height={93}
              className={styles.heroSeal}
              priority
            />
            <h1 className={styles.heroTitle}>We Are Forest to Factory</h1>
            <p className={styles.heroText}>
              Somos um negócio de impacto positivo, com origem no Sul da
              Bahia, Terra do Cacau.
            </p>
            <p className={styles.heroText}>
              Fabricamos <strong>chocolates e alimentos plant-based</strong>{' '}
              com ingredientes agroflorestais, que ajudam a manter a floresta
              em pé e geram renda para produtores locais.
            </p>
          </div>
        </div>
      </section>

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
        <div className={styles.duotoneContent}>
          <p className={styles.pullQuote}>
            Da floresta à fábrica — cacau de agrofloresta, cultivado por
            quatro gerações.
          </p>
          <Link href="/quem-somos" className={styles.quietLink}>
            Conheça nossa história
          </Link>
        </div>
      </section>

      {/* Vitrine de produtos: será conectada ao Supabase em etapa futura */}
    </main>
  );
}
