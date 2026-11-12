'use client';

import { useState } from 'react';
import FotoProduto from './FotoProduto';
import { estiloFoto } from '@/lib/foco';
import styles from './GaleriaProduto.module.css';

// Galeria do produto: foto principal no quadro do card (--proporcao-produto) e, com 2+ fotos,
// miniaturas em botões (teclado: Tab + Enter/Espaço). Cada foto respeita o próprio foco e zoom
// (lib/foco.js). `fotos` vem de fotosDoProduto(): [{ url, alt, foco_x, foco_y, zoom }].
export default function GaleriaProduto({ fotos, nome }) {
  const [atual, setAtual] = useState(0);
  const foto = fotos[atual] ?? fotos[0];

  if (!foto) {
    return (
      <div className={styles.placeholder} aria-hidden="true">
        {nome.charAt(0)}
      </div>
    );
  }

  return (
    <div className={styles.galeria}>
      <div className={styles.quadro}>
        <FotoProduto
          key={foto.url}
          src={foto.url}
          alt={foto.alt ?? nome}
          sizes="(max-width: 700px) 100vw, 468px"
          className={styles.foto}
          style={estiloFoto(foto.foco_x, foto.foco_y, foto.zoom)}
          preload={atual === 0}
        />
      </div>

      {fotos.length > 1 && (
        <ul className={styles.miniaturas}>
          {fotos.map((f, i) => (
            <li key={f.url}>
              <button
                type="button"
                className={styles.miniatura}
                onClick={() => setAtual(i)}
                aria-label={`Ver foto ${i + 1} de ${fotos.length}`}
                aria-current={i === atual ? 'true' : undefined}
              >
                <FotoProduto
                  src={f.url}
                  alt=""
                  sizes="72px"
                  className={styles.foto}
                  style={estiloFoto(f.foco_x, f.foco_y, f.zoom)}
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
