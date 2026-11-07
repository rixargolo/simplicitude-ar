'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { slugify, slugValido } from '@/lib/produtos';
import TraducaoEn, { salvarTraducao, traducaoEnInicial } from '../TraducaoEn';
import styles from '../categorias/CategoriaForm.module.css';

const CAMPOS_EN = [{ chave: 'nome', rotulo: 'Name' }];

// Criar/editar/excluir tag (X13). Excluir tira a tag de todos os produtos (cascade no banco).
export default function TagForm({ mode, tag }) {
  const router = useRouter();

  const [nome, setNome] = useState(tag?.nome ?? '');
  const [slug, setSlug] = useState(tag?.slug ?? '');
  const [en, setEn] = useState(() => traducaoEnInicial(tag?.tag_traducoes, CAMPOS_EN));
  const existiaEn = Boolean(tag?.tag_traducoes?.some((t) => t.idioma === 'en'));
  const [idCriado, setIdCriado] = useState(null); // criada, mas a tradução falhou: o próximo Salvar atualiza
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setErro('');

    if (!nome.trim()) {
      setErro('Informe o nome da tag.');
      return;
    }
    const slugFinal = slug.trim() || slugify(nome);
    if (!slugValido(slugFinal)) {
      setErro('Endereço inválido: use só letras minúsculas sem acento, números e hífen (até 80 caracteres).');
      return;
    }

    setSalvando(true);
    const supabase = createClient();
    const payload = { nome: nome.trim(), slug: slugFinal };

    try {
      let id = tag?.id ?? idCriado;
      if (id) {
        const { error } = await supabase.from('tags').update(payload).eq('id', id);
        if (error) throw Object.assign(new Error(error.message), { code: error.code });
      } else {
        const { data, error } = await supabase.from('tags').insert(payload).select('id').single();
        if (error) throw Object.assign(new Error(error.message), { code: error.code });
        id = data.id;
        setIdCriado(id);
      }

      await salvarTraducao(supabase, 'tag_traducoes', 'tag_id', id, en, existiaEn);

      router.push('/admin/tags');
      router.refresh();
    } catch (err) {
      console.error(err);
      setErro(
        err.code === '23505'
          ? 'Já existe uma tag com esse endereço.'
          : err.exibir
            ? err.message
            : 'Não foi possível salvar a tag. Tente novamente.',
      );
      setSalvando(false);
    }
  }

  async function excluir() {
    if (!window.confirm(`Excluir a tag "${tag.nome}"? Ela sai de todos os produtos. Isso não pode ser desfeito.`)) return;
    setErro('');
    setSalvando(true);
    const { error } = await createClient().from('tags').delete().eq('id', tag.id);
    if (error) {
      console.error(error);
      setErro('Não foi possível excluir a tag. Tente novamente.');
      setSalvando(false);
      return;
    }
    router.push('/admin/tags');
    router.refresh();
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h1 className={styles.title}>{mode === 'create' ? 'Nova tag' : `Editar — ${tag.nome}`}</h1>

      <label className={styles.field}>
        <span className={styles.label}>Nome</span>
        <input className={styles.input} type="text" value={nome} onChange={(e) => setNome(e.target.value)} required />
      </label>

      <div className={styles.field}>
        <label htmlFor="tag-slug" className={styles.label}>Endereço (slug)</label>
        <input
          id="tag-slug"
          className={styles.input}
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          onBlur={() => setSlug(slugify(slug))}
          placeholder={nome ? slugify(nome) : 'gerado a partir do nome'}
          autoCapitalize="none"
          spellCheck={false}
        />
      </div>

      <TraducaoEn valores={en} onChange={setEn} campos={CAMPOS_EN} />

      {erro && <p className={styles.erro}>{erro}</p>}

      <div className={styles.actions}>
        <button className={styles.cta} type="submit" disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      {mode === 'edit' && (
        <button type="button" className={styles.remover} onClick={excluir} disabled={salvando}>
          Excluir tag
        </button>
      )}
    </form>
  );
}
