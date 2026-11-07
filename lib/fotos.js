// Várias fotos por produto (tabela produto_imagens). A primeira por `ordem` é a principal.
// produtos.imagem_url / imagem_foco_x / imagem_foco_y / imagem_zoom seguem existindo como CÓPIA da
// principal (o card da home/loja e a branch main só leem isso). Aqui só há funções puras.

export const MAX_FOTOS = 8;
export const TAMANHO_MAX = 5 * 1024 * 1024; // 5 MB; o bucket também impõe (SQL do X1)
export const TIPOS_ACEITOS = ['image/jpeg', 'image/png', 'image/webp'];

// Caminho no bucket a partir da URL pública (sem host nem "?v="), ou null se a URL não for do
// bucket pedido (padrão `produtos`; as fotos de categoria ficam em `categorias`, X7). Mesmo corte
// que o SQL do X1 faz em produtos.imagem_url.
export function caminhoDaUrl(url, bucket = 'produtos') {
  if (typeof url !== 'string') return null;
  const MARCADOR = `/object/public/${bucket}/`;
  const i = url.indexOf(MARCADOR);
  if (i === -1) return null;
  return url.slice(i + MARCADOR.length).split('?')[0] || null;
}

// Cópia ordenada por `ordem`; empate por `created_at`. Não altera a entrada.
export function ordenarFotos(linhas) {
  return [...(linhas ?? [])].sort(
    (a, b) =>
      (a.ordem ?? 0) - (b.ordem ?? 0) ||
      String(a.created_at ?? '').localeCompare(String(b.created_at ?? '')),
  );
}

// Lista ordenada de fotos de um produto, pronta para a galeria (A7) e para o admin:
// [{ caminho, url, alt, foco_x, foco_y, zoom }]. `urlDe(caminho)` monta a URL pública.
// Sem linhas na tabela cai em produtos.imagem_url (produto criado pelo admin da main, ou antes
// da migração), para o produto nunca ficar sem foto.
export function fotosDoProduto(produto, linhas, urlDe) {
  const ordenadas = ordenarFotos(linhas);
  if (ordenadas.length > 0) {
    return ordenadas.map((l) => ({
      caminho: l.caminho,
      // caminho com "/" é arquivo de public/ (produtos de teste), não do Storage
      url: l.caminho.startsWith('/') ? l.caminho : urlDe(l.caminho),
      alt: l.alt ?? null,
      foco_x: l.foco_x,
      foco_y: l.foco_y,
      zoom: l.zoom,
    }));
  }
  if (!produto?.imagem_url) return [];
  return [
    {
      caminho: caminhoDaUrl(produto.imagem_url),
      url: produto.imagem_url,
      alt: null,
      foco_x: produto.imagem_foco_x ?? 50,
      foco_y: produto.imagem_foco_y ?? 50,
      zoom: produto.imagem_zoom ?? 100,
    },
  ];
}

// Troca o item `i` de lugar com o vizinho (delta -1 sobe, +1 desce). Nas pontas devolve a lista igual.
export function mover(lista, i, delta) {
  const j = i + delta;
  if (i < 0 || i >= lista.length || j < 0 || j >= lista.length) return lista;
  const nova = [...lista];
  [nova[i], nova[j]] = [nova[j], nova[i]];
  return nova;
}

// Leva o item `i` para o topo (vira a principal), mantendo a ordem relativa dos demais.
export function tornarPrincipal(lista, i) {
  if (i <= 0 || i >= lista.length) return lista;
  return [lista[i], ...lista.slice(0, i), ...lista.slice(i + 1)];
}

// Valida os arquivos escolhidos (tipo, tamanho e o limite de MAX_FOTOS contando as que o produto
// já tem). Devolve { aceitos, erros }: o que passa entra, o resto vira mensagem.
export function validarArquivos(arquivos, quantasJaTem = 0) {
  const aceitos = [];
  const erros = [];
  for (const arquivo of arquivos) {
    if (!TIPOS_ACEITOS.includes(arquivo.type)) {
      erros.push(`"${arquivo.name}": use JPEG, PNG ou WebP (foto do iPhone em HEIC: exporte como JPEG).`);
    } else if (arquivo.size > TAMANHO_MAX) {
      erros.push(`"${arquivo.name}": passa de ${TAMANHO_MAX / 1024 / 1024} MB.`);
    } else if (quantasJaTem + aceitos.length >= MAX_FOTOS) {
      erros.push(`"${arquivo.name}": o limite é de ${MAX_FOTOS} fotos por produto.`);
    } else {
      aceitos.push(arquivo);
    }
  }
  return { aceitos, erros };
}
