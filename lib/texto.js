// Formatação da descrição longa do produto: texto simples com marcas — **negrito**, *itálico*,
// linhas "- " (lista), "1. " (lista numerada) e [texto](endereço). Texto puro antigo continua valendo.
// Aqui só se produz DADOS (blocos e tokens); quem renderiza (TextoFormatado) monta elementos React,
// então não há HTML nem XSS por construção. As funções de edição da barra do admin também são puras.

const LISTA_UL = /^[-*]\s+(.*)$/;
const LISTA_OL = /^\d+[.)]\s+(.*)$/;
// \S(?:.*?\S)? = a marca encosta no texto (sem lookbehind: Safari < 16.4 quebraria o bundle inteiro)
const ENFASE = /\*\*(\S(?:.*?\S)?)\*\*|\*(\S(?:.*?\S)?)\*/g;
// shortcut: endereço com ")" ou espaço não vira link, só texto; upgrade se a dona precisar
const LINK = /\[([^\][]+)\]\(([^)\s]+)\)/g;

// Só https, http e mailto; qualquer outro protocolo (javascript:, data:…) devolve null.
export function urlSegura(texto) {
  try {
    const u = new URL(texto);
    return ['https:', 'http:', 'mailto:'].includes(u.protocol) ? u.href.replace(/\)/g, '%29') : null;
  } catch {
    return null;
  }
}

// O que a dona digita no campo do link: "www.x.com", "instagram.com/x" e e-mail ganham o protocolo.
export function normalizarUrl(texto) {
  const t = String(texto ?? '').trim();
  if (!t || /\s/.test(t)) return null;
  if (/^[^\s@/:]+@[^\s@/:]+\.[^\s@/:]+$/.test(t)) return urlSegura(`mailto:${t}`);
  if (/^[a-z][a-z0-9+.-]*:/i.test(t)) return urlSegura(t);
  return /^[^\s/]+\.[^\s/]+/.test(t) ? urlSegura(`https://${t}`) : null;
}

// Parágrafos e listas, linha a linha: linha em branco separa; "- " e "1. " abrem/continuam lista.
// Devolve [{ tipo: 'p' | 'ul' | 'ol', linhas: [texto] }] (quebra simples dentro do parágrafo vira <br>).
export function blocosTexto(texto) {
  const blocos = [];
  let atual = null;
  for (const bruta of String(texto ?? '').split(/\r?\n/)) {
    const linha = bruta.trim();
    if (!linha) {
      atual = null;
      continue;
    }
    const ul = LISTA_UL.exec(linha);
    const ol = ul ? null : LISTA_OL.exec(linha);
    const tipo = ul ? 'ul' : ol ? 'ol' : 'p';
    if (atual?.tipo !== tipo) {
      atual = { tipo, linhas: [] };
      blocos.push(atual);
    }
    atual.linhas.push((ul ?? ol)?.[1] ?? linha);
  }
  return blocos;
}

function enfase(s) {
  const tokens = [];
  let ultimo = 0;
  for (const m of s.matchAll(ENFASE)) {
    if (m.index > ultimo) tokens.push({ tipo: 'texto', texto: s.slice(ultimo, m.index) });
    tokens.push(
      m[1] !== undefined
        ? { tipo: 'b', filhos: enfase(m[1]) }
        : { tipo: 'i', filhos: [{ tipo: 'texto', texto: m[2] }] },
    );
    ultimo = m.index + m[0].length;
  }
  if (ultimo < s.length) tokens.push({ tipo: 'texto', texto: s.slice(ultimo) });
  return tokens;
}

// Tokens de uma linha: { tipo: 'texto', texto } | { tipo: 'b' | 'i', filhos } | { tipo: 'a', href, filhos }.
// Links saem primeiro: a URL nunca passa pelo negrito/itálico (só o rótulo passa). Marca que não
// fecha, ou link com endereço inseguro, fica como texto literal. Sem itálico com _ (aparece em URL e palavra).
export function inlineTexto(s) {
  const tokens = [];
  let ultimo = 0;
  for (const m of s.matchAll(LINK)) {
    const href = urlSegura(m[2]);
    if (!href) continue;
    if (m.index > ultimo) tokens.push(...enfase(s.slice(ultimo, m.index)));
    tokens.push({ tipo: 'a', href, filhos: enfase(m[1]) });
    ultimo = m.index + m[0].length;
  }
  if (ultimo < s.length) tokens.push(...enfase(s.slice(ultimo)));
  return tokens;
}

const achatar = (tokens) => tokens.map((t) => t.texto ?? achatar(t.filhos)).join('');

// Sem marcas, numa linha só: para o card e a meta description.
export function textoSimples(texto) {
  return blocosTexto(texto)
    .flatMap((b) => b.linhas.map((l) => achatar(inlineTexto(l))))
    .join(' ');
}

// ---- Edição (BarraFormatacao). Cada função devolve { de, ate, texto, selIni, selFim }: troca
// valor[de..ate] por `texto` e seleciona selIni..selFim; ou null se o link for inválido.

const ESPACO = /\s/;

// Negrito/itálico: envolve a seleção (sem os espaços das pontas), desfaz se já está envolvida,
// sem seleção insere `exemplo` já selecionado. shortcut: seleção em várias linhas só adiciona a marca
// por linha (não desfaz); upgrade se a dona reclamar.
export function envolverSelecao(valor, ini, fim, marca, exemplo) {
  while (ini < fim && ESPACO.test(valor[ini])) ini++;
  while (fim > ini && ESPACO.test(valor[fim - 1])) fim--;
  const m = marca.length;
  const italico = marca === '*';
  const sel = valor.slice(ini, fim);
  if (!sel) {
    return { de: ini, ate: ini, texto: marca + exemplo + marca, selIni: ini + m, selFim: ini + m + exemplo.length };
  }
  if (sel.includes('\n')) {
    const texto = sel
      .split('\n')
      .map((l) => {
        const t = l.trim();
        return t ? l.replace(t, () => marca + t + marca) : l;
      })
      .join('\n');
    return { de: ini, ate: fim, texto, selIni: ini, selFim: ini + texto.length };
  }
  // "*" dentro de "**" é negrito, não itálico: não conta como marca de itálico
  const dentro =
    sel.length > 2 * m && sel.startsWith(marca) && sel.endsWith(marca) &&
    !(italico && (sel[1] === '*' || sel[sel.length - 2] === '*'));
  if (dentro) {
    const t = sel.slice(m, -m);
    return { de: ini, ate: fim, texto: t, selIni: ini, selFim: ini + t.length };
  }
  const fora =
    ini >= m && valor.startsWith(marca, ini - m) && valor.startsWith(marca, fim) &&
    !(italico && (valor[ini - 2] === '*' || valor[fim + 1] === '*'));
  if (fora) return { de: ini - m, ate: fim + m, texto: sel, selIni: ini - m, selFim: fim - m };
  return { de: ini, ate: fim, texto: marca + sel + marca, selIni: ini + m, selFim: fim + m };
}

// Lista: prefixa as linhas tocadas pela seleção ("- " ou "1. ", "2. "…); se todas já são desse tipo,
// tira; se são de outro tipo, troca. Sem texto, insere um item de exemplo selecionado.
export function formatarLista(valor, ini, fim, tipo) {
  const fimSel = fim > ini && valor[fim - 1] === '\n' ? fim - 1 : fim;
  const de = ini === 0 ? 0 : valor.lastIndexOf('\n', ini - 1) + 1;
  const proximo = valor.indexOf('\n', fimSel);
  const ate = proximo === -1 ? valor.length : proximo;
  const prefixo = (n) => (tipo === 'ol' ? `${n}. ` : '- ');
  const linhas = valor.slice(de, ate).split('\n');
  const comTexto = linhas.filter((l) => l.trim());
  if (!comTexto.length) {
    const texto = `${prefixo(1)}item da lista`;
    return { de, ate, texto, selIni: de + prefixo(1).length, selFim: de + texto.length };
  }
  const jaTem = tipo === 'ol' ? /^\s*\d+[.)]\s+/ : /^\s*[-*]\s+/;
  const tirar = comTexto.every((l) => jaTem.test(l));
  let n = 0;
  const texto = linhas
    .map((l) => {
      if (!l.trim()) return l;
      const limpa = l.replace(/^\s*([-*]|\d+[.)])\s+/, '');
      return tirar ? limpa : prefixo(++n) + limpa;
    })
    .join('\n');
  return { de, ate, texto, selIni: de, selFim: de + texto.length };
}

// Link: troca a seleção por [rótulo](endereço). Endereço inválido → null (a barra avisa).
export function inserirLink(valor, ini, fim, rotulo, endereco) {
  const href = normalizarUrl(endereco);
  if (!href) return null;
  const nome = String(rotulo ?? '').replace(/[[\]\n]/g, ' ').trim() || href;
  const texto = `[${nome}](${href})`;
  return { de: ini, ate: fim, texto, selIni: ini + texto.length, selFim: ini + texto.length };
}
