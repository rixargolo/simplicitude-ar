// Regra de nomes da vitrine da home (docs/plano-v1.md, B6): a consulta e o título saem da
// mesma entrada, então não divergem. "Mais vendidos" só com ordem real de vendas, nunca com
// created_at.
export const CRITERIOS_VITRINE = {
  novidades: { titulo: 'Novidades', coluna: 'created_at' },
  favoritos: { titulo: 'Favoritos', coluna: 'destaque_ordem' }, // curadoria sem dado de venda
  maisVendidos: { titulo: 'Mais vendidos', coluna: 'destaque_ordem' }, // ordem real da dona/pedidos
};

// destaque_ordem só existe a partir do C2; até lá a vitrine é "Novidades".
export const CRITERIO_VITRINE = CRITERIOS_VITRINE.novidades;
