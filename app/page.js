import { getVitrine, getCategoriasComProdutos } from '@/lib/produtos';
import { slidesVisiveis } from '@/lib/carrossel';
import HeroCarrossel from './components/HeroCarrossel';
import VitrineProdutos from './components/VitrineProdutos';
import GradeCategorias from './components/GradeCategorias';

export const metadata = {
  title: 'Simplicitude — Da Floresta à Fábrica',
  description:
    'Chocolate artesanal e alimentos plant-based com ingredientes agroflorestais do Sul da Bahia.',
};

// Slides do hero. `imagem` é opcional ({ src, alt, posicao? }; `posicao` = object-position): sem ela o slide mostra um
// placeholder no preview e é omitido em produção (ver slidesVisiveis). Fotos 16:9 em
// WebP (receita no CLAUDE.md); o texto dos slides é provisório.
const SLIDES = [
  {
    id: 'loja',
    rotulo: 'Loja',
    titulo: 'Chocolate da floresta',
    texto:
      'Plant-based e feito com ingredientes agroflorestais, nutre corpo e alma — e ajuda a regenerar a Mata Atlântica.',
    cta: { rotulo: 'Ver a loja', href: '/loja' },
    imagem: {
      src: '/home/hero_slide_1.webp',
      // cabeça no topo e cacau na base: 70% mostra o rosto (óculos) e o cacau inteiro na mão
      posicao: '50% 70%',
      alt: 'Homem de camisa jeans abrindo um fruto de cacau com uma faca, entre cacaueiros na agrofloresta',
    },
  },
  {
    id: 'bem-estar',
    rotulo: 'Bem-estar',
    titulo: 'Chocolate para meditar',
    texto:
      'A Coleção Inspirar une ervas e especiarias a meditações guiadas em áudio, narradas por Bruna Santos.',
    cta: { rotulo: 'Conhecer a meditação', href: '/meditacao' },
    imagem: {
      src: '/home/hero_slide_2.webp',
      alt: 'Barra de chocolate escuro sobre uma travessa branca, cercada de folhas de cacau, laranja desidratada e cardamomo',
    },
  },
  {
    id: 'quem-somos',
    rotulo: 'Quem somos',
    titulo: 'Da floresta à fábrica',
    texto:
      'Cacau de agrofloresta, cultivado por quatro gerações no Sul da Bahia, dentro da Mata Atlântica.',
    cta: { rotulo: 'Conheça nossa história', href: '/quem-somos' },
    imagem: {
      src: '/home/hero_slide_3.webp',
      // telas largas cortam a foto 16:9 em cima e embaixo: ancora no topo para manter as cabeças
      posicao: '50% 0%',
      alt: 'Produtor e uma mulher espalhando cacau para secar num secador de madeira, com colinas ao fundo',
    },
  },
  {
    id: 'presentes',
    rotulo: 'Presentes',
    titulo: 'Chocolate para presentear',
    texto:
      'Chocolates artesanais para dar de presente a quem você quer bem — ou para se dar um momento de calma.',
    cta: { rotulo: 'Escolher um presente', href: '/loja' },
    imagem: {
      src: '/home/hero_slide_4.webp',
      alt: 'Pacotes de nibs de cacau Simplicitude ao lado de uma xícara de café e um jogo de chá, sobre azulejos azuis e brancos',
    },
  },
];

export default async function HomePage() {
  const [vitrine, categorias] = await Promise.all([getVitrine(), getCategoriasComProdutos()]);
  const slides = slidesVisiveis(SLIDES);

  return (
    <main>
      {slides.length > 0 && <HeroCarrossel slides={slides} />}

      <VitrineProdutos
        titulo={vitrine.titulo}
        produtos={vitrine.produtos}
        categorias={categorias}
      />

      <GradeCategorias categorias={categorias} />
    </main>
  );
}
