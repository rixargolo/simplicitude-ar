import { supabase } from './supabase';
import { CRITERIO_VITRINE, CRITERIOS_VITRINE, MAX_VITRINE } from './vitrine';
import { fotosDoProduto } from './fotos';

// Slug da coleção que leva à meditação (X19): usado pelo link da home e da /meditacao.
export const COLECAO_MEDITACAO = 'inspirar';

// Normaliza o nome de um produto em slug de URL:
// minúsculas, sem acento, espaços/caracteres especiais viram hífen.
// Ex.: "Esperança" -> "esperanca"
export function slugify(nome) {
  return nome
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '') // remove marcas de acentuação
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-') // não-alfanumérico vira hífen
    .replace(/^-+|-+$/g, ''); // remove hífens das pontas
}

// Onde fica o slug no endereço público de cada tipo; tag ainda não tem endereço público.
const SLUG_NO_ENDERECO = {
  produto: /\/loja\/([^/?#]+)/,
  categoria: /[?&]categoria=([^&#]+)/,
  colecao: /[?&]colecao=([^&#]+)/,
};

// Campo de endereço do admin: texto comum vira slug; link colado (qualquer domínio) fica só com o slug do tipo,
// ou '' se o link não tem o endereço desse tipo.
export function slugDoEndereco(texto, tipo) {
  const t = texto.trim();
  if (!/[/?#&=]/.test(t)) return slugify(t);
  const achado = SLUG_NO_ENDERECO[tipo]?.exec(t);
  return achado ? slugify(achado[1]) : '';
}

// Busca todos os produtos ativos, ordenados por nome. Inclui nome e slug da
// categoria (via join em categoria_id) para rotuloCategoria() e para o filtro da /loja, e as coleções
// do produto (produto_colecoes, X12) para os carrosséis por coleção da /loja (X14).
export async function getProdutos() {
  const { data, error } = await supabase
    .from('produtos')
    .select('*, categorias(nome, slug), produto_colecoes(colecao_id)')
    .eq('ativo', true)
    .order('nome', { ascending: true });

  if (error) throw error;

  return data ?? [];
}

// Produtos ativos para a busca (X16, lib/busca.js): só as colunas do CardProduto e dos campos pesquisados
// (nada de select('*'): a consulta roda a cada busca enviada).
export async function getProdutosBusca() {
  const { data, error } = await supabase
    .from('produtos')
    .select(
      'id, slug, nome, descricao, descricao_curta, ingredientes, preco_centavos, estoque, imagem_url, imagem_foco_x, imagem_foco_y, imagem_zoom, categorias(nome), tags(nome)',
    )
    .eq('ativo', true)
    .order('nome', { ascending: true });

  if (error) throw error;

  return data ?? [];
}

// Vitrine da home: produtos ativos na ordem do critério (lib/vitrine.js) e o título que
// deriva dele. created_at é desc (mais novo primeiro); as colunas curadas (novidade_ordem,
// destaque_ordem) são asc e só entram os produtos com valor. Curadoria vazia (nada marcado, ou os
// marcados estão inativos) cai em "recentes" para a home nunca ficar sem vitrine.
export async function getVitrine(criterio = CRITERIO_VITRINE, limite = MAX_VITRINE) {
  const curado = criterio.coluna !== 'created_at';
  let consulta = supabase.from('produtos').select('*, categorias(nome)').eq('ativo', true);
  if (curado) consulta = consulta.not(criterio.coluna, 'is', null);
  consulta = consulta.order(criterio.coluna, { ascending: curado });
  if (curado) consulta = consulta.order('created_at', { ascending: false }); // desempate

  const { data, error } = await consulta.limit(limite);
  // 42703 = coluna inexistente (SQL do X6 ainda não aplicado): a home não cai, usa os recentes
  if (error && !(curado && error.code === '42703')) throw error;

  if (curado && !data?.length) return getVitrine(CRITERIOS_VITRINE.recentes, limite);
  return { titulo: criterio.titulo, produtos: data ?? [] };
}

// Categorias que têm ao menos um produto ativo (chips da vitrine e GradeCategorias →
// /loja?categoria=slug). `total` = nº de produtos ativos. Inclui a foto (X7) e seu enquadramento.
export async function getCategoriasComProdutos() {
  const consulta = (colunas) =>
    supabase
      .from('categorias')
      .select(`${colunas}, produtos!inner(id)`)
      .eq('produtos.ativo', true)
      .order('nome', { ascending: true });

  let { data, error } = await consulta(
    'id, nome, slug, descricao, imagem_url, imagem_foco_x, imagem_foco_y, imagem_zoom',
  );
  // 42703 = coluna inexistente (SQL do X7 ainda não aplicado): a home e a loja não caem, só ficam sem foto
  if (error?.code === '42703') ({ data, error } = await consulta('id, nome, slug, descricao'));

  if (error) throw error;

  return (data ?? []).map(({ produtos, ...categoria }) => ({ ...categoria, total: produtos.length }));
}

// Coleções para a /loja (X14), na ordem do admin (`ordem`, null por último; desempate por nome).
// Quem usa filtra as que têm produto ativo (montarLoja).
export async function getColecoesPublicas() {
  const { data, error } = await supabase
    .from('colecoes')
    .select('id, nome, slug, descricao, ordem, categoria_id')
    .order('ordem', { ascending: true, nullsFirst: false })
    .order('nome', { ascending: true });

  if (error) throw error;

  return data ?? [];
}

// Monta a /loja (X14) a partir de ?categoria= e ?colecao= (slugs). Puro.
// `produtos` = getProdutos(), `categorias` = getCategoriasComProdutos() (só com produto ativo),
// `colecoes` = getColecoesPublicas(). Slug desconhecido, ausente, vazio ou repetido (?x=a&x=b chega como
// array) é ignorado e cai em "Todas"; coleção sem produto ativo conta como desconhecida, e coleção válida
// vence categoria. Devolve:
//  - categoria / colecao: as ativas (a coleção ativa traz a categoria dela, se ela estiver em `categorias`);
//  - colecoesDaCategoria: coleções com produto da categoria ativa (2ª fileira de chips);
//  - secoes: [{ categoria|null, listas: [{ colecao|null, produtos }] }] — um carrossel por lista. Dentro da
//    categoria só entram produtos DA categoria (um produto aparece em uma só seção); a lista `colecao: null` é o
//    "resto" e só existe se sobrar produto. Produto sem categoria vai para uma seção final `categoria: null`
//    (só em "Todas");
//  - grade: com no máximo uma lista (ou coleção ativa) vira a grade de produtos, `[]` se vazio; senão `null`.
export function montarLoja(produtos, categorias, colecoes, { categoria, colecao } = {}) {
  const slugDe = (v) => (typeof v === 'string' ? v : null);
  const naColecao = (p, c) => p.produto_colecoes?.some((pc) => pc.colecao_id === c.id);
  const comProduto = colecoes.filter((c) => produtos.some((p) => naColecao(p, c)));

  const colecaoAtiva = comProduto.find((c) => c.slug === slugDe(colecao)) ?? null;
  const categoriaAtiva = colecaoAtiva
    ? categorias.find((c) => c.id === colecaoAtiva.categoria_id) ?? null
    : categorias.find((c) => c.slug === slugDe(categoria)) ?? null;
  const colecoesDaCategoria = categoriaAtiva
    ? comProduto.filter((c) => c.categoria_id === categoriaAtiva.id)
    : [];
  const base = { categoria: categoriaAtiva, colecao: colecaoAtiva, colecoesDaCategoria };

  if (colecaoAtiva) {
    return { ...base, secoes: [], grade: produtos.filter((p) => naColecao(p, colecaoAtiva)) };
  }

  const secao = (cat) => {
    const doCat = produtos.filter((p) => p.categorias?.slug === cat.slug);
    const cols = comProduto.filter((c) => c.categoria_id === cat.id);
    const listas = cols
      .map((c) => ({ colecao: c, produtos: doCat.filter((p) => naColecao(p, c)) }))
      .filter((l) => l.produtos.length > 0);
    const resto = doCat.filter((p) => !cols.some((c) => naColecao(p, c)));
    if (resto.length > 0) listas.push({ colecao: null, produtos: resto });
    return { categoria: cat, listas };
  };

  const secoes = (categoriaAtiva ? [categoriaAtiva] : categorias).map(secao);
  const semCategoria = categoriaAtiva ? [] : produtos.filter((p) => !p.categorias?.slug);
  if (semCategoria.length > 0) secoes.push({ categoria: null, listas: [{ colecao: null, produtos: semCategoria }] });

  const comLista = secoes.filter((s) => s.listas.length > 0);
  const listas = comLista.flatMap((s) => s.listas);
  return { ...base, secoes: comLista, grade: listas.length <= 1 ? listas[0]?.produtos ?? [] : null };
}

// Rótulo de categoria a ser exibido antes do nome do produto (ex.:
// "Chocolate"), ou null quando nenhum rótulo deve aparecer. Só exibe algo
// quando o produto tem mostrar_categoria_no_titulo=true e uma categoria
// vinculada — não há mais fallback fixo.
export function rotuloCategoria(produto) {
  if (produto.mostrar_categoria_no_titulo && produto.categoria_id) {
    return produto.categorias?.nome ?? null;
  }
  return null;
}

// Fotos do produto em ordem (a primeira é a principal), para a galeria do A7:
// [{ caminho, url, alt, foco_x, foco_y, zoom }]. Usar com estiloFoto(foco_x, foco_y, zoom).
// Sem linhas em produto_imagens cai em produto.imagem_url (ver lib/fotos.js).
export async function getFotosDoProduto(produto) {
  const { data, error } = await supabase
    .from('produto_imagens')
    .select('caminho, ordem, foco_x, foco_y, zoom, alt, created_at')
    .eq('produto_id', produto.id);

  if (error) throw error;

  return fotosDoProduto(
    produto,
    data,
    (caminho) => supabase.storage.from('produtos').getPublicUrl(caminho).data.publicUrl,
  );
}

// Formato aceito para slug (produto e categoria); é a mesma regra do check no banco (X8).
export function slugValido(slug) {
  return typeof slug === 'string' && slug.length <= 80 && /^[a-z0-9]+(-[a-z0-9]+)*$/.test(slug);
}

// Busca um produto ativo pelo slug gravado em produtos.slug (fixo: editar o nome não o muda).
export async function getProdutoBySlug(slug) {
  const { data, error } = await supabase
    .from('produtos')
    .select('*, categorias(nome, slug), tags(nome)') // tags: N:N por produto_tags (X13)
    .eq('ativo', true)
    .eq('slug', slug)
    .order('nome', { referencedTable: 'tags', ascending: true })
    .maybeSingle();

  if (error) throw error;

  return data ?? null;
}

// Slug que um produto ativo tem HOJE, dado um slug antigo dele (produto_slugs guarda todos).
// null se o slug nunca existiu ou o produto está inativo. Usado para o redirect 308 de /loja/[slug].
export async function getSlugAtual(slugAntigo) {
  const { data, error } = await supabase
    .from('produto_slugs')
    .select('produtos!inner(slug)')
    .eq('slug', slugAntigo)
    .eq('produtos.ativo', true)
    .maybeSingle();

  if (error) throw error;

  return data?.produtos?.slug ?? null;
}
