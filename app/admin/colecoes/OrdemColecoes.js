'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { mover } from '@/lib/fotos';
import styles from '../novidades/novidades.module.css';

// Lista de coleções por categoria, com ordem (colecoes.ordem). Uma lista plana de ids, agrupada na tela por
// categoria; Subir/Descer só trocam com o vizinho da mesma categoria. Salvar grava ordem = posição no grupo
// (1, 2, …), só onde mudou — mesmo padrão da curadoria de Novidades.
export default function OrdemColecoes({ colecoes, categorias }) {
  const router = useRouter();
  const porId = new Map(colecoes.map((c) => [c.id, c]));
  const [ids, setIds] = useState(() =>
    categorias.flatMap((cat) => colecoes.filter((c) => c.categoria_id === cat.id).map((c) => c.id)),
  );
  const [salvando, setSalvando] = useState(false);
  const [msg, setMsg] = useState(null);

  const categoriaDe = (i) => porId.get(ids[i])?.categoria_id;
  const mudar = (i, delta) => {
    setIds(mover(ids, i, delta));
    setMsg(null);
  };

  async function salvar() {
    setSalvando(true);
    setMsg(null);
    const supabase = createClient();
    const contagem = new Map();
    const mudancas = ids
      .map((id) => {
        const c = porId.get(id);
        const para = (contagem.get(c.categoria_id) ?? 0) + 1;
        contagem.set(c.categoria_id, para);
        return { id, de: c.ordem, para };
      })
      .filter((m) => m.de !== m.para);
    const resultados = await Promise.all(
      mudancas.map((m) => supabase.from('colecoes').update({ ordem: m.para }).eq('id', m.id)),
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
      {categorias.map((cat) => {
        const doGrupo = ids.map((id, i) => ({ id, i })).filter(({ id }) => porId.get(id).categoria_id === cat.id);
        if (doGrupo.length === 0) return null;
        return (
          <section key={cat.id}>
            <h2 className={styles.grupo}>{cat.nome}</h2>
            <ol className={styles.lista}>
              {doGrupo.map(({ id, i }, posicao) => {
                const c = porId.get(id);
                return (
                  <li key={id} className={styles.item}>
                    <span className={styles.posicao}>{posicao + 1}</span>
                    <span className={styles.nome}>
                      {c.nome}
                      {c.colecao_traducoes.length > 0 && <span className={styles.aviso}> — EN ✓</span>}
                    </span>
                    <span className={styles.acoes}>
                      <button type="button" className={styles.botao} disabled={posicao === 0} onClick={() => mudar(i, -1)}>
                        Subir
                      </button>
                      <button
                        type="button"
                        className={styles.botao}
                        disabled={posicao === doGrupo.length - 1}
                        onClick={() => mudar(i, 1)}
                      >
                        Descer
                      </button>
                      <Link href={`/admin/colecoes/${id}/editar`} className={`${styles.botao} ${styles.link}`}>
                        Editar
                      </Link>
                    </span>
                  </li>
                );
              })}
            </ol>
          </section>
        );
      })}

      <div className={styles.rodape}>
        <button type="button" className={styles.salvar} onClick={salvar} disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar ordem'}
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
