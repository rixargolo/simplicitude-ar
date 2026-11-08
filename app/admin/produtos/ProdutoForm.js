'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { slugify, slugValido } from '@/lib/produtos';
import { caminhoDaUrl, fotosDoProduto } from '@/lib/fotos';
import FotosProduto from './FotosProduto';
import BarraFormatacao from '../BarraFormatacao';
import TraducaoEn, { salvarTraducao, traducaoEnInicial } from '../TraducaoEn';
import styles from './ProdutoForm.module.css';

const BUCKET = 'produtos';

const LIMITE_DESCRICAO_CURTA = 120; // mesmo limite do check no banco (X13)

// Campos da seção "English (opcional)" do produto (X13), em produto_traducoes.
const CAMPOS_EN = [
  { chave: 'nome', rotulo: 'Name' },
  { chave: 'descricao_curta', rotulo: 'Short description', maxLength: LIMITE_DESCRICAO_CURTA },
  { chave: 'descricao', rotulo: 'Long description', multilinha: true, formatado: true },
  { chave: 'ingredientes', rotulo: 'Ingredients', multilinha: true },
  { chave: 'titulo_meditacao', rotulo: 'Meditation title' }, // só aparece com "Possui meditação" (X20)
];

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

export default function ProdutoForm({ mode, produto, colecoes, categorias, tags }) {
  const router = useRouter();

  const [nome, setNome] = useState(produto?.nome ?? '');
  // Endereço (slug): na criação acompanha o nome até ser editado à mão; na edição nunca acompanha (X8).
  const [slug, setSlug] = useState(produto?.slug ?? '');
  const [slugTocado, setSlugTocado] = useState(false);
  const [origem, setOrigem] = useState('');
  useEffect(() => setOrigem(window.location.origin), []);
  const [descricao, setDescricao] = useState(produto?.descricao ?? '');
  // `atributos` (coluna antiga) não é editado aqui: a main ainda o usa e a v1 não o grava (X13)
  const [descricaoCurta, setDescricaoCurta] = useState(produto?.descricao_curta ?? '');
  const [ingredientes, setIngredientes] = useState(produto?.ingredientes ?? '');
  const [tagIds, setTagIds] = useState(() => new Set(produto?.produto_tags?.map((pt) => pt.tag_id) ?? []));
  const alternarTag = (id) =>
    setTagIds((atual) => {
      const novo = new Set(atual);
      if (!novo.delete(id)) novo.add(id);
      return novo;
    });
  const [en, setEn] = useState(() => traducaoEnInicial(produto?.produto_traducoes, CAMPOS_EN));
  const existiaEn = Boolean(produto?.produto_traducoes?.some((t) => t.idioma === 'en'));
  const [pesoGramas, setPesoGramas] = useState(
    produto?.peso_gramas != null ? String(produto.peso_gramas) : '',
  );
  const [preco, setPreco] = useState(
    produto?.preco_centavos != null
      ? (produto.preco_centavos / 100).toFixed(2).replace('.', ',')
      : '',
  );
  // Coleções (X12, M:N): ids marcados. Grupos por categoria na ordem do admin; a 1ª marcada nessa ordem
  // vira produtos.colecao_id (cópia que o admin da main lê).
  const [colecaoIds, setColecaoIds] = useState(
    () => new Set(produto?.produto_colecoes?.map((pc) => pc.colecao_id) ?? []),
  );
  const gruposColecoes = categorias
    .map((c) => ({ categoria: c, colecoes: colecoes.filter((x) => x.categoria_id === c.id) }))
    .filter((g) => g.colecoes.length > 0);
  const colecoesNaOrdem = gruposColecoes.flatMap((g) => g.colecoes);
  const alternarColecao = (id) =>
    setColecaoIds((atual) => {
      const novo = new Set(atual);
      if (!novo.delete(id)) novo.add(id);
      return novo;
    });
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
  const [tituloMeditacao, setTituloMeditacao] = useState(produto?.titulo_meditacao ?? '');
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
    if (!slugValido(slug)) {
      setErro('Endereço inválido: use só letras minúsculas sem acento, números e hífen (até 80 caracteres).');
      return;
    }
    if (Number.isNaN(centavos) || centavos <= 0) {
      setErro('Informe um preço válido, ex.: 10,00.');
      return;
    }

    setSalvando(true);
    const supabase = createClient();

    const idsColecoes = colecoesNaOrdem.map((c) => c.id).filter((id) => colecaoIds.has(id));

    const payload = {
      nome: nome.trim(),
      slug,
      descricao: descricao.trim() || null,
      descricao_curta: descricaoCurta.trim() || null,
      ingredientes: ingredientes.trim() || null,
      peso_gramas: pesoGramas ? Number(pesoGramas) : null,
      preco_centavos: centavos,
      colecao_id: idsColecoes[0] ?? null,
      categoria_id: categoriaId || null,
      mostrar_categoria_no_titulo: mostrarCategoriaNoTitulo,
      tem_meditacao: temMeditacao,
      audio_url: temMeditacao ? audioUrl.trim() || null : null,
      titulo_meditacao: temMeditacao ? tituloMeditacao.trim() || null : null,
      ativo,
    };

    try {
      const produtoId =
        mode === 'create'
          ? await criarProduto(supabase, payload)
          : await atualizarProduto(supabase, produto.id, payload);

      // depois do update de produtos: o trigger de colecao_id mexe nos pares, e aqui o conjunto final vence
      await salvarVinculos(supabase, 'produto_colecoes', 'colecao_id', produtoId, idsColecoes, 'as coleções');
      await salvarVinculos(supabase, 'produto_tags', 'tag_id', produtoId, [...tagIds], 'as tags');
      const enSalvar = temMeditacao ? en : { ...en, titulo_meditacao: '' };
      await salvarTraducao(supabase, 'produto_traducoes', 'produto_id', produtoId, enSalvar, existiaEn);
      await salvarFotos(supabase, produtoId, fotos, fotosIniciais, produto);

      router.push('/admin/produtos');
      router.refresh();
    } catch (err) {
      console.error(err);
      setErro(
        err.code === '23505'
          ? 'Esse endereço já é (ou já foi) de outro produto. Escolha outro.'
          : err.exibir
            ? err.message
            : 'Não foi possível salvar o produto. Tente novamente.',
      );
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
          onChange={(e) => {
            setNome(e.target.value);
            if (mode === 'create' && !slugTocado) setSlug(slugify(e.target.value));
          }}
          required
        />
      </label>

      <div className={styles.field}>
        <label htmlFor="produto-slug" className={styles.label}>Endereço na loja</label>
        <input
          id="produto-slug"
          className={styles.input}
          type="text"
          value={slug}
          onChange={(e) => {
            setSlug(e.target.value);
            setSlugTocado(true);
          }}
          onBlur={() => setSlug(slugify(slug))}
          aria-describedby="slug-ajuda"
          autoCapitalize="none"
          spellCheck={false}
          required
        />
        <span id="slug-ajuda" className={styles.ajuda}>
          {origem}/loja/<strong>{slug || '…'}</strong>
        </span>
        {mode === 'edit' && (
          <span className={styles.ajuda}>
            Mudar o nome do produto não muda o endereço.
          </span>
        )}
        {mode === 'edit' && slug !== produto.slug && (
          <span className={styles.aviso} role="status">
            Atenção: mudar o endereço pode afetar links já compartilhados (Instagram, QR codes,
            WhatsApp). O endereço antigo, /loja/{produto.slug}, continua funcionando e leva ao novo,
            mas não poderá ser usado por outro produto.
          </span>
        )}
      </div>

      <div className={styles.field}>
        <label htmlFor="produto-descricao-curta" className={styles.label}>Descrição curta</label>
        <input
          id="produto-descricao-curta"
          className={styles.input}
          type="text"
          value={descricaoCurta}
          onChange={(e) => setDescricaoCurta(e.target.value)}
          maxLength={LIMITE_DESCRICAO_CURTA}
          aria-describedby="descricao-curta-ajuda"
        />
        <span id="descricao-curta-ajuda" className={styles.ajuda}>
          Até {LIMITE_DESCRICAO_CURTA} caracteres ({descricaoCurta.length}/{LIMITE_DESCRICAO_CURTA}); aparece no
          card e abaixo do nome.
        </span>
      </div>

      <div className={styles.field}>
        <label htmlFor="produto-descricao" className={styles.label}>Descrição longa</label>
        <BarraFormatacao id="produto-descricao" className={styles.textarea} value={descricao} onChange={setDescricao} />
      </div>

      <div className={styles.field}>
        <label htmlFor="produto-ingredientes" className={styles.label}>Ingredientes</label>
        <textarea
          id="produto-ingredientes"
          className={styles.textarea}
          value={ingredientes}
          onChange={(e) => setIngredientes(e.target.value)}
          rows={3}
        />
      </div>

      <TraducaoEn
        valores={en}
        onChange={setEn}
        campos={temMeditacao ? CAMPOS_EN : CAMPOS_EN.filter((c) => c.chave !== 'titulo_meditacao')}
      />

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

      <div className={styles.field}>
        <span className={styles.label}>Coleções</span>
        {gruposColecoes.length === 0 && <span className={styles.ajuda}>Nenhuma coleção cadastrada.</span>}
        {gruposColecoes.map(({ categoria, colecoes: lista }) => (
          <fieldset key={categoria.id} className={styles.grupo}>
            <legend className={styles.ajuda}>{categoria.nome}</legend>
            {lista.map((colecao) => (
              <label key={colecao.id} className={styles.checkboxField}>
                <input
                  type="checkbox"
                  checked={colecaoIds.has(colecao.id)}
                  onChange={() => alternarColecao(colecao.id)}
                />
                <span>{colecao.nome}</span>
              </label>
            ))}
          </fieldset>
        ))}
      </div>

      <div className={styles.field}>
        <span className={styles.label}>Tags</span>
        {tags.length === 0 && <span className={styles.ajuda}>Nenhuma tag cadastrada (Admin → Tags).</span>}
        {tags.length > 0 && (
          <fieldset className={styles.grupo}>
            <legend className={styles.ajuda}>Marque as que se aplicam</legend>
            {tags.map((tag) => (
              <label key={tag.id} className={styles.checkboxField}>
                <input type="checkbox" checked={tagIds.has(tag.id)} onChange={() => alternarTag(tag.id)} />
                <span>{tag.nome}</span>
              </label>
            ))}
          </fieldset>
        )}
      </div>

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
        <>
          <div className={styles.field}>
            <label htmlFor="produto-titulo-meditacao" className={styles.label}>Título da meditação</label>
            <input
              id="produto-titulo-meditacao"
              className={styles.input}
              type="text"
              value={tituloMeditacao}
              onChange={(e) => setTituloMeditacao(e.target.value)}
              aria-describedby="titulo-meditacao-ajuda"
            />
            <span id="titulo-meditacao-ajuda" className={styles.ajuda}>
              Aparece em /meditacao no lugar do nome do produto. Vazio = usa o nome do produto.
            </span>
          </div>

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
        </>
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

  if (error) throw Object.assign(new Error(error.message), { code: error.code });
  return data.id;
}

// Atualiza os campos de um produto existente e retorna o id.
async function atualizarProduto(supabase, id, payload) {
  const { error } = await supabase
    .from('produtos')
    .update(payload)
    .eq('id', id);

  if (error) throw Object.assign(new Error(error.message), { code: error.code });
  return id;
}

// Deixa na tabela de ligação (produto_colecoes, produto_tags) exatamente os ids marcados, na coluna `coluna`:
// apaga os desmarcados e insere os novos. `rotulo` entra na mensagem de erro.
async function salvarVinculos(supabase, tabela, coluna, produtoId, ids, rotulo) {
  const falha = (e) =>
    Object.assign(new Error(`Produto salvo, mas não foi possível gravar ${rotulo}: ${e.message}`), { exibir: true });
  const apagar = supabase.from(tabela).delete().eq('produto_id', produtoId);
  const { error: erroApagar } = await (ids.length > 0 ? apagar.not(coluna, 'in', `(${ids.join(',')})`) : apagar);
  if (erroApagar) throw falha(erroApagar);
  if (ids.length === 0) return;
  const { error } = await supabase
    .from(tabela)
    .upsert(ids.map((id) => ({ produto_id: produtoId, [coluna]: id })), { onConflict: `produto_id,${coluna}`, ignoreDuplicates: true });
  if (error) throw falha(error);
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
