import { rotuloCategoria } from '@/lib/produtos';
import { fotosDoProduto } from '@/lib/fotos';
import GaleriaProduto from './GaleriaProduto';
import styles from './ApresentacaoProduto.module.css';

// Replica o bloco de apresentação de produto da tela de boas-vindas do antigo app AR
// (__ARCHIVE/experiencias/alegria-ar/): label script com o nome da categoria (quando
// mostrar_categoria_no_titulo=true), nome grande e descrição, ao lado da galeria.
// Ordem do texto (X13): categoria, nome, descrição curta, tags, `children` (preço/Comprar na loja, player em
// /meditacao), descrição longa e ingredientes — o que decide a compra fica antes do texto longo.
// `produto.tags` ([{ nome }]) só vem de getProdutoBySlug. `atributos` (coluna antiga, só da main) não aparece.
// `fotos` (de getFotosDoProduto) traz todas as fotos; sem ela usa a cópia da principal em
// produtos.imagem_*. `Titulo` é o nível do nome: h1 na página do produto, h2 em /meditacao.
// `resumido` (usado em /meditacao) omite a descrição longa e os ingredientes: fica só a curta.
export default function ApresentacaoProduto({ produto, fotos, Titulo = 'h2', resumido = false, children }) {
  const rotulo = rotuloCategoria(produto);

  return (
    <div className={styles.block}>
      <GaleriaProduto fotos={fotos ?? fotosDoProduto(produto, [])} nome={produto.nome} />

      <div className={styles.text}>
        {rotulo && <span className={styles.labelScript}>{rotulo}</span>}
        <Titulo className={styles.nameDisplay}>{produto.nome}</Titulo>
        {produto.descricao_curta && <p className={styles.curta}>{produto.descricao_curta}</p>}
        {produto.tags?.length > 0 && (
          <ul className={styles.tags} aria-label="Tags">
            {produto.tags.map((tag) => (
              <li key={tag.nome} className={styles.tag}>{tag.nome}</li>
            ))}
          </ul>
        )}
        {children}
        {!resumido && produto.descricao && <p className={styles.desc}>{produto.descricao}</p>}
        {!resumido && produto.ingredientes && (
          <dl className={styles.ingredientes}>
            <dt>Ingredientes</dt>
            <dd>{produto.ingredientes}</dd>
          </dl>
        )}
      </div>
    </div>
  );
}
