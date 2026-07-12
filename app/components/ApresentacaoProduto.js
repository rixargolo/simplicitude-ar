import Image from 'next/image';
import { rotuloCategoria } from '@/lib/produtos';
import styles from './ApresentacaoProduto.module.css';

// Replica literalmente o bloco de apresentação de produto da tela de
// boas-vindas do antigo app AR (__ARCHIVE/experiencias/alegria-ar/): label
// script com o nome da categoria (quando mostrar_categoria_no_titulo=true),
// nome grande, tags e descrição, ao lado de uma galeria de fotos (uma
// grande + miniaturas, se houver mais de uma imagem disponível).
export default function ApresentacaoProduto({ produto, children }) {
  const rotulo = rotuloCategoria(produto);

  const imagens =
    produto.imagens && produto.imagens.length > 0
      ? produto.imagens
      : produto.imagem_url
        ? [produto.imagem_url]
        : [];

  const [imagemPrincipal, ...miniaturas] = imagens;

  return (
    <div className={styles.block}>
      <div className={styles.photos}>
        {imagemPrincipal ? (
          <div className={styles.photoMainWrap}>
            <Image
              src={imagemPrincipal}
              alt={produto.nome}
              fill
              sizes="(max-width: 700px) 100vw, 500px"
              className={styles.photoMain}
              priority
            />
          </div>
        ) : (
          <div className={styles.photoPlaceholder} aria-hidden="true">
            {produto.nome.charAt(0)}
          </div>
        )}

        {miniaturas.length > 0 && (
          <div className={styles.photoThumbs}>
            {miniaturas.map((src, i) => (
              <div className={styles.photoThumbWrap} key={src ?? i}>
                <Image
                  src={src}
                  alt={`${produto.nome} detalhe`}
                  fill
                  sizes="(max-width: 700px) 50vw, 250px"
                  className={styles.photoThumb}
                />
              </div>
            ))}
          </div>
        )}
      </div>

      <div className={styles.text}>
        {rotulo && <span className={styles.labelScript}>{rotulo}</span>}
        <h2 className={styles.nameDisplay}>{produto.nome}</h2>
        {produto.atributos && (
          <p className={styles.tags}>{produto.atributos}</p>
        )}
        <p className={styles.desc}>{produto.descricao}</p>
        {children}
      </div>
    </div>
  );
}
