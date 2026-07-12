'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import styles from './ProdutoForm.module.css';

const BUCKET = 'produtos';

// Extensão do arquivo escolhido pelo usuário (ex.: "jpg", "png").
function extensaoDoArquivo(file) {
  const partes = file.name.split('.');
  return partes.length > 1 ? partes.pop().toLowerCase() : 'jpg';
}

// Extensão atual da imagem de um produto, lida a partir de imagem_url
// (ignora query string, ex. "?v=169..." usado para furar cache).
function extensaoDaUrl(url) {
  if (!url) return null;
  try {
    const { pathname } = new URL(url);
    const partes = pathname.split('.');
    return partes.length > 1 ? partes.pop().toLowerCase() : null;
  } catch {
    return null;
  }
}

// Converte um texto de preço em reais (ex. "10,00" ou "10.00") para
// centavos (inteiro). Retorna NaN se o texto não for um número válido.
function precoParaCentavos(texto) {
  const normalizado = texto.trim().replace(',', '.');
  const valor = Number(normalizado);
  if (Number.isNaN(valor)) return NaN;
  return Math.round(valor * 100);
}

export default function ProdutoForm({ mode, produto, colecoes, categorias }) {
  const router = useRouter();

  const [nome, setNome] = useState(produto?.nome ?? '');
  const [descricao, setDescricao] = useState(produto?.descricao ?? '');
  const [atributos, setAtributos] = useState(produto?.atributos ?? '');
  const [pesoGramas, setPesoGramas] = useState(
    produto?.peso_gramas != null ? String(produto.peso_gramas) : '',
  );
  const [preco, setPreco] = useState(
    produto?.preco_centavos != null
      ? (produto.preco_centavos / 100).toFixed(2).replace('.', ',')
      : '',
  );
  const [colecaoId, setColecaoId] = useState(produto?.colecao_id ?? '');
  const [categoriaId, setCategoriaId] = useState(
    produto?.categoria_id ?? '',
  );
  const [mostrarCategoriaNoTitulo, setMostrarCategoriaNoTitulo] = useState(
    produto?.mostrar_categoria_no_titulo ?? false,
  );
  const [temMeditacao, setTemMeditacao] = useState(
    produto?.tem_meditacao ?? false,
  );
  const [audioUrl, setAudioUrl] = useState(produto?.audio_url ?? '');
  const [ativo, setAtivo] = useState(produto?.ativo ?? true);
  const [arquivo, setArquivo] = useState(null);
  const [erro, setErro] = useState('');
  const [salvando, setSalvando] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    setErro('');

    const centavos = precoParaCentavos(preco);
    if (!nome.trim()) {
      setErro('Informe o nome do produto.');
      return;
    }
    if (Number.isNaN(centavos) || centavos <= 0) {
      setErro('Informe um preço válido, ex.: 10,00.');
      return;
    }

    setSalvando(true);
    const supabase = createClient();

    const payload = {
      nome: nome.trim(),
      descricao: descricao.trim() || null,
      atributos: atributos.trim() || null,
      peso_gramas: pesoGramas ? Number(pesoGramas) : null,
      preco_centavos: centavos,
      colecao_id: colecaoId || null,
      categoria_id: categoriaId || null,
      mostrar_categoria_no_titulo: mostrarCategoriaNoTitulo,
      tem_meditacao: temMeditacao,
      audio_url: temMeditacao ? audioUrl.trim() || null : null,
      ativo,
    };

    try {
      const produtoId =
        mode === 'create'
          ? await criarProduto(supabase, payload)
          : await atualizarProduto(supabase, produto.id, payload);

      if (arquivo) {
        await enviarImagemPrincipal(supabase, produtoId, arquivo, produto);
      }

      router.push('/admin/produtos');
      router.refresh();
    } catch (err) {
      setErro(err.message || 'Não foi possível salvar o produto.');
      setSalvando(false);
    }
  }

  return (
    <form className={styles.form} onSubmit={handleSubmit}>
      <h1 className={styles.title}>
        {mode === 'create' ? 'Novo produto' : `Editar — ${produto.nome}`}
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
        <span className={styles.label}>Descrição</span>
        <textarea
          className={styles.textarea}
          value={descricao}
          onChange={(e) => setDescricao(e.target.value)}
          rows={4}
        />
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Atributos</span>
        <input
          className={styles.input}
          type="text"
          value={atributos}
          onChange={(e) => setAtributos(e.target.value)}
          placeholder="Ex.: Intenso | 62% cacau | Laranja & Cardamomo"
        />
      </label>

      <div className={styles.row}>
        <label className={styles.field}>
          <span className={styles.label}>Peso (gramas)</span>
          <input
            className={styles.input}
            type="number"
            min="0"
            value={pesoGramas}
            onChange={(e) => setPesoGramas(e.target.value)}
          />
        </label>

        <label className={styles.field}>
          <span className={styles.label}>Preço (R$)</span>
          <input
            className={styles.input}
            type="text"
            inputMode="decimal"
            value={preco}
            onChange={(e) => setPreco(e.target.value)}
            placeholder="10,00"
            required
          />
        </label>
      </div>

      <label className={styles.field}>
        <span className={styles.label}>Coleção</span>
        <select
          className={styles.input}
          value={colecaoId}
          onChange={(e) => setColecaoId(e.target.value)}
        >
          <option value="">Sem coleção</option>
          {colecoes.map((colecao) => (
            <option key={colecao.id} value={colecao.id}>
              {colecao.nome}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Categoria</span>
        <select
          className={styles.input}
          value={categoriaId}
          onChange={(e) => setCategoriaId(e.target.value)}
        >
          <option value="">Sem categoria</option>
          {categorias.map((categoria) => (
            <option key={categoria.id} value={categoria.id}>
              {categoria.nome}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.checkboxField}>
        <input
          type="checkbox"
          checked={mostrarCategoriaNoTitulo}
          onChange={(e) => setMostrarCategoriaNoTitulo(e.target.checked)}
        />
        <span>Mostrar categoria no título do produto</span>
      </label>

      <label className={styles.checkboxField}>
        <input
          type="checkbox"
          checked={temMeditacao}
          onChange={(e) => setTemMeditacao(e.target.checked)}
        />
        <span>Possui meditação guiada</span>
      </label>

      {temMeditacao && (
        <label className={styles.field}>
          <span className={styles.label}>URL do áudio</span>
          <input
            className={styles.input}
            type="text"
            value={audioUrl}
            onChange={(e) => setAudioUrl(e.target.value)}
            placeholder="https://.../meditacao/alegria.mp3"
          />
        </label>
      )}

      <label className={styles.checkboxField}>
        <input
          type="checkbox"
          checked={ativo}
          onChange={(e) => setAtivo(e.target.checked)}
        />
        <span>Ativo (visível na loja)</span>
      </label>

      <label className={styles.field}>
        <span className={styles.label}>Imagem principal</span>
        {produto?.imagem_url && (
          <div className={styles.imgPreviewWrap}>
            <Image
              src={produto.imagem_url}
              alt={produto.nome}
              fill
              sizes="96px"
              className={styles.imgPreview}
            />
          </div>
        )}
        <input
          className={styles.inputFile}
          type="file"
          accept="image/*"
          onChange={(e) => setArquivo(e.target.files?.[0] ?? null)}
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

// Insere o produto e retorna o id gerado.
async function criarProduto(supabase, payload) {
  const { data, error } = await supabase
    .from('produtos')
    .insert(payload)
    .select('id')
    .single();

  if (error) throw new Error(error.message);
  return data.id;
}

// Atualiza os campos de um produto existente e retorna o id.
async function atualizarProduto(supabase, id, payload) {
  const { error } = await supabase
    .from('produtos')
    .update(payload)
    .eq('id', id);

  if (error) throw new Error(error.message);
  return id;
}

// Envia a imagem principal para o Storage no caminho {id}/principal.{ext},
// remove o arquivo antigo se a extensão mudou, e grava a URL pública em
// imagem_url (com cache-buster ao sobrescrever).
async function enviarImagemPrincipal(supabase, produtoId, arquivo, produtoAtual) {
  const ext = extensaoDoArquivo(arquivo);
  const caminho = `${produtoId}/principal.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(caminho, arquivo, { upsert: true, cacheControl: '3600' });

  if (uploadError) {
    throw new Error(
      `Produto salvo, mas o upload da imagem falhou: ${uploadError.message}`,
    );
  }

  const extAntiga = extensaoDaUrl(produtoAtual?.imagem_url);
  if (extAntiga && extAntiga !== ext) {
    await supabase.storage
      .from(BUCKET)
      .remove([`${produtoId}/principal.${extAntiga}`]);
  }

  const { data: publicUrlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(caminho);

  const imagemUrl = `${publicUrlData.publicUrl}?v=${Date.now()}`;

  const { error: updateError } = await supabase
    .from('produtos')
    .update({ imagem_url: imagemUrl })
    .eq('id', produtoId);

  if (updateError) {
    throw new Error(
      `Imagem enviada, mas não foi possível salvar a URL: ${updateError.message}`,
    );
  }
}
