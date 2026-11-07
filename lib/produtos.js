import { supabase } from './supabase';
import { CRITERIO_VITRINE, CRITERIOS_VITRINE, MAX_VITRINE } from './vitrine';
import { fotosDoProduto } from './fotos';

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

// Busca todos os produtos ativos, ordenados por nome. Inclui nome e slug da
// categoria (via join em categoria_id) para rotuloCategoria() e para o filtro da /loja.
export async function getProdutos() {
  const { data, error } = await supabase
    .from('produtos')
    .select('*, categorias(nome, slug)')
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
    'nome, slug, descricao, imagem_url, imagem_foco_x, imagem_foco_y, imagem_zoom',
  );
  // 42703 = coluna inexistente (SQL do X7 ainda não aplicado): a home e a loja não caem, só ficam sem foto
  if (error?.code === '42703') ({ data, error } = await consulta('nome, slug, descricao'));

  if (error) throw error;

  return (data ?? []).map(({ produtos, ...categoria }) => ({ ...categoria, total: produtos.length }));
}

// Filtro da /loja (?categoria=slug). `slug` desconhecido, ausente ou repetido
// (?categoria=a&categoria=b chega como array) vira "Todas": { ativa: null, produtos }
// com tudo. `categorias` = getCategoriasComProdutos(), então só categorias com produto ativo.
export function filtrarPorCategoria(produtos, categorias, slug) {
  const ativa = typeof slug === 'string' ? categorias.find((c) => c.slug === slug) ?? null : null;
  if (!ativa) return { ativa: null, produtos };
  return { ativa, produtos: produtos.filter((p) => p.categorias?.slug === ativa.slug) };
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
