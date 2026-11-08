'use client';

import { useEffect, useRef } from 'react';
import styles from './loja.module.css';

// Lista de chips com um realce que aparece (fade) no chip sob o mouse/foco e volta ao ativo (aria-current).
// Posição e cor do texto são aplicadas direto no DOM (sem estado) para não re-renderizar a cada hover.
// shortcut: mede só no mount, a cada render e no resize; se a fonte carregar depois e mudar a largura, o realce desalinha até o próximo hover.
export default function BarraDeslizante({ children }) {
  const lista = useRef(null);
  const realce = useRef(null);
  const primeira = useRef(true);
  const atual = useRef(null); // <li> sob o realce

  // Ao trocar de chip o realce não desliza: aparece no novo lugar com um fade (opacity 0 → 1, transição no CSS).
  // `animar = false` só posiciona (1ª carga); mesmo chip de novo (resize, re-render) só reposiciona.
  const mover = (a, animar = true) => {
    const li = a?.closest('li');
    const r = realce.current;
    lista.current?.querySelectorAll('[data-alvo]').forEach((el) => delete el.dataset.alvo);
    if (!li) {
      r.style.opacity = 0;
      atual.current = null;
      return;
    }
    a.dataset.alvo = '';
    const fade = animar && li !== atual.current;
    atual.current = li;
    if (fade) {
      r.style.transition = 'none';
      r.style.opacity = 0;
    }
    r.style.width = `${li.offsetWidth}px`;
    r.style.transform = `translateX(${li.offsetLeft}px)`;
    if (fade) {
      void r.offsetWidth; // aplica o estado "invisível, sem transição" antes de reativar a transição
      r.style.transition = '';
    }
    r.style.opacity = 1;
  };

  const voltar = (animar) => mover(lista.current?.querySelector('[aria-current]'), animar !== false);

  // Esmaecido escuro só do lado que tem conteúdo escondido (CSS: .barra:has(.chips[data-fade-esq|dir])).
  const bordas = () => {
    const l = lista.current;
    if (!l) return;
    const max = l.scrollWidth - l.clientWidth;
    const marca = (chave, ligado) => (ligado ? (l.dataset[chave] = '') : delete l.dataset[chave]);
    marca('fadeEsq', max > 4 && l.scrollLeft > 4);
    marca('fadeDir', max > 4 && l.scrollLeft < max - 4);
  };

  // Traz o item ativo para o centro da barra, para não ficar escondido fora da tela.
  const centralizar = (behavior) => {
    const l = lista.current;
    const li = l?.querySelector('[aria-current]')?.closest('li');
    if (li) l.scrollTo({ left: li.offsetLeft - (l.clientWidth - li.offsetWidth) / 2, behavior });
  };

  useEffect(() => {
    const r = realce.current;
    if (primeira.current) {
      // 1º posicionamento já visível, sem fade
      r.style.transition = 'none';
      voltar(false);
      void r.offsetWidth;
      r.style.transition = '';
      lista.current.dataset.pronto = '';
      centralizar('auto');
      primeira.current = false;
    } else {
      voltar();
      centralizar('auto');
    }
    bordas();
  });

  useEffect(() => {
    const aoRedimensionar = () => {
      voltar();
      bordas();
    };
    window.addEventListener('resize', aoRedimensionar);
    return () => window.removeEventListener('resize', aoRedimensionar);
  }, []);

  return (
    <ul
      ref={lista}
      className={styles.chips}
      // fora de um link (folga da barra) o realce volta ao ativo, em vez de sumir
      onMouseOver={(e) => {
        const a = e.target.closest('a');
        if (a) mover(a);
        else voltar();
      }}
      onFocus={(e) => {
        const a = e.target.closest('a');
        if (a) mover(a);
      }}
      onMouseLeave={voltar}
      onBlur={voltar}
      onScroll={bordas}
    >
      <li className={styles.realceItem} aria-hidden="true">
        <span ref={realce} className={styles.realce} />
      </li>
      {children}
    </ul>
  );
}
