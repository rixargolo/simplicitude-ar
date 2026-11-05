import { mockupsLigados } from './navegacao.js';

// Presets de paleta do preview (só existem com NEXT_PUBLIC_MOCKUPS=1). Preset novo = uma
// entrada em PALETAS. Nunca azul sobre verde nem o contrário (contraste 1,17:1); texto
// claro sobre botão e rodapé é sempre o bege. O teste tests/paletas.test.js barra preset ruim.
const BEGE = '#f6f3ea';
const AZUL = '#272a5c';
const VERDE = '#27401e';

export const PALETAS = {
  azul: { nome: 'Azul', fundo: BEGE, texto: AZUL, destaque: VERDE, botao: AZUL, botaoTexto: BEGE, rodape: AZUL, rodapeTexto: BEGE },
  // Verde é monocromático: destaque também verde. Com destaque azul, as páginas que ainda usam
  // os aliases antigos (--green = destaque) saíam com faixas azuis e texto verde, tudo misturado.
  verde: { nome: 'Verde', fundo: BEGE, texto: VERDE, destaque: VERDE, botao: VERDE, botaoTexto: BEGE, rodape: VERDE, rodapeTexto: BEGE },
  mix1: { nome: 'Mix 1', fundo: BEGE, texto: AZUL, destaque: VERDE, botao: AZUL, botaoTexto: BEGE, rodape: VERDE, rodapeTexto: BEGE },
  mix2: { nome: 'Mix 2', fundo: BEGE, texto: VERDE, destaque: AZUL, botao: VERDE, botaoTexto: BEGE, rodape: AZUL, rodapeTexto: BEGE },
};

export const PALETA_PADRAO = 'azul';
export const CHAVE_PALETA = 'simplicitude:paleta';

// papel do preset → variável CSS dos papéis-base (app/globals.css)
const VARIAVEIS = {
  fundo: '--cor-fundo',
  texto: '--cor-texto',
  destaque: '--cor-destaque',
  botao: '--cor-botao',
  botaoTexto: '--cor-botao-texto',
  rodape: '--cor-rodape',
  rodapeTexto: '--cor-rodape-texto',
};

export function variaveis(chave) {
  const preset = PALETAS[chave];
  return Object.fromEntries(Object.entries(VARIAVEIS).map(([papel, v]) => [v, preset[papel]]));
}

// Script inline síncrono (primeiro filho do <body>): aplica a paleta antes da 1ª pintura.
// Prioridade: ?paleta=, depois a escolha lembrada, depois o padrão; valor inválido é
// ignorado em cada nível. Sem a flag devolve null — nada é renderizado e ?paleta não tem efeito.
export function scriptPaleta() {
  if (!mockupsLigados()) return null;
  const todas = Object.fromEntries(Object.keys(PALETAS).map((k) => [k, variaveis(k)]));
  return `(function(){try{
    var P=${JSON.stringify(todas)},K=${JSON.stringify(CHAVE_PALETA)},ok=function(k){return Object.prototype.hasOwnProperty.call(P,k)};
    var q=new URLSearchParams(location.search).get('paleta');q=q&&q.toLowerCase();
    var l=null;try{l=localStorage.getItem(K)}catch(e){}
    var k=ok(q)?q:ok(l)?l:${JSON.stringify(PALETA_PADRAO)};
    if(ok(q)){try{localStorage.setItem(K,q)}catch(e){}}
    var s=document.documentElement.style;
    for(var v in P[k])s.setProperty(v,P[k][v]);
    document.documentElement.dataset.paleta=k;
  }catch(e){}})();`;
}
