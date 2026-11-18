import Image from 'next/image';
import Link from 'next/link';
import { getProdutosMeditacao } from '@/lib/produtos';
import { PARES_EN, textos, traducaoCompleta } from '@/lib/i18n';
import { urlCanonica } from '@/lib/site';
import ApresentacaoProduto from '../components/ApresentacaoProduto';
import MeditacaoPlayer from '../components/MeditacaoPlayer';
import styles from './meditacao.module.css';

// Conteúdo de /meditacao e /en/meditacao (as duas page.js só chamam isto). Textos em lib/i18n/{pt,en}.js.

// Metadados dos dois idiomas. hreflang só com o EN completo; enquanto houver texto EN vazio, a página EN sai
// com noindex e sem o par (ADR 0002: não indexar conteúdo EN que ainda é PT).
export function metadataMeditacao(idioma) {
  const t = textos(idioma).meditacao;
  const ptUrl = urlCanonica('/meditacao');
  const enUrl = urlCanonica(PARES_EN['/meditacao']);
  const completo = traducaoCompleta();
  const en = idioma === 'en';
  return {
    title: t.metaTitulo,
    description: t.metaDescricao,
    alternates: {
      canonical: en ? enUrl : ptUrl,
      ...(completo && { languages: { 'pt-BR': ptUrl, en: enUrl, 'x-default': ptUrl } }),
    },
    // openGraph da página substitui o do layout por inteiro: no EN repete siteName/type e troca o locale
    ...(en && {
      robots: completo ? undefined : { index: false },
      openGraph: { siteName: 'Simplicitude', type: 'website', locale: 'en_US', alternateLocale: 'pt_BR' },
    }),
  };
}

// Recortes de _DOCS/meditação/capa página meditar.png (575 px de altura, WebP q85). Largura e altura reais:
// a faixa usa a proporção de cada foto para as três dividirem a largura na mesma altura, sem cortar nada.
// O texto alternativo de cada foto vem do dicionário (t.fotos, mesma ordem).
const ALTURA_FOTOS = 575;
const FOTOS = [
  { src: '/meditacao/inspirar-1.webp', largura: 2016 },
  { src: '/meditacao/inspirar-2.webp', largura: 739 },
  { src: '/meditacao/inspirar-3.webp', largura: 1189 },
];

const LARGURA_TOTAL = FOTOS.reduce((soma, foto) => soma + foto.largura, 0);

// Trechos entre ** viram <strong> (índices ímpares do split).
const Negrito = ({ texto }) => texto.split('**').map((parte, i) => (i % 2 ? <strong key={i}>{parte}</strong> : parte));

export default async function Meditacao({ idioma }) {
  const t = textos(idioma);
  const m = t.meditacao;
  const produtos = await getProdutosMeditacao(idioma);

  return (
    <main lang={idioma === 'en' ? 'en' : undefined}>
      <div className={styles.topoWrap}>
        <div className={styles.faixa}>
          {FOTOS.map((foto, i) => (
            <Image
              key={foto.src}
              src={foto.src}
              alt={m.fotos[i]}
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
            <h1 className={styles.titulo}>{m.titulo}</h1>
            <p className={styles.subtitulo}>{m.subtitulo}</p>
            <p className={styles.frase}>{m.frase}</p>
            <a href="#meditacoes" className={styles.cta}>
              {m.cta} <span aria-hidden="true">↓</span>
            </a>
          </div>

          <div className={styles.texto}>
            <p className={styles.abertura}>
              {m.abertura[0]}
              <br />
              {m.abertura[1]}
            </p>
            {m.paragrafos.map((p) => (
              <p key={p} className={styles.corpo}>
                <Negrito texto={p} />
              </p>
            ))}
          </div>
        </section>
      </div>

      <h2 id="meditacoes" className={styles.sectionTitle}>{m.listaTitulo}</h2>

      {produtos.length === 0 ? (
        <p className={styles.empty}>{m.vazio}</p>
      ) : (
        produtos.map((produto) => (
          <ApresentacaoProduto
            key={produto.id}
            produto={produto}
            titulo={produto.titulo_meditacao || produto.nome}
            verFoto={t.galeria.verFoto}
            resumido
          >
            <MeditacaoPlayer
              audioUrl={produto.audio_url}
              textos={t.player}
              avisoPt={produto.audio_idioma !== idioma}
            />
            {/* a loja só existe em PT por enquanto: o link leva ao produto em PT nos dois idiomas */}
            <Link href={`/loja/${produto.slug}`} className={styles.lojaLink}>
              {m.verNaLoja} <span aria-hidden="true">→</span>
            </Link>
          </ApresentacaoProduto>
        ))
      )}
    </main>
  );
}
