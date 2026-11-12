// Várias fotos por produto (tabela produto_imagens). A primeira por `ordem` é a principal.
// produtos.imagem_url / imagem_foco_x / imagem_foco_y / imagem_zoom seguem existindo como CÓPIA da
// principal (o card da home/loja e a branch main só leem isso). Aqui só há funções puras.

export const MAX_FOTOS = 8;
export const TAMANHO_MAX = 5 * 1024 * 1024; // 5 MB; o bucket também impõe (SQL do X1). Vale para foto sem processamento (categoria)
// Foto de produto é reduzida no navegador antes do envio: aceita-se entrada maior (foto de celular),
// e o que sobe (≤ 5 MB, o limite do bucket) já vem pequeno.
export const TAMANHO_MAX_ENTRADA = 20 * 1024 * 1024;
export const TIPOS_ACEITOS = ['image/jpeg', 'image/png', 'image/webp'];

// ---- Versões otimizadas (fatia "otimizar fotos"): uma foto de produto vira {uuid}-{largura}.{ext} para
// cada largura de LARGURAS e {uuid}-og.jpg (prévia de link). `caminho` em produto_imagens e a cópia em
// produtos.imagem_url apontam para a maior (-1600), então a branch main segue funcionando. A loja monta o
// srcset por aqui, direto do Storage (sem Image CDN do Netlify).
export const LARGURAS = [320, 640, 1080, 1600];
export const OG = { largura: 1200, altura: 630 };
export const QUALIDADE_WEBP = 0.82;
export const QUALIDADE_JPEG = 0.85; // reserva quando o navegador não gera WebP (Safari) e a prévia og
export const COR_FUNDO_OG = '#f6f3ea'; // = --cor-fundo (a prévia mostra a foto inteira sobre o bege)

// `sizes` dos cards, medidos pelo CSS (CarrosselProdutos.module.css e loja.module.css): celular ≤639px = 2
// colunas (50vw − margens 40px − vão 16px, dividido); trilho em tablet 14rem e desktop 16rem; grade a
// partir de 640px com colunas de até ~21rem. Mudou o CSS do card, muda aqui.
export const SIZES_CARD_CARROSSEL = '(max-width: 639px) calc(50vw - 28px), (max-width: 900px) 224px, 256px';
export const SIZES_CARD_GRADE = '(max-width: 639px) calc(50vw - 28px), 20rem';

const MAIOR = LARGURAS[LARGURAS.length - 1];
const SUFIXO_MAIOR = new RegExp(`-${MAIOR}\\.(webp|jpg)(\\?.*)?$`);

// true se a URL/caminho é a versão maior de uma foto já otimizada (por convenção de nome)
export function fotoOtimizada(urlOuCaminho) {
  return typeof urlOuCaminho === 'string' && SUFIXO_MAIOR.test(urlOuCaminho);
}

const trocarSufixo = (url, sufixo) => url.replace(SUFIXO_MAIOR, (_, ext, q = '') => `-${sufixo(ext)}${q}`);

// Versão de `largura` px: a menor de LARGURAS que seja >= largura (acima de MAIOR, a maior).
// Foto não otimizada volta igual.
export function urlLargura(url, largura) {
  if (!fotoOtimizada(url)) return url;
  const w = LARGURAS.find((l) => l >= largura) ?? MAIOR;
  return trocarSufixo(url, (ext) => `${w}.${ext}`);
}

// srcset com as larguras reais de cada arquivo; '' se a foto não é otimizada
export function srcsetFoto(url) {
  if (!fotoOtimizada(url)) return '';
  return LARGURAS.map((l) => `${urlLargura(url, l)} ${l}w`).join(', ');
}

// URL da prévia de link (1200×630, JPEG); null se a foto não é otimizada
export function urlOg(url) {
  return fotoOtimizada(url) ? trocarSufixo(url, () => 'og.jpg').replace(/\?.*$/, '') : null;
}

// Todos os arquivos de uma foto (para excluir do Storage). Não otimizada: só ela mesma.
export function arquivosDaFoto(caminho) {
  if (!fotoOtimizada(caminho)) return [caminho];
  return [...LARGURAS.map((l) => urlLargura(caminho, l)), urlOg(caminho)];
}

// Tamanho com no máximo `largura` px, mantendo a proporção; nunca amplia.
export function dimensoesLimitadas(w, h, largura) {
  if (w <= largura) return { largura: w, altura: h };
  return { largura, altura: Math.round((h * largura) / w) };
}

// Onde a foto w×h fica dentro de uma área W×H, inteira e centralizada (sem ampliar): { x, y, largura, altura }
export function retanguloContido(w, h, W, H) {
  const escala = Math.min(1, W / w, H / h);
  const largura = Math.round(w * escala);
  const altura = Math.round(h * escala);
  return { x: Math.round((W - largura) / 2), y: Math.round((H - altura) / 2), largura, altura };
}

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
export function validarArquivos(arquivos, quantasJaTem = 0, tamanhoMax = TAMANHO_MAX) {
  const aceitos = [];
  const erros = [];
  for (const arquivo of arquivos) {
    if (!TIPOS_ACEITOS.includes(arquivo.type)) {
      erros.push(`"${arquivo.name}": use JPEG, PNG ou WebP (foto do iPhone em HEIC: exporte como JPEG).`);
    } else if (arquivo.size > tamanhoMax) {
      erros.push(`"${arquivo.name}": passa de ${tamanhoMax / 1024 / 1024} MB.`);
    } else if (quantasJaTem + aceitos.length >= MAX_FOTOS) {
      erros.push(`"${arquivo.name}": o limite é de ${MAX_FOTOS} fotos por produto.`);
    } else {
      aceitos.push(arquivo);
    }
  }
  return { aceitos, erros };
}
