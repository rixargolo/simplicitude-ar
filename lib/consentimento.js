// Aviso de cookies (GTM). Modelo "aviso": o GTM carrega desde a primeira visita (escolha null) e só
// deixa de carregar se o visitante desativar a medição ('recusado'). Funções puras, sem DOM.

export const CHAVE = 'simplicitude:cookies';
export const VALIDADE_MESES = 6;
export const EVENTO_PREFERENCIAS = 'simplicitude:preferencias-cookies';

const ESCOLHAS = ['aceito', 'recusado'];
const EXPIRADO = 'Thu, 01 Jan 1970 00:00:00 GMT';

// Só devolve o ID se tiver o formato do GTM; vazio/inválido = nada é carregado.
export const gtmIdValido = (id) => (/^GTM-[A-Z0-9]+$/.test(id || '') ? id : '');

function somarMeses(data, meses) {
  const d = new Date(data);
  d.setMonth(d.getMonth() + meses);
  return d;
}

// null = nunca escolheu, expirou (6 meses) ou o registro/armazenamento não é confiável.
export function lerEscolha(storage, agora = new Date()) {
  try {
    const { escolha, em } = JSON.parse(storage.getItem(CHAVE));
    const gravadoEm = new Date(em);
    if (!ESCOLHAS.includes(escolha) || Number.isNaN(gravadoEm.getTime())) return null;
    return agora >= somarMeses(gravadoEm, VALIDADE_MESES) ? null : escolha;
  } catch {
    return null;
  }
}

export function gravarEscolha(storage, escolha, agora = new Date()) {
  try {
    storage.setItem(CHAVE, JSON.stringify({ escolha, em: agora.toISOString() }));
  } catch {
    // armazenamento bloqueado: a escolha vale só nesta sessão
  }
}

export const deveCarregarGtm = (id, escolha) => !!gtmIdValido(id) && escolha !== 'recusado';

export const mostrarBanner = (id, escolha) => !!gtmIdValido(id) && escolha === null;

// Strings a atribuir a document.cookie para apagar os cookies de medição, tentando cada escopo em que
// eles podem ter sido gravados (sem domain, host atual e domínio raiz).
// shortcut: raiz = hostname sem "www."; se surgir outro subdomínio além do www, calcular a raiz de verdade.
export function cookiesParaApagar(documentCookie, hostname) {
  const nomes = documentCookie
    .split(';')
    .map((par) => par.split('=')[0].trim())
    .filter((nome) => /^(_ga|_gid$|_fbp$|_fbc$)/.test(nome));
  const raiz = hostname.replace(/^www\./, '');
  const dominios = [null];
  if (hostname !== 'localhost' && !/^[\d.]+$/.test(hostname) && !hostname.includes(':')) {
    dominios.push(hostname, `.${raiz}`);
  }
  return [...new Set(nomes)].flatMap((nome) =>
    dominios.map((d) => `${nome}=; path=/; expires=${EXPIRADO}${d ? `; domain=${d}` : ''}`),
  );
}
