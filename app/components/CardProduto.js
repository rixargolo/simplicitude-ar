import Link from 'next/link';
import Image from 'next/image';
import { estiloFoto } from '@/lib/foco';
import styles from './CardProduto.module.css';

const formatBRL = (centavos) =>
  new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(centavos / 100);

// Card de produto compartilhado pela vitrine da home e pela /loja: foto em quadro fixo
// (--proporcao-produto) preenchido com cover e enquadrado pelo ponto de foco e zoom do produto
// (lib/foco.js), categoria, nome, descrição em 2 linhas e preço. `className` entra no <Link>
// (o pai decide o dimensionamento); `Titulo` é o nível do título (h3 na home, h2 sob o h1 da loja).
export default function CardProduto({ produto, sizes, className = '', Titulo = 'h3' }) {
  return (
    <Link
      href={`/loja/${produto.slug}`}
      className={`${styles.card} ${className}`}
    >
      <div className={styles.imgWrap}>
        {produto.imagem_url ? (
          <Image
            src={produto.imagem_url}
            alt={produto.nome}
            fill
            sizes={sizes}
            className={styles.img}
            style={estiloFoto(produto.imagem_foco_x, produto.imagem_foco_y, produto.imagem_zoom)}
          />
        ) : (
          <span className={styles.inicial} aria-hidden="true">
            {produto.nome.charAt(0)}
          </span>
        )}
        {produto.estoque === 0 && <span className={styles.esgotado}>Esgotado</span>}
      </div>

      <div className={styles.body}>
        {produto.categorias?.nome && (
          <span className={styles.categoria}>{produto.categorias.nome}</span>
        )}
        <Titulo className={styles.titulo}>{produto.nome}</Titulo>
        {(produto.descricao_curta || produto.descricao) && (
          <p className={styles.descricao}>{produto.descricao_curta || produto.descricao}</p>
        )}
        <span className={styles.preco}>{formatBRL(produto.preco_centavos)}</span>
      </div>
    </Link>
  );
}
