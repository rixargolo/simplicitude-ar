// Busca de produtos (X16). Pura: o termo só é comparado em JS, nunca vira filtro de consulta (sem injeção).
// shortcut: filtra o catálogo ativo inteiro em memória; com algumas centenas de produtos, trocar por uma RPC
// `buscar_produtos(termo)` com unaccent + pg_trgm (a assinatura de buscarProdutos não muda para a página).

export const TERMO_MIN = 2;
export const TERMO_MAX = 60;
export const MAX_RESULTADOS = 24;

// minúsculas e sem acento (mesma técnica de slugify em lib/produtos.js)
export const semAcento = (t) =>
  String(t ?? '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();

// Termo digitado → termo de busca. Só aceita texto (?q=a&q=b chega como array e é ignorado); apara,
// junta espaços e corta em TERMO_MAX. Devolve '' se sobrar menos de TERMO_MIN caracteres.
export function normalizarTermo(q) {
  if (typeof q !== 'string') return '';
  const termo = q.replace(/\s+/g, ' ').trim().slice(0, TERMO_MAX).trim();
  return termo.length >= TERMO_MIN ? termo : '';
}

// Pesos: nome 3, tags e descrição curta 2, ingredientes 1 (o nome sempre vem na frente).
const CAMPOS = [
  [(p) => p.nome, 3],
  [(p) => p.tags?.map((t) => t.nome).join(' '), 2],
  [(p) => p.descricao_curta, 2],
  [(p) => p.ingredientes, 1],
];

// Produtos que contêm TODAS as palavras do termo (E) em algum campo, do mais ao menos relevante (empate: nome).
// Devolve { total, produtos } com até `limite` produtos; `total` é o número de achados antes do corte.
export function buscarProdutos(produtos, termo, limite = MAX_RESULTADOS) {
  const palavras = semAcento(normalizarTermo(termo)).split(' ').filter(Boolean);
  if (palavras.length === 0) return { total: 0, produtos: [] };

  const achados = [];
  for (const p of produtos) {
    const campos = CAMPOS.map(([ler, peso]) => [semAcento(ler(p)), peso]);
    let pontos = 0;
    for (const palavra of palavras) {
      const peso = Math.max(0, ...campos.filter(([texto]) => texto.includes(palavra)).map(([, w]) => w));
      if (peso === 0) {
        pontos = 0;
        break;
      }
      pontos += peso;
    }
    if (pontos > 0) achados.push({ p, pontos });
  }

  achados.sort((a, b) => b.pontos - a.pontos || a.p.nome.localeCompare(b.p.nome, 'pt-BR'));
  return { total: achados.length, produtos: achados.slice(0, limite).map((a) => a.p) };
}
