import Image from 'next/image';
import Link from 'next/link';
import { getProdutos } from '@/lib/produtos';
import ApresentacaoProduto from '../components/ApresentacaoProduto';
import MeditacaoPlayer from '../components/MeditacaoPlayer';
import styles from './meditacao.module.css';

export const metadata = {
  title: 'Meditação — Simplicitude',
  description:
    'Coleção Inspirar — chocolates com meditações guiadas na voz de Bruna Santos.',
};

// A página é pré-renderizada; sem isso uma edição no admin só apareceria no próximo build.
export const revalidate = 60;

// Recortes de _DOCS/meditação/capa página meditar.png (575 px de altura, WebP q85). Largura e altura reais:
// a faixa usa a proporção de cada foto para as três dividirem a largura na mesma altura, sem cortar nada.
const ALTURA_FOTOS = 575;
const FOTOS = [
  {
    src: '/meditacao/inspirar-1.webp',
    largura: 2016,
    alt: 'Barra de chocolate amargo numa travessa branca, com folhas de cacau, rodelas de laranja desidratada e cardamomo',
  },
  {
    src: '/meditacao/inspirar-2.webp',
    largura: 739,
    alt: 'Barra de chocolate num prato verde, entre folhas de hortelã',
  },
  {
    src: '/meditacao/inspirar-3.webp',
    largura: 1189,
    alt: 'Barra de chocolate branco numa travessa verde em forma de folha, com lascas de coco e flores de lavanda',
  },
];

const LARGURA_TOTAL = FOTOS.reduce((soma, foto) => soma + foto.largura, 0);

export default async function MeditacaoPage() {
  const produtos = await getProdutos();
  const produtosComMeditacao = produtos.filter(
    (produto) => produto.tem_meditacao,
  );

  return (
    <main>
      <div className={styles.topoWrap}>
        <div className={styles.faixa}>
          {FOTOS.map((foto, i) => (
            <Image
              key={foto.src}
              src={foto.src}
              alt={foto.alt}
              width={foto.largura}
              height={ALTURA_FOTOS}
              sizes={`(max-width: 1200px) ${Math.round((100 * foto.largura) / LARGURA_TOTAL)}vw, ${Math.round((1200 * foto.largura) / LARGURA_TOTAL)}px`}
              className={styles.foto}
              style={{ flexGrow: foto.largura, aspectRatio: `${foto.largura} / ${ALTURA_FOTOS}` }}
              priority={i === 0}
            />
          ))}
        </div>

        <section className={styles.topo}>
          <div className={styles.titulos}>
            <h1 className={styles.titulo}>Coleção Inspirar</h1>
            <p className={styles.subtitulo}>Chocolates para Meditação</p>
            <p className={styles.frase}>
              Um ritual de autocuidado em forma de chocolate.
            </p>
            <a href="#meditacoes" className={styles.cta}>
              Acesse as meditações guiadas <span aria-hidden="true">↓</span>
            </a>
          </div>

          <div className={styles.texto}>
            <p className={styles.abertura}>
              Tem chocolate que a gente come no automático.
              <br />
              Esse, não.
            </p>
            <p className={styles.corpo}>
              A Coleção Inspirar é uma linha exclusiva da Simplicitude, que{' '}
              <strong>harmoniza os benefícios nutricionais</strong> e
              sensoriais dos chocolates{' '}
              <strong>com práticas de meditação</strong> e atenção plena.
            </p>
            <p className={styles.corpo}>
              Ela nasceu de uma ideia simples: transformar um pedaço de
              chocolate em um <strong>momento de presença</strong>. Cada barra
              foi criada com <strong>ervas e especiarias</strong> escolhidas
              para despertar um sentimento diferente — Alegria, Esperança,
              Serenidade. E cada uma vem acompanhada de uma{' '}
              <strong>meditação guiada</strong>, na voz de Bruna Santos.
            </p>
            <p className={styles.corpo}>
              Unindo as propriedades dos ingredientes e as meditações guiadas,
              estes chocolates estimulam uma deliciosa sensação de bem-estar,
              conectando corpo e mente de forma holística.
            </p>
            <p className={styles.corpo}>
              Experimente a degustação meditativa da Simplicitude!
            </p>
          </div>
        </section>
      </div>

      <h2 id="meditacoes" className={styles.sectionTitle}>Meditações guiadas</h2>

      {produtosComMeditacao.length === 0 ? (
        <p className={styles.empty}>
          Nenhum chocolate com meditação guiada disponível no momento.
        </p>
      ) : (
        produtosComMeditacao.map((produto) => (
          <ApresentacaoProduto
            key={produto.id}
            produto={produto}
            titulo={produto.titulo_meditacao || produto.nome}
            resumido
          >
            <MeditacaoPlayer audioUrl={produto.audio_url} />
            <Link href={`/loja/${produto.slug}`} className={styles.lojaLink}>
              Ver na loja <span aria-hidden="true">→</span>
            </Link>
          </ApresentacaoProduto>
        ))
      )}
    </main>
  );
}
