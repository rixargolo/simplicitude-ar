import Link from 'next/link';
import Image from 'next/image';
import { getVitrine, getCategoriasComProdutos, COLECAO_MEDITACAO } from '@/lib/produtos';
import { slidesVisiveis } from '@/lib/carrossel';
import HeroCarrossel from './components/HeroCarrossel';
import VitrineProdutos from './components/VitrineProdutos';
import GradeCategorias from './components/GradeCategorias';
import styles from './home.module.css';

export const metadata = {
  title: 'Simplicitude — Da Floresta à Fábrica',
  description:
    'Chocolate artesanal e alimentos plant-based com ingredientes agroflorestais do Sul da Bahia.',
};

// Slides do hero. `imagem` é opcional ({ src, alt, posicao? }; `posicao` = object-position): sem ela o slide mostra um
// placeholder no preview e é omitido em produção (ver slidesVisiveis). Fotos 16:9 em WebP (receita no CLAUDE.md).
// Textos, botões e links da dona, literais (ajuste pós-X18, 2026-11-08). Foto do slide 1 PROVISÓRIA: a final
// virá depois (é 2,27:1 e traz texto na coluna direita, que o `posicao` esconde no desktop). A do slide 4 também traz texto (embaixo à direita).
const SLIDES = [
  {
    id: 'presentes',
    rotulo: 'Presentes',
    titulo: 'Chocolate para Presentear',
    texto: 'Presentes que contam histórias e conectam pessoas. Para você e para sua empresa.',
    cta: { rotulo: 'Escolha um presente →', href: '/loja?categoria=presentes' },
    imagem: {
      src: '/home/hero-presentear.webp',
      // foto mais larga que 16:9 com texto e ícones à direita: ancora à esquerda para o corte cair sobre eles
      posicao: '0% 50%',
      alt: 'Livreto kraft com a mensagem "A vida é mais bonita com amor e um chocolate", envelopes dos chocolates Alegria, Esperança e Serenidade e um cartão de Natal, ao lado de uma xícara de café',
    },
  },
  {
    id: 'floresta',
    rotulo: 'Floresta',
    titulo: 'Chocolate da Floresta',
    texto: 'Cada barra protege a Mata Atlântica e aumenta a renda de agricultores familiares.',
    cta: { rotulo: 'Impacto Positivo →', href: '/sustentabilidade' },
    imagem: {
      src: '/home/hero-floresta.webp',
      alt: 'Casal sorrindo, sentado entre as raízes de uma grande árvore na Mata Atlântica, cercado de folhagens',
    },
  },
  {
    id: 'meditacao',
    rotulo: 'Meditação',
    titulo: 'Chocolate para Meditar',
    texto: 'A Coleção Inspirar é um doce convite para você pausar, respirar e cuidar de Si.',
    cta: { rotulo: 'Conheça a Coleção →', href: '/meditacao' },
    imagem: {
      src: '/home/hero-meditacao.webp',
      alt: 'Mulher de olhos fechados segurando uma xícara ao nascer do sol, diante da mata, com uma barra de chocolate sobre uma pedra ao lado',
    },
  },
  {
    id: 'loja',
    rotulo: 'Loja',
    titulo: 'Chocolate pra todo mundo!',
    texto:
      'Sabores clássicos e inusitados, tudo vegano, sem lactose, sem glúten e sem medo de ser feliz!',
    cta: { rotulo: 'Ver a Loja →', href: '/loja' },
    imagem: {
      src: '/home/hero-veganos.webp',
      // texto da foto embaixo à direita: x 75% o mantém inteiro no celular (4:3); y 70% evita que telas largas e baixas o encostem na borda de baixo
      posicao: '75% 70%',
      alt: 'Lascas de chocolate branco com flores de primavera e jenipapo sobre uma tábua de bambu, com o texto: deliciosamente vegano! Coleção Jandê. Chocolate em lascas branco, 30% cacau, com jenipapo cristalizado e flor de primavera',
    },
  },
];

// Blocos da seção Sustentabilidade (X18): cada um inteiro leva a /sustentabilidade. Textos da dona, literais.
const CUIDADOS = [
  {
    titulo: 'Cuidar de Si',
    texto:
      'Ingredientes naturais, formulações minimalistas e 100% à base de plantas. Nossos produtos foram pensados para cuidar da saúde do corpo, da mente e do meio ambiente.',
    src: '/home/home-cuidar-de-si.webp',
    alt: 'Duas colheres de madeira sobre pedra, uma com açúcar mascavo e outra com nibs de cacau',
  },
  {
    titulo: 'Cuidar do Outro',
    texto:
      'Nossa cadeia produtiva fortalece agricultores familiares da Bahia, com preço justo e parceria de longo prazo. Sua compra mantém essas famílias no campo, produzindo cacau de qualidade.',
    src: '/home/home-cuidar-do-outro.webp',
    alt: 'Duas agricultoras sorrindo, costas com costas na mata, cada uma segurando um fruto de cacau maduro',
  },
  {
    titulo: 'Cuidar do Todo',
    texto:
      'Nosso jeito de plantar alimentos protege a natureza: cultivamos em Cabruca, um sistema de agricultura regenerativa que mantém a floresta em pé. E cada chocolate vendido ajuda a conservar e reflorestar áreas de cabruca na Mata Atlântica.',
    src: '/home/home-cuidar-do-todo.webp',
    alt: 'Agricultor de chapéu segurando um fruto de cacau entre as raízes de uma árvore grande na cabruca',
  },
];

// A home é pré-renderizada; sem isso a curadoria do admin (X6) só apareceria no próximo build.
export const revalidate = 60;

export default async function HomePage() {
  const [vitrine, categorias] = await Promise.all([getVitrine(), getCategoriasComProdutos()]);
  const slides = slidesVisiveis(SLIDES);

  return (
    <main>
      {slides.length > 0 && <HeroCarrossel slides={slides} />}

      <p className={styles.manifesto}>
        Chocolates <strong>plant-based</strong>, feitos com ingredientes da floresta, que{' '}
        <strong>nutrem</strong> corpo e alma
        <br />e <strong>regeneram a Mata Atlântica</strong>.
      </p>

      <VitrineProdutos titulo={vitrine.titulo} produtos={vitrine.produtos} />

      <GradeCategorias categorias={categorias} />

      <div className={styles.marca}>
        <section className={styles.secaoFoto} aria-labelledby="home-meditacao">
          <div className={styles.foto}>
            <Image
              src="/meditacao/hero.png"
              alt="Três chocolates da Coleção Inspirar dispostos sobre uma tábua de madeira"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className={styles.fotoImg}
            />
          </div>
          <div className={styles.texto}>
            <h2 id="home-meditacao" className={styles.titulo}>Chocolates para Meditação</h2>
            <p className={styles.paragrafo}>
              A Simplicitude traz para você uma linha exclusiva de chocolates que te levam numa
              jornada sensorial e emocional. Cada sabor vem acompanhado de uma meditação guiada,
              pensada para você degustar com presença — sem pressa, sem distração.
            </p>
            <Link href={`/loja?colecao=${COLECAO_MEDITACAO}`} className={styles.cta}>
              Conheça a Coleção Inspirar <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>

        <section className={styles.sustentabilidade} aria-labelledby="home-sustentabilidade">
          <h2 id="home-sustentabilidade" className={styles.tituloSust}>
            <em>Um mundo melhor</em> com simples atitudes
          </h2>
          <ul className={styles.blocos}>
            {CUIDADOS.map((c) => (
              <li key={c.titulo} className={styles.bloco}>
                <div className={styles.blocoFoto}>
                  <Image
                    src={c.src}
                    alt={c.alt}
                    fill
                    sizes="(min-width: 900px) 33vw, 100vw"
                    className={styles.fotoImg}
                  />
                </div>
                <h3 className={styles.blocoTitulo}>
                  <Link href="/sustentabilidade" className={styles.blocoLink}>
                    {c.titulo}
                  </Link>
                </h3>
                <p className={styles.paragrafo}>{c.texto}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className={`${styles.secaoFoto} ${styles.espelhada}`} aria-labelledby="home-quem-somos">
          <div className={styles.foto}>
            <Image
              src="/home/home-quem-somos.webp"
              alt="Homem de camisa jeans abrindo um fruto de cacau com uma faca, entre cacaueiros na agrofloresta"
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className={styles.fotoImg}
            />
          </div>
          <div className={styles.texto}>
            <h2 id="home-quem-somos" className={styles.frase}>
              <strong>Da floresta à fábrica</strong> — cacau de agrofloresta, cultivado por quatro gerações.
            </h2>
            <Link href="/quem-somos" className={styles.cta}>
              Conheça nossa história <span aria-hidden="true">→</span>
            </Link>
          </div>
        </section>
      </div>
    </main>
  );
}
