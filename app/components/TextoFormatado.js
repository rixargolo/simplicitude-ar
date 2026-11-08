import { Fragment } from 'react';
import Link from 'next/link';
import { blocosTexto, inlineTexto } from '@/lib/texto';
import styles from './TextoFormatado.module.css';

function Inline({ tokens }) {
  return tokens.map((t, i) => {
    if (t.tipo === 'texto') return t.texto;
    const filhos = <Inline tokens={t.filhos} />;
    if (t.tipo === 'b') return <strong key={i}>{filhos}</strong>;
    if (t.tipo === 'i') return <em key={i}>{filhos}</em>;
    // caminho interno (/trocas) navega na mesma aba; externo abre em nova aba
    if (t.href.startsWith('/')) return <Link key={i} href={t.href}>{filhos}</Link>;
    return (
      <a key={i} href={t.href} target="_blank" rel="noopener noreferrer">
        {filhos}
      </a>
    );
  });
}

// Descrição longa do produto e páginas legais (lib/texto.js): parágrafos, quebras de linha, títulos ##/###,
// negrito, itálico, listas e link.
// Monta elementos React (nunca HTML cru), então o conteúdo digitado no admin não executa nada.
// Server-safe; o admin também o usa na pré-visualização (BarraFormatacao).
export default function TextoFormatado({ texto, className = '' }) {
  return (
    <div className={`${styles.texto} ${className}`}>
      {blocosTexto(texto).map((b, i) => {
        if (b.tipo === 'h2' || b.tipo === 'h3') {
          const Titulo = b.tipo;
          return <Titulo key={i}><Inline tokens={inlineTexto(b.linhas[0])} /></Titulo>;
        }
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
