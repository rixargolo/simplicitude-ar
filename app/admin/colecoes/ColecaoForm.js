'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { slugify, slugDoEndereco, slugValido } from '@/lib/produtos';
import CampoSlug from '../CampoSlug';
import TraducaoEn, { salvarTraducao, traducaoEnInicial } from '../TraducaoEn';
import styles from '../categorias/CategoriaForm.module.css';

// Criar/editar coleção (X12). Coleção pertence a uma categoria; a ordem é feita na lista (OrdemColecoes),
// e coleção nova entra com ordem null, ou seja, no fim da categoria.
export default function ColecaoForm({ mode, colecao, categorias }) {
  const router = useRouter();

  const [nome, setNome] = useState(colecao?.nome ?? '');
  const [slug, setSlug] = useState(colecao?.slug ?? '');
  const [categoriaId, setCategoriaId] = useState(colecao?.categoria_id ?? '');
  const [descricao, setDescricao] = useState(colecao?.descricao ?? '');
  const [en, setEn] = useState(() => traducaoEnInicial(colecao?.colecao_traducoes));
  const existiaEn = Boolean(colecao?.colecao_traducoes?.some((t) => t.idioma === 'en'));
  const [idCriado, setIdCriado] = useState(null); // criada, mas a tradução falhou: o próximo Salvar atualiza
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setErro('');

    if (!nome.trim()) {
      setErro('Informe o nome da coleção.');
      return;
    }
    if (!categoriaId) {
      setErro('Escolha a categoria da coleção.');
      return;
    }
    const slugFinal = slug.trim() ? slugDoEndereco(slug, 'colecao') : slugify(nome);
    if (!slugValido(slugFinal)) {
      setErro('Endereço inválido: use só a parte final, com letras minúsculas sem acento, números e hífen (até 80 caracteres).');
      return;
    }

    setSalvando(true);
    const supabase = createClient();
    const payload = {
      nome: nome.trim(),
      slug: slugFinal,
      categoria_id: categoriaId,
      descricao: descricao.trim() || null,
    };

    try {
      let id = colecao?.id ?? idCriado;
      if (id) {
        const { error } = await supabase.from('colecoes').update(payload).eq('id', id);
        if (error) throw Object.assign(new Error(error.message), { code: error.code });
      } else {
        const { data, error } = await supabase.from('colecoes').insert(payload).select('id').single();
        if (error) throw Object.assign(new Error(error.message), { code: error.code });
        id = data.id;
        setIdCriado(id);
      }

      await salvarTraducao(supabase, 'colecao_traducoes', 'colecao_id', id, en, existiaEn);

      router.push('/admin/colecoes');
      router.refresh();
    } catch (err) {
      console.error(err);
      setErro(
        err.code === '23505'
          ? 'Já existe uma coleção com esse endereço.'
          : err.exibir
            ? err.message
            : 'Não foi possível salvar a coleção. Tente novamente.',
      );
      setSalvando(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h1 className={styles.title}>{mode === 'create' ? 'Nova coleção' : `Editar — ${colecao.nome}`}</h1>

      <label className={styles.field}>
        <span className={styles.label}>Nome</span>
        <input className={styles.input} type="text" value={nome} onChange={(e) => setNome(e.target.value)} required />
      </label>

      <CampoSlug
        id="colecao-slug"
        tipo="colecao"
        value={slug}
        onChange={setSlug}
        sugestao={slugify(nome)}
        avisoEdicao={
          mode === 'edit' &&
          `Atenção: mudar o endereço faz os links antigos (?colecao=${colecao.slug}) mostrarem a loja inteira em vez desta coleção. Não há redirecionamento.`
        }
      />

      <label className={styles.field}>
        <span className={styles.label}>Categoria</span>
        <select className={styles.input} value={categoriaId} onChange={(e) => setCategoriaId(e.target.value)} required>
          <option value="">Escolha…</option>
          {categorias.map((c) => (
            <option key={c.id} value={c.id}>
              {c.nome}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Descrição</span>
        <textarea className={styles.textarea} value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={4} />
      </label>

      <TraducaoEn valores={en} onChange={setEn} />

      {erro && <p className={styles.erro}>{erro}</p>}

      <div className={styles.actions}>
        <button className={styles.cta} type="submit" disabled={salvando}>
          {salvando ? 'Salvando...' : 'Salvar'}
        </button>
      </div>
    </form>
  );
}
