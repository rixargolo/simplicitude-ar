'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { caminhoDaUrl, fotosDoProduto } from '@/lib/fotos';
import FotosProduto from './FotosProduto';
import styles from './ProdutoForm.module.css';

const BUCKET = 'produtos';

const EXTENSAO = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp' };

const urlPublica = (supabase, caminho) =>
  supabase.storage.from(BUCKET).getPublicUrl(caminho).data.publicUrl;

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
  // fotos: [{ chave, caminho?, arquivo?, url, foco_x, foco_y, zoom, alt }], a primeira é a principal
  const [fotosIniciais] = useState(() =>
    fotosDoProduto(produto, produto?.produto_imagens, (c) => urlPublica(createClient(), c)).map((f) => ({
      ...f,
      chave: f.caminho ?? 'legado',
    })),
  );
  const [fotos, setFotos] = useState(fotosIniciais);
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

      await salvarFotos(supabase, produtoId, fotos, fotosIniciais, produto);

      router.push('/admin/produtos');
      router.refresh();
    } catch (err) {
      console.error(err);
      setErro('Não foi possível salvar o produto. Tente novamente.');
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

      <FotosProduto fotos={fotos} onChange={setFotos} nomeProduto={nome} />

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

// Grava as fotos do produto, em ordem segura (nunca apontar para arquivo apagado):
// 1) envia os arquivos novos para {id}/{uuid}.{ext}; 2) grava/ordena as linhas de produto_imagens e
// apaga as das fotos excluídas; 3) atualiza a cópia da principal em produtos (imagem_url e foco/zoom,
// que o card da home/loja e a branch main leem); 4) só então remove do Storage os arquivos excluídos
// (se falhar, sobra um arquivo órfão, nunca um card quebrado).
// shortcut: se o passo 3 falhar, as linhas já gravadas ficam e um novo "Salvar" reenvia as fotos novas
// (sobram linhas/arquivos extras); upgrade: RPC transacional se isso incomodar.
async function salvarFotos(supabase, produtoId, fotos, fotosIniciais, produtoAtual) {
  const enviados = [];
  let prontas;
  try {
    prontas = [];
    for (const foto of fotos) {
      if (!foto.arquivo) {
        prontas.push(foto);
        continue;
      }
      const caminho = `${produtoId}/${crypto.randomUUID()}.${EXTENSAO[foto.arquivo.type]}`;
      const { error } = await supabase.storage
        .from(BUCKET)
        .upload(caminho, foto.arquivo, { cacheControl: '31536000' }); // nome único: cache longo é seguro
      if (error) throw new Error(`Produto salvo, mas o envio de uma foto falhou: ${error.message}`);
      enviados.push(caminho);
      prontas.push({ ...foto, caminho, url: urlPublica(supabase, caminho) });
    }

    const linhas = prontas
      .map((f, ordem) => ({
        produto_id: produtoId,
        caminho: f.caminho,
        ordem,
        foco_x: f.foco_x,
        foco_y: f.foco_y,
        zoom: f.zoom,
        alt: f.alt?.trim() || null,
      }))
      .filter((l) => l.caminho);
    if (linhas.length > 0) {
      const { error } = await supabase
        .from('produto_imagens')
        .upsert(linhas, { onConflict: 'produto_id,caminho' });
      if (error) throw new Error(`Produto salvo, mas não foi possível gravar as fotos: ${error.message}`);
    }
  } catch (err) {
    if (enviados.length > 0) await supabase.storage.from(BUCKET).remove(enviados);
    throw err;
  }

  const mantidos = new Set(prontas.map((f) => f.caminho).filter(Boolean));
  const removidos = fotosIniciais.map((f) => f.caminho).filter((c) => c && !mantidos.has(c));

  if (removidos.length > 0) {
    const { error } = await supabase
      .from('produto_imagens')
      .delete()
      .eq('produto_id', produtoId)
      .in('caminho', removidos);
    if (error) throw new Error(`Fotos salvas, mas não foi possível remover as excluídas: ${error.message}`);
  }

  const principal = prontas[0];
  if (principal || fotosIniciais.length > 0) {
    const mantemUrl = principal && caminhoDaUrl(produtoAtual?.imagem_url) === principal.caminho;
    const { error } = await supabase
      .from('produtos')
      .update({
        imagem_url: principal ? (mantemUrl ? produtoAtual.imagem_url : principal.url) : null,
        imagem_foco_x: principal?.foco_x ?? 50,
        imagem_foco_y: principal?.foco_y ?? 50,
        imagem_zoom: principal?.zoom ?? 100,
      })
      .eq('id', produtoId);
    if (error) throw new Error(`Fotos salvas, mas não foi possível atualizar a principal: ${error.message}`);
  }

  if (removidos.length > 0) {
    const { error } = await supabase.storage.from(BUCKET).remove(removidos);
    if (error) console.error('Fotos excluídas continuam no Storage:', error.message);
  }
}
