// Tradução com fallback para o PT (ADR 0002). O PT mora na tabela-base; os outros idiomas, em `*_traducoes`.
// Campo de tradução vazio ou só com espaços cai no PT. Nada público chama isto ainda (sem rotas /en).

export const IDIOMA_BASE = 'pt';

// O que o admin faz ao salvar a seção "English (opcional)": algum campo preenchido grava (upsert); tudo vazio
// apaga a linha se ela existia, senão não faz nada (assim salvar não exige a tabela antes do SQL).
export function acaoTraducao(valores, existia) {
  if (Object.values(valores).some((v) => typeof v === 'string' && v.trim())) return 'gravar';
  return existia ? 'apagar' : 'nada';
}

// `traducao` é a linha de `*_traducoes` do idioma pedido (ou null/undefined). Ignora chaves que não são
// texto traduzível (`idioma`, `*_id`) e valores que não são texto.
export function traduzir(registro, traducao, idioma) {
  if (!registro || !traducao || idioma === IDIOMA_BASE) return registro;
  const campos = {};
  for (const [chave, valor] of Object.entries(traducao)) {
    if (chave === 'idioma' || chave.endsWith('_id')) continue;
    if (typeof valor === 'string' && valor.trim()) campos[chave] = valor;
  }
  return { ...registro, ...campos };
}
