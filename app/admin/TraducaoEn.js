'use client';

import { useState } from 'react';
import { acaoTraducao } from '@/lib/i18n';
import styles from './categorias/CategoriaForm.module.css';

// Seção "English (opcional)" dos formulários do admin (ADR 0002). Vazia = o site usa o PT.
// `valores` = { nome, descricao }; o formulário dono guarda o estado e chama salvarTraducao() ao salvar.
export default function TraducaoEn({ valores, onChange }) {
  // aberta só se já há tradução ao carregar; fixa depois, senão recolheria ao apagar o texto
  const [aberta] = useState(() => Boolean(valores.nome || valores.descricao));
  return (
    <details className={styles.field} open={aberta}>
      <summary className={styles.resumo}>English (opcional)</summary>
      <div className={styles.field}>
        <label htmlFor="en-nome" className={styles.label}>Name</label>
        <input
          id="en-nome"
          className={styles.input}
          type="text"
          lang="en"
          value={valores.nome}
          onChange={(e) => onChange({ ...valores, nome: e.target.value })}
        />
        <label htmlFor="en-descricao" className={styles.label}>Description</label>
        <textarea
          id="en-descricao"
          className={styles.textarea}
          lang="en"
          rows={3}
          value={valores.descricao}
          onChange={(e) => onChange({ ...valores, descricao: e.target.value })}
        />
        <span className={styles.ajuda}>Campo vazio usa o texto em português.</span>
      </div>
    </details>
  );
}

// Estado inicial do formulário a partir das linhas embutidas (`*_traducoes(*)`).
export function traducaoEnInicial(linhas) {
  const t = linhas?.find((l) => l.idioma === 'en');
  return { nome: t?.nome ?? '', descricao: t?.descricao ?? '' };
}

// Grava/apaga a linha EN da entidade. `fk` = coluna da FK (ex.: 'categoria_id'). Erro vira mensagem exibível.
export async function salvarTraducao(supabase, tabela, fk, id, valores, existia) {
  const acao = acaoTraducao(valores, existia);
  if (acao === 'nada') return;
  const { error } =
    acao === 'gravar'
      ? await supabase.from(tabela).upsert(
          { [fk]: id, idioma: 'en', nome: valores.nome.trim() || null, descricao: valores.descricao.trim() || null },
          { onConflict: `${fk},idioma` },
        )
      : await supabase.from(tabela).delete().eq(fk, id).eq('idioma', 'en');
  if (error) {
    throw Object.assign(new Error(`Salvo, mas não foi possível gravar a tradução: ${error.message}`), { exibir: true });
  }
}
