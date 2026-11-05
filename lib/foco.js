// Ponto de foco da foto do produto (produtos.imagem_foco_x / imagem_foco_y, 0–100, padrão 50).
// Porta única para home, loja e (A7) página de produto: sempre passar por focoParaCss().

export const FOCO_PADRAO = 50;

// Inteiro de 0 a 100. Nulo, vazio, NaN e texto não numérico viram o centro (50);
// fora da faixa é limitado a 0 ou 100.
export function normalizarFoco(valor) {
  if (valor == null || valor === '') return FOCO_PADRAO;
  const n = Number(valor);
  if (Number.isNaN(n)) return FOCO_PADRAO;
  return Math.min(100, Math.max(0, Math.round(n)));
}

// Valor de `object-position` ("30% 70%") para a foto do produto.
export function focoParaCss(x, y) {
  return `${normalizarFoco(x)}% ${normalizarFoco(y)}%`;
}
