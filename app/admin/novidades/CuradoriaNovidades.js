'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { mover } from '@/lib/fotos';
import { MAX_VITRINE } from '@/lib/vitrine';
import styles from './novidades.module.css';

// Escolhe e ordena os produtos da vitrine "Novidades" da home (produtos.novidade_ordem, X6).
// Lista de ids em ordem; salvar grava posição i+1 nos escolhidos e null nos removidos, só onde mudou.
export default function CuradoriaNovidades({ produtos }) {
  const router = useRouter();
  const porId = new Map(produtos.map((p) => [p.id, p]));
  const [ids, setIds] = useState(() =>
    produtos
      .filter((p) => p.novidade_ordem != null)
      .sort((a, b) => a.novidade_ordem - b.novidade_ordem || b.created_at.localeCompare(a.created_at))
      .map((p) => p.id),
  );
  const [novo, setNovo] = useState('');
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState(null);

  const cheio = ids.length >= MAX_VITRINE;
  const disponiveis = produtos.filter((p) => p.ativo && !ids.includes(p.id));

  function adicionar() {
    if (!novo || cheio) return;
    setIds([...ids, novo]);
    setNovo('');
    setMsg(null);
  }

  async function salvar() {
    setSalvando(true);
    setMsg(null);
    const supabase = createClient();
    const mudancas = produtos
      .map((p) => ({ id: p.id, de: p.novidade_ordem, para: ids.includes(p.id) ? ids.indexOf(p.id) + 1 : null }))
      .filter((m) => m.de !== m.para);
    const resultados = await Promise.all(
      mudancas.map((m) => supabase.from('produtos').update({ novidade_ordem: m.para }).eq('id', m.id)),
    );
    setSalvando(false);
    if (resultados.some((r) => r.error)) {
      setMsg({ erro: true, texto: 'Não foi possível salvar tudo. Tente salvar de novo.' });
      return;
    }
    setMsg({ erro: false, texto: 'Salvo.' });
    router.refresh();
  }

  return (
    <div>
      <p className={styles.ajuda}>
        Estes produtos aparecem na seção Novidades da home, nesta ordem (até {MAX_VITRINE}).
        {ids.length === 0 && ` Nenhum produto escolhido: a home mostra os ${MAX_VITRINE} mais recentes.`}
      </p>

      {ids.length > 0 && (
        <ol className={styles.lista}>
          {ids.map((id, i) => {
            const p = porId.get(id);
            return (
              <li key={id} className={styles.item}>
                <span className={styles.posicao}>{i + 1}</span>
                <span className={styles.nome}>
                  {p.nome}
                  {!p.ativo && <span className={styles.aviso}> — inativo, não aparece na home</span>}
                </span>
                <span className={styles.acoes}>
                  <button type="button" className={styles.botao} disabled={i === 0} onClick={() => setIds(mover(ids, i, -1))}>
                    Subir
                  </button>
                  <button
                    type="button"
                    className={styles.botao}
                    disabled={i === ids.length - 1}
                    onClick={() => setIds(mover(ids, i, 1))}
                  >
                    Descer
                  </button>
                  <button type="button" className={styles.botao} onClick={() => setIds(ids.filter((x) => x !== id))}>
                    Remover
                  </button>
                </span>
              </li>
            );
          })}
        </ol>
      )}

      <div className={styles.adicionar}>
        <label className={styles.rotulo}>
          Adicionar produto
          <select className={styles.select} value={novo} onChange={(e) => setNovo(e.target.value)} disabled={cheio}>
            <option value="">Escolha…</option>
            {disponiveis.map((p) => (
              <option key={p.id} value={p.id}>
                {p.nome}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className={styles.botao} onClick={adicionar} disabled={!novo || cheio}>
          Adicionar
        </button>
        {cheio && <span className={styles.aviso}>Limite de {MAX_VITRINE} produtos.</span>}
      </div>

      <div className={styles.rodape}>
        <button type="button" className={styles.salvar} onClick={salvar} disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar'}
        </button>
        {msg && (
          <span className={msg.erro ? styles.erro : styles.ok} role="status">
            {msg.texto}
          </span>
        )}
      </div>
    </div>
  );
}
