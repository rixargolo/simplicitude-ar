import Image from 'next/image';
import topoStyles from '../meditacao/meditacao.module.css';
import styles from './quem-somos.module.css';

export const metadata = {
  title: 'Quem Somos — Simplicitude',
  description:
    'Da Floresta à Fábrica: a história da Simplicitude, chocolate artesanal do Sul da Bahia.',
};

// Recortes de _DOCS/quem-somos/capa quem somos.png (587 px de altura, WebP; as barras pretas e a linha preta de
// 1 px de cada foto foram cortadas). Mesmo padrão da faixa de /meditacao: a largura real de cada foto vira
// flex-grow + aspect-ratio, então as três dividem a largura na mesma altura, sem cortar nada.
const ALTURA_FOTOS = 587;
const FOTOS = [
  {
    src: '/quem-somos/capa-1.webp',
    largura: 835,
    alt: 'Dois frutos de cacau maduros, alaranjados, sobre uma folha de palmeira',
  },
  {
    src: '/quem-somos/capa-2.webp',
    largura: 2004,
    alt: 'Agricultor de boné amarelo revolvendo amêndoas de cacau que secam ao sol numa barcaça',
  },
  {
    src: '/quem-somos/capa-3.webp',
    largura: 1188,
    alt: 'Travessa de madeira com três divisões: folhas verdes frescas, dois discos de chocolate e folhas picadas',
  },
];

const LARGURA_TOTAL = FOTOS.reduce((soma, foto) => soma + foto.largura, 0);

export default function QuemSomosPage() {
  return (
    <main>
      <div className={topoStyles.topoWrap}>
        <div className={topoStyles.faixa}>
          {FOTOS.map((foto, i) => (
            <Image
              key={foto.src}
              src={foto.src}
              alt={foto.alt}
              width={foto.largura}
              height={ALTURA_FOTOS}
              sizes={`(max-width: 1200px) ${Math.round((100 * foto.largura) / LARGURA_TOTAL)}vw, ${Math.round((1200 * foto.largura) / LARGURA_TOTAL)}px`}
              className={topoStyles.foto}
              style={{ flexGrow: foto.largura, aspectRatio: `${foto.largura} / ${ALTURA_FOTOS}` }}
              priority={i === 0}
            />
          ))}
        </div>

        <section className={topoStyles.topo}>
          <div className={styles.titulos}>
            <h1 className={topoStyles.titulo}>Quem somos</h1>
            <p className={topoStyles.subtitulo}>Nossa origem e nossa missão</p>
            <p className={styles.lema}>
              Quatro gerações plantando cacau na Mata Atlântica.
            </p>

            <div className={`${topoStyles.texto} ${styles.textoBloco}`}>
              <p className={topoStyles.corpo}>
                A Simplicitude nasceu em{' '}
                <strong>Coaraci, no Sul da Bahia</strong>, de uma família que
                há quatro gerações vive do cultivo de cacau. Somos um{' '}
                <strong>negócio de impacto positivo</strong> que fabrica
                chocolates finos e alimentos plant-based com ingredientes
                agroflorestais da Mata Atlântica.
              </p>
              <p className={topoStyles.corpo}>
                Cada produto nosso carrega uma escolha:{' '}
                <strong>
                  manter a floresta em pé e gerar renda para quem a cultiva
                </strong>
                . É chocolate com origem, história e nome — o nosso e o de cada
                produtor parceiro.
              </p>
              <p className={topoStyles.corpo}>
                Nossa missão é{' '}
                <strong>
                  criar e compartilhar produtos que ajudam a cuidar de Si, do
                  Outro e do Todo.
                </strong>
              </p>
            </div>
          </div>

          <Image
            src="/quem-somos/quem-somos.webp"
            alt="Uma jovem e um agricultor de chapéu de palha entre cacaueiros carregados de frutos, na cabruca"
            width={1600}
            height={1200}
            sizes="(max-width: 900px) 100vw, 576px"
            className={`${styles.foto} ${styles.fotoTopo}`}
          />
        </section>
      </div>

      <section className={styles.fabrica} aria-labelledby="made-in-bahia">
        <div className={styles.fabricaGrid}>
          <Image
            src="/quem-somos/fabrica.webp"
            alt="Mulher de touca e avental sorri e aponta para o mural da fábrica: uma casa desenhada na parede, com a placa da Simplicitude e a do Sindicato de Coaraci, FAEB e SENAR"
            width={1600}
            height={1200}
            sizes="(max-width: 900px) 100vw, 576px"
            className={styles.foto}
          />
          <div className={topoStyles.texto}>
            <h2 id="made-in-bahia" className={styles.tituloSecao}>
              Made in Bahia!
            </h2>
            <p className={topoStyles.corpo}>
              Nossa fábrica fica em Coaraci, no Sul da Bahia, dentro da sede do
              Sindicato de Produtores Rurais — instituição ligada ao sistema
              FAEB/SENAR, que apoia o produtor rural baiano.
            </p>
            <p className={topoStyles.corpo}>
              Ali temos estrutura própria de beneficiamento de derivados de
              cacau, com foco especial no chocolate de origem: do grão à barra,
              sob nosso controle. É o que nos permite garantir a rastreabilidade
              de cada ingrediente e a qualidade de cada lote.
            </p>
            <p className={topoStyles.corpo}>
              A escolha de produzir aqui não é logística. É posicionamento:
              queremos que o valor gerado pela floresta permaneça na região que
              a mantém em pé.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
