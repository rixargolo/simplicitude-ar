import { Fragment } from 'react';
import { blocosTexto, inlineTexto } from '@/lib/texto';
import styles from './TextoFormatado.module.css';

function Inline({ tokens }) {
  return tokens.map((t, i) => {
    if (t.tipo === 'texto') return t.texto;
    const filhos = <Inline tokens={t.filhos} />;
    if (t.tipo === 'b') return <strong key={i}>{filhos}</strong>;
    if (t.tipo === 'i') return <em key={i}>{filhos}</em>;
    return (
      <a key={i} href={t.href} target="_blank" rel="noopener noreferrer">
        {filhos}
      </a>
    );
  });
}

// Descrição longa do produto (lib/texto.js): parágrafos, quebras de linha, negrito, itálico, listas e link.
// Monta elementos React (nunca HTML cru), então o conteúdo digitado no admin não executa nada.
// Server-safe; o admin também o usa na pré-visualização (BarraFormatacao).
export default function TextoFormatado({ texto, className = '' }) {
  return (
    <div className={`${styles.texto} ${className}`}>
      {blocosTexto(texto).map((b, i) => {
        const linhas = b.linhas.map((l, j) => (
          <Fragment key={j}>
            {j > 0 && b.tipo === 'p' && <br />}
            {b.tipo === 'p' ? <Inline tokens={inlineTexto(l)} /> : <li><Inline tokens={inlineTexto(l)} /></li>}
          </Fragment>
        ));
        if (b.tipo === 'ul') return <ul key={i}>{linhas}</ul>;
        if (b.tipo === 'ol') return <ol key={i}>{linhas}</ol>;
        return <p key={i}>{linhas}</p>;
      })}
    </div>
  );
}
