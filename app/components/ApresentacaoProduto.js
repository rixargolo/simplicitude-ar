import { rotuloCategoria } from '@/lib/produtos';
import { fotosDoProduto } from '@/lib/fotos';
import GaleriaProduto from './GaleriaProduto';
import styles from './ApresentacaoProduto.module.css';

// Replica o bloco de apresentação de produto da tela de boas-vindas do antigo app AR
// (__ARCHIVE/experiencias/alegria-ar/): label script com o nome da categoria (quando
// mostrar_categoria_no_titulo=true), nome grande, tags e descrição, ao lado da galeria.
// `fotos` (de getFotosDoProduto) traz todas as fotos; sem ela usa a cópia da principal em
// produtos.imagem_*. `Titulo` é o nível do nome: h1 na página do produto, h2 em /meditacao.
export default function ApresentacaoProduto({ produto, fotos, Titulo = 'h2', children }) {
  const rotulo = rotuloCategoria(produto);

  return (
    <div className={styles.block}>
      <GaleriaProduto fotos={fotos ?? fotosDoProduto(produto, [])} nome={produto.nome} />

      <div className={styles.text}>
        {rotulo && <span className={styles.labelScript}>{rotulo}</span>}
        <Titulo className={styles.nameDisplay}>{produto.nome}</Titulo>
        {produto.atributos && (
          <p className={styles.tags}>{produto.atributos}</p>
        )}
        <p className={styles.desc}>{produto.descricao}</p>
        {children}
      </div>
    </div>
  );
}
