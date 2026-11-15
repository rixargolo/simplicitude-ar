// Aviso de cookies (GTM). Modelo "aviso": o GTM carrega desde a primeira visita (escolha null) e só
// deixa de carregar se o visitante desativar a medição ('recusado'). Funções puras, sem DOM.

export const CHAVE = 'simplicitude:cookies';
export const VALIDADE_MESES = 6;
export const EVENTO_PREFERENCIAS = 'simplicitude:preferencias-cookies';

const ESCOLHAS = ['aceito', 'recusado'];
const EXPIRADO = 'Thu, 01 Jan 1970 00:00:00 GMT';

export const CHAVE_INTERNO = 'simplicitude:interno';

// Script inline (roda antes da hidratação e do GTM): ?interno=1 grava a marca de tráfego interno no
// navegador, ?interno=0 a remove; o parâmetro sai da URL sem recarregar; com a marca, empurra
// traffic_type no dataLayer para a tag do GA4 ler desde o 1º evento. Independe da escolha do banner e
// não carrega o GTM (quem decide é deveCarregarGtm).
export const SCRIPT_TRAFEGO_INTERNO = `(function(w){var K=${JSON.stringify(CHAVE_INTERNO)},u=new URL(w.location.href),p=u.searchParams.get('interno'),m=false;
try{if(p==='1')w.localStorage.setItem(K,'1');else if(p==='0')w.localStorage.removeItem(K);
m=w.localStorage.getItem(K)==='1'}catch(e){}
if(p!==null){u.searchParams.delete('interno');w.history.replaceState(w.history.state,'',u.pathname+u.search+u.hash)}
if(m)(w.dataLayer=w.dataLayer||[]).push({traffic_type:'internal'})})(window);`;

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

// Origem do 404: a página anterior na navegação do site ou, na 1ª carga, o referrer (no cliente o
// document.referrer fica o da 1ª carga). Sem query nem hash (podem ter dado pessoal); '' se não houver.
export function origemNaoEncontrado({ atual, anterior }, caminho, referrer, origem) {
  const interna = atual === caminho ? anterior : atual; // o rastreio de page_view pode já ter registrado o 404
  if (interna) return origem + interna;
  try {
    const u = new URL(referrer);
    return u.origin + u.pathname;
  } catch {
    return '';
  }
}

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
