'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { slugify } from '@/lib/produtos';
import styles from './CategoriaForm.module.css';

export default function CategoriaForm({ mode, categoria }) {
  const router = useRouter();

  const [nome, setNome] = useState(categoria?.nome ?? '');
  const [slug, setSlug] = useState(categoria?.slug ?? '');
  const [descricao, setDescricao] = useState(categoria?.descricao ?? '');
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setErro('');

    if (!nome.trim()) {
      setErro('Informe o nome da categoria.');
      return;
    }

    setSalvando(true);
    const supabase = createClient();

    const payload = {
      nome: nome.trim(),
      slug: slug.trim() || slugify(nome),
      descricao: descricao.trim() || null,
    };

    try {
      if (mode === 'create') {
        await criarCategoria(supabase, payload);
      } else {
        await atualizarCategoria(supabase, categoria.id, payload);
      }

      router.push('/admin/categorias');
      router.refresh();
    } catch (err) {
      console.error(err);
      setErro('Não foi possível salvar a categoria. Tente novamente.');
      setSalvando(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h1 className={styles.title}>
        {mode === 'create' ? 'Nova categoria' : `Editar — ${categoria.nome}`}
      </h1>

      <label className={styles.field}>
        <span className={styles.label}>Nome</span>
        <input
          className={styles.input}
          type="text"
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          required
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Slug</span>
        <input
          className={styles.input}
          type="text"
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder={nome ? slugify(nome) : 'gerado a partir do nome'}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Descrição</span>
        <textarea
          className={styles.textarea}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          rows={4}
        />
      </label>

      {erro && <p className={styles.erro}>{erro}</p>}

      <div className={styles.actions}>
        <button className={styles.cta} type="submit" disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  );
}

// Insere a categoria.
async function criarCategoria(supabase, payload) {
  const { error } = await supabase.from('categorias').insert(payload);
  if (error) throw new Error(error.message);
}

// Atualiza os campos de uma categoria existente.
async function atualizarCategoria(supabase, id, payload) {
  const { error } = await supabase
    .from('categorias')
    .update(payload)
    .eq('id', id);

  if (error) throw new Error(error.message);
}
