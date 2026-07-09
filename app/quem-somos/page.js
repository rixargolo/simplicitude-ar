import Image from 'next/image';
import styles from './quem-somos.module.css';

export const metadata = {
  title: 'Quem Somos — Simplicitude',
  description:
    'Da Floresta à Fábrica: a história da Simplicitude, chocolate artesanal do Sul da Bahia.',
};

export default function QuemSomosPage() {
  return (
    <main>
      <section className={styles.hero}>
        <Image
          src="/quem-somos/hero_agricultores.jpg"
          alt="Agricultores da Simplicitude no Sul da Bahia"
          fill
          sizes="100vw"
          className={styles.heroImg}
          priority
        />
        <div className={styles.heroDuotone} aria-hidden="true" />
        <div className={styles.heroGrain} aria-hidden="true" />
        <div className={styles.heroGradient} aria-hidden="true" />
        <div className={styles.heroCaption}>
          <h1 className={styles.heroTitle}>Quem Somos</h1>
          <span className={styles.heroUnderline} aria-hidden="true" />
        </div>
      </section>

      <section className={styles.section}>
        <div className={styles.grid}>
          <div className={styles.textCol}>
            <h2 className={styles.sectionTitle}>Quatro Gerações</h2>
            <p className={styles.body}>
              Somos uma família de produtores que há quatro gerações planta
              cacau em sistema Cabruca, um método de plantio sustentável em
              que se faz agricultura dentro da Mata Atlântica.
            </p>
            <p className={styles.body}>
              A Simplicitude nasceu do nosso desejo de fortalecer a cadeia
              produtiva do cacau-cabruca e aproveitar toda a riqueza da nossa
              biodiversidade na criação de produtos saudáveis, sustentáveis,
              atrativos e que geram impacto positivo.
            </p>
          </div>

          <Image
            src="/quem-somos/cabruca.jpg"
            alt="Plantio de cacau em sistema Cabruca, dentro da Mata Atlântica"
            width={622}
            height={350}
            sizes="(max-width: 640px) 100vw, 500px"
            className={styles.sectionImg}
          />
        </div>
      </section>

      <section className={styles.section}>
        <div className={`${styles.grid} ${styles.gridReverse}`}>
          <Image
            src="/quem-somos/ingredientes.jpg"
            alt="Chocolate Simplicitude com flores, frutas, nuts e especiarias"
            width={788}
            height={591}
            sizes="(max-width: 640px) 100vw, 500px"
            className={styles.sectionImg}
          />

          <div className={styles.textCol}>
            <h2 className={styles.sectionTitle}>Da Natureza, Para Você</h2>
            <p className={styles.emphasis}>
              Quando cuidamos da natureza, somos também cuidados por ela. Os
              chocolates da Simplicitude celebram essa conexão com produtos
              saudáveis, feitos com ingredientes 100% naturais.
            </p>
            <p className={styles.body}>
              Utilizamos matérias-primas cultivadas por agricultores
              familiares e misturamos flores, frutas, nuts, ervas e
              especiarias ao nosso maravilhoso chocolate vegano.
            </p>
            <p className={styles.playful}>
              Sim! Ainda tem esse detalhe hein?! Nossos chocolates são 100% à
              base de plantas. Sem lactose, sem glúten, sem conservantes, sem
              soja, sem transgênicos e sem medo de ser feliz!
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
