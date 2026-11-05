'use client';

import { useEffect, useState } from 'react';
import { PALETAS, PALETA_PADRAO, CHAVE_PALETA, variaveis } from '@/lib/paletas';
import styles from './SeletorPaleta.module.css';

function Barra() {
  const [chave, setChave] = useState(PALETA_PADRAO);

  // o script inline do layout já aplicou a paleta; aqui só espelha no select
  useEffect(() => {
    setChave(document.documentElement.dataset.paleta || PALETA_PADRAO);
  }, []);

  function trocar(nova) {
    const el = document.documentElement;
    for (const [v, valor] of Object.entries(variaveis(nova))) el.style.setProperty(v, valor);
    el.dataset.paleta = nova;
    try {
      localStorage.setItem(CHAVE_PALETA, nova);
    } catch {}
    const url = new URL(location.href);
    url.searchParams.set('paleta', nova);
    history.replaceState(null, '', url);
    setChave(nova);
  }

  return (
    <div className={styles.barra}>
      <label>
        Paleta (preview){' '}
        <select value={chave} onChange={(e) => trocar(e.target.value)}>
          {Object.entries(PALETAS).map(([k, p]) => (
            <option key={k} value={k}>
              {p.nome}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}

// Dupla guarda: o layout já só renderiza com a flag. A comparação literal (inlinada pelo Next)
// deixa o minificador descartar Barra e os presets do bundle de produção; chamar
// mockupsLigados() aqui não bastava (função de outro módulo, não é eliminada).
export default function SeletorPaleta() {
  return process.env.NEXT_PUBLIC_MOCKUPS === '1' ? <Barra /> : null;
}
