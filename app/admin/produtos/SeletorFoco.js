'use client';

import { useRef } from 'react';
import { estiloFoto, normalizarFoco, normalizarZoom, FOCO_PADRAO, ZOOM_PADRAO, ZOOM_MAX } from '@/lib/foco';
import styles from './SeletorFoco.module.css';

// Define o enquadramento da foto do produto: ponto de foco (0–100 em x e y) e zoom (100–200%).
// Clique/arrasto na foto (mouse ou dedo), três controles deslizantes (teclado e ajuste fino) e
// "Centralizar" (só a posição). `onChange` recebe { x, y, zoom }. A prévia usa o mesmo quadro
// (--proporcao-produto) e o mesmo estiloFoto() dos cards da home e da loja.
export default function SeletorFoco({ src, alt, x, y, zoom, onChange }) {
  const areaRef = useRef(null);

  function moverPara(event) {
    const caixa = areaRef.current.getBoundingClientRect();
    onChange({
      x: normalizarFoco(((event.clientX - caixa.left) / caixa.width) * 100),
      y: normalizarFoco(((event.clientY - caixa.top) / caixa.height) * 100),
      zoom,
    });
  }

  function aoPressionar(event) {
    event.currentTarget.setPointerCapture(event.pointerId);
    moverPara(event);
  }

  function aoArrastar(event) {
    if (event.currentTarget.hasPointerCapture(event.pointerId)) moverPara(event);
  }

  return (
    <div className={styles.seletor}>
      <p className={styles.dica}>Toque ou arraste na foto para escolher o que fica em destaque no card; use o zoom para aproximar.</p>

      <div
        ref={areaRef}
        className={styles.area}
        onPointerDown={aoPressionar}
        onPointerMove={aoArrastar}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- pode ser blob: do arquivo ainda não enviado */}
        <img src={src} alt={alt} className={styles.foto} draggable={false} />
        <span className={styles.marcador} style={{ left: `${x}%`, top: `${y}%` }} aria-hidden="true" />
      </div>

      <div className={styles.baixo}>
        <div className={styles.previa}>
          <span className={styles.previaRotulo}>Prévia no card</span>
          <div className={styles.quadro}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={src} alt="" className={styles.quadroFoto} style={estiloFoto(x, y, zoom)} />
          </div>
        </div>

        <div className={styles.controles}>
          <label className={styles.controle}>
            <span>Horizontal</span>
            <input
              type="range"
              min="0"
              max="100"
              value={x}
              onChange={(e) => onChange({ x: normalizarFoco(e.target.value), y, zoom })}
            />
          </label>
          <label className={styles.controle}>
            <span>Vertical</span>
            <input
              type="range"
              min="0"
              max="100"
              value={y}
              onChange={(e) => onChange({ x, y: normalizarFoco(e.target.value), zoom })}
            />
          </label>
          <label className={styles.controle}>
            <span>Zoom ({zoom}%)</span>
            <input
              type="range"
              min={ZOOM_PADRAO}
              max={ZOOM_MAX}
              step="5"
              value={zoom}
              onChange={(e) => onChange({ x, y, zoom: normalizarZoom(e.target.value) })}
            />
          </label>
          <button
            type="button"
            className={styles.centralizar}
            onClick={() => onChange({ x: FOCO_PADRAO, y: FOCO_PADRAO, zoom })}
          >
            Centralizar
          </button>
        </div>
      </div>
    </div>
  );
}
