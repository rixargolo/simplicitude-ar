// Enquadramento da foto do produto: ponto de foco (produtos.imagem_foco_x / imagem_foco_y, 0–100,
// padrão 50) e zoom (produtos.imagem_zoom, 100–200, padrão 100). Porta única para home, loja e
// (A7) página de produto: sempre passar por estiloFoto().

export const FOCO_PADRAO = 50;
export const ZOOM_PADRAO = 100;
export const ZOOM_MAX = 200;

// Inteiro de 0 a 100. Nulo, vazio, NaN e texto não numérico viram o centro (50);
// fora da faixa é limitado a 0 ou 100.
export function normalizarFoco(valor) {
  if (valor == null || valor === '') return FOCO_PADRAO;
  const n = Number(valor);
  if (Number.isNaN(n)) return FOCO_PADRAO;
  return Math.min(100, Math.max(0, Math.round(n)));
}

// Inteiro de 100 a 200 (%). Nulo, vazio, NaN e texto viram 100 (sem zoom); fora da faixa é limitado.
// Abaixo de 100 sobraria área vazia no quadro; acima de 200 a foto perde nitidez.
export function normalizarZoom(valor) {
  if (valor == null || valor === '') return ZOOM_PADRAO;
  const n = Number(valor);
  if (Number.isNaN(n)) return ZOOM_PADRAO;
  return Math.min(ZOOM_MAX, Math.max(ZOOM_PADRAO, Math.round(n)));
}

// Valor de `object-position` ("30% 70%") para a foto do produto.
export function focoParaCss(x, y) {
  return `${normalizarFoco(x)}% ${normalizarFoco(y)}%`;
}

// `style` da <img> do produto. O zoom é um scale() com origem no próprio ponto de foco: como o
// object-position alinha o ponto x%/y% da foto com o x%/y% do quadro, esse ponto fica parado e o
// resto se aproxima em volta dele. Com zoom ≥ 100 nunca sobra vazio (o quadro corta com overflow hidden).
export function estiloFoto(x, y, zoom) {
  const posicao = focoParaCss(x, y);
  const z = normalizarZoom(zoom);
  return {
    objectPosition: posicao,
    ...(z > ZOOM_PADRAO && { transformOrigin: posicao, transform: `scale(${z / 100})` }),
  };
}
