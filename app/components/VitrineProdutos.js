import Link from 'next/link';
import { SIZES_CARD_CARROSSEL } from '@/lib/fotos';
import CarrosselProdutos from './CarrosselProdutos';
import styles from './VitrineProdutos.module.css';

// Vitrine da home: à esquerda título (derivado do critério de ordem, ver lib/vitrine.js),
// e link para a loja; à direita, o CarrosselProdutos (trilho que vai até a borda da tela, setas no
// desktop). As categorias ficam na GradeCategorias, logo abaixo (X10).
export default function VitrineProdutos({ titulo, produtos }) {
  if (!produtos || produtos.length === 0) return null;

  return (
    <section className={styles.section} aria-labelledby="vitrine-titulo">
      <div className={styles.intro}>
        <h2 id="vitrine-titulo" className={styles.titulo}>
          {titulo} <em className={styles.enfase}>da floresta</em>
        </h2>

        <Link href="/loja" className={styles.botao}>
          Ver toda a loja
        </Link>
      </div>

      <CarrosselProdutos
        produtos={produtos}
        rotulo={titulo}
        className={styles.trilho}
        sizes={SIZES_CARD_CARROSSEL}
      />
    </section>
  );
}
