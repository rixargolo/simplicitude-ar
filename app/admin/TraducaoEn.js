'use client';

import { useState } from 'react';
import { acaoTraducao } from '@/lib/i18n';
import BarraFormatacao from './BarraFormatacao';
import styles from './categorias/CategoriaForm.module.css';

// Campos padrão (categoria e coleção); produto e tag passam o próprio `campos`.
export const CAMPOS_NOME_DESCRICAO = [
  { chave: 'nome', rotulo: 'Name' },
  { chave: 'descricao', rotulo: 'Description', multilinha: true },
];

// Seção "English (opcional)" dos formulários do admin (ADR 0002). Vazia = o site usa o PT.
// `valores` = { [chave]: texto } para cada item de `campos` ({ chave, rotulo, multilinha?, maxLength?, formatado? });
// `formatado` troca o textarea pela BarraFormatacao (negrito, itálico, listas, link);
// o formulário dono guarda o estado e chama salvarTraducao() ao salvar.
export default function TraducaoEn({ valores, onChange, campos = CAMPOS_NOME_DESCRICAO }) {
  // aberta só se já há tradução ao carregar; fixa depois, senão recolheria ao apagar o texto
  const [aberta] = useState(() => campos.some((c) => valores[c.chave]));
  return (
    <details className={styles.field} open={aberta}>
      <summary className={styles.resumo}>English (opcional)</summary>
      <div className={styles.field}>
        {campos.map(({ chave, rotulo, multilinha, maxLength, formatado }) => {
          const props = {
            id: `en-${chave}`,
            className: multilinha ? styles.textarea : styles.input,
            lang: 'en',
            maxLength,
            value: valores[chave],
            onChange: (e) => onChange({ ...valores, [chave]: e.target.value }),
          };
          return (
            <div key={chave} className={styles.field}>
              <label htmlFor={props.id} className={styles.label}>{rotulo}</label>
              {formatado ? (
                <BarraFormatacao
                  id={props.id}
                  className={props.className}
                  lang="en"
                  rows={5}
                  value={props.value}
                  onChange={(v) => onChange({ ...valores, [chave]: v })}
                />
              ) : multilinha ? (
                <textarea {...props} rows={3} />
              ) : (
                <input {...props} type="text" />
              )}
            </div>
          );
        })}
        <span className={styles.ajuda}>Campo vazio usa o texto em português.</span>
      </div>
    </details>
  );
}

// Estado inicial do formulário a partir das linhas embutidas (`*_traducoes(*)`).
export function traducaoEnInicial(linhas, campos = CAMPOS_NOME_DESCRICAO) {
  const t = linhas?.find((l) => l.idioma === 'en');
  return Object.fromEntries(campos.map(({ chave }) => [chave, t?.[chave] ?? '']));
}

// Grava/apaga a linha EN da entidade. `fk` = coluna da FK (ex.: 'categoria_id'). As colunas gravadas são
// as chaves de `valores`. Erro vira mensagem exibível.
export async function salvarTraducao(supabase, tabela, fk, id, valores, existia) {
  const acao = acaoTraducao(valores, existia);
  if (acao === 'nada') return;
  const textos = Object.fromEntries(Object.entries(valores).map(([k, v]) => [k, v.trim() || null]));
  const { error } =
    acao === 'gravar'
      ? await supabase.from(tabela).upsert({ [fk]: id, idioma: 'en', ...textos }, { onConflict: `${fk},idioma` })
      : await supabase.from(tabela).delete().eq(fk, id).eq('idioma', 'en');
  if (error) {
    throw Object.assign(new Error(`Salvo, mas não foi possível gravar a tradução: ${error.message}`), { exibir: true });
  }
}
