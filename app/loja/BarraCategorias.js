import Link from 'next/link';
import BarraDeslizante from './BarraDeslizante';
import styles from './loja.module.css';

// 1ª fileira do filtro da loja (Tudo + categorias), usada na /loja e na página do produto.
// `ativa` = slug da categoria em foco; `emCategoria` = a página atual está "dentro" dela (coleção filtrada ou produto),
// então o chip leva aria-current="true" em vez de "page".
export default function BarraCategorias({ categorias, ativa = null, emCategoria = false }) {
  if (!categorias.length) return null;

  return (
    <nav aria-label="Categorias" className={`${styles.filtro} ${styles.barra}`}>
      <BarraDeslizante>
        <li>
          <Link
            href="/loja"
            className={styles.chip}
            aria-current={ativa || emCategoria ? undefined : 'page'}
          >
            Tudo
          </Link>
        </li>
        {categorias.map((c) => (
          <li key={c.slug}>
            <Link
              href={`/loja?categoria=${c.slug}`}
              className={styles.chip}
              aria-current={ativa === c.slug ? (emCategoria ? 'true' : 'page') : undefined}
            >
              {c.nome}
            </Link>
          </li>
        ))}
      </BarraDeslizante>
    </nav>
  );
}
