import { mockupsLigados } from './navegacao.js';

// Estado do carrossel do hero. `pausado` = pausa explícita (botão ou toque);
// `interagindo` = pausa temporária (hover ou foco). Só o `tick` respeita as duas;
// navegar à mão (avancar/voltar/ir) sempre funciona.
export function reducer(estado, acao) {
  const { indice, total } = estado;
  switch (acao.tipo) {
    case 'avancar':
      return { ...estado, indice: (indice + 1) % total };
    case 'voltar':
      return { ...estado, indice: (indice - 1 + total) % total };
    case 'ir':
      return { ...estado, indice: acao.indice };
    case 'tick':
      return estado.pausado || estado.interagindo
        ? estado
        : { ...estado, indice: (indice + 1) % total };
    case 'alternarPausa':
      return { ...estado, pausado: !estado.pausado };
    case 'interagir':
      return { ...estado, interagindo: acao.valor };
    default:
      return estado;
  }
}

// Preview mostra o slide sem foto (com placeholder); produção omite: sem foto
// real não vai ao ar (check do D2 no plano).
export const slidesVisiveis = (slides) =>
  mockupsLigados() ? slides : slides.filter((s) => s.imagem);
