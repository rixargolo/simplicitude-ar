import { describe, expect, it } from 'vitest';
import {
  blocosTexto,
  envolverSelecao,
  formatarLista,
  inlineTexto,
  inserirLink,
  normalizarUrl,
  textoSimples,
  urlSegura,
} from '../lib/texto.js';

const aplicar = (valor, op) => valor.slice(0, op.de) + op.texto + valor.slice(op.ate);
const tipos = (tokens) => tokens.map((t) => t.tipo);

describe('blocosTexto', () => {
  it('texto puro antigo: linha em branco separa parágrafos, quebra simples fica no parágrafo', () => {
    expect(blocosTexto('Linha 1\nLinha 2\n\nOutro parágrafo')).toEqual([
      { tipo: 'p', linhas: ['Linha 1', 'Linha 2'] },
      { tipo: 'p', linhas: ['Outro parágrafo'] },
    ]);
  });

  it('vazio, nulo e só espaços não geram bloco', () => {
    expect(blocosTexto('')).toEqual([]);
    expect(blocosTexto(null)).toEqual([]);
    expect(blocosTexto('  \n \n')).toEqual([]);
  });

  it('listas com marcadores e numerada, sem precisar de linha em branco antes', () => {
    expect(blocosTexto('Ingredientes:\n- cacau\n- açúcar\n1. um\n2) dois')).toEqual([
      { tipo: 'p', linhas: ['Ingredientes:'] },
      { tipo: 'ul', linhas: ['cacau', 'açúcar'] },
      { tipo: 'ol', linhas: ['um', 'dois'] },
    ]);
  });

  it('**negrito** no começo da linha não é lista', () => {
    expect(blocosTexto('**forte** e doce')[0].tipo).toBe('p');
  });
});

describe('inlineTexto', () => {
  it('negrito e itálico', () => {
    expect(inlineTexto('a **b** c *d*')).toEqual([
      { tipo: 'texto', texto: 'a ' },
      { tipo: 'b', filhos: [{ tipo: 'texto', texto: 'b' }] },
      { tipo: 'texto', texto: ' c ' },
      { tipo: 'i', filhos: [{ tipo: 'texto', texto: 'd' }] },
    ]);
  });

  it('link válido vira <a> com o rótulo', () => {
    expect(inlineTexto('veja [o site](https://exemplo.com.br/a)')).toEqual([
      { tipo: 'texto', texto: 'veja ' },
      { tipo: 'a', href: 'https://exemplo.com.br/a', filhos: [{ tipo: 'texto', texto: 'o site' }] },
    ]);
  });

  it('URL com _ e * dentro do link fica intacta, sem itálico nem negrito', () => {
    const [a] = inlineTexto('[x](https://exemplo.com/a_b_c/*d*/e**f**)');
    expect(a.tipo).toBe('a');
    expect(a.href).toBe('https://exemplo.com/a_b_c/*d*/e**f**');
    expect(inlineTexto('um [x](https://e.com/_a_/*b*) *i*').map((t) => t.tipo)).toEqual(['texto', 'a', 'texto', 'i']);
  });

  it('palavra com underscore fica literal e _texto_ não vira itálico', () => {
    expect(inlineTexto('cacau_fino e _texto_ e snake_case_nome')).toEqual([
      { tipo: 'texto', texto: 'cacau_fino e _texto_ e snake_case_nome' },
    ]);
  });

  it('marca que não fecha ou * solto ficam literais', () => {
    expect(inlineTexto('**sem fechar')).toEqual([{ tipo: 'texto', texto: '**sem fechar' }]);
    expect(inlineTexto('2 * 3 * 4')).toEqual([{ tipo: 'texto', texto: '2 * 3 * 4' }]);
    expect(inlineTexto('um * sozinho')).toEqual([{ tipo: 'texto', texto: 'um * sozinho' }]);
  });

  it('javascript: e data: não viram link (ficam como texto)', () => {
    expect(tipos(inlineTexto('[clique](javascript:alert(1))'))).not.toContain('a');
    expect(tipos(inlineTexto('[clique](JaVaScRiPt:alert)'))).not.toContain('a');
    expect(tipos(inlineTexto('[x](data:text/html,<b>)'))).not.toContain('a');
  });

  it('<script> é só texto (quem renderiza escapa; nunca há HTML)', () => {
    expect(inlineTexto('<script>alert(1)</script>')).toEqual([
      { tipo: 'texto', texto: '<script>alert(1)</script>' },
    ]);
  });

  it('negrito dentro do rótulo do link', () => {
    const [a] = inlineTexto('[**forte**](https://e.com)');
    expect(a.filhos[0].tipo).toBe('b');
  });
});

describe('urlSegura / normalizarUrl', () => {
  it('só https, http e mailto', () => {
    expect(urlSegura('https://e.com')).toBe('https://e.com/');
    expect(urlSegura('http://e.com')).toBe('http://e.com/');
    expect(urlSegura('mailto:a@b.com')).toBe('mailto:a@b.com');
    expect(urlSegura('javascript:alert(1)')).toBeNull();
    expect(urlSegura('ftp://e.com')).toBeNull();
    expect(urlSegura('abc')).toBeNull();
  });

  it('www., domínio solto e e-mail ganham o protocolo', () => {
    expect(normalizarUrl('www.simplicitude.com.br')).toBe('https://www.simplicitude.com.br/');
    expect(normalizarUrl(' instagram.com/simplicitude.co ')).toBe('https://instagram.com/simplicitude.co');
    expect(normalizarUrl('viva@simplicitude.com.br')).toBe('mailto:viva@simplicitude.com.br');
  });

  it('o que não parece site é recusado', () => {
    expect(normalizarUrl('')).toBeNull();
    expect(normalizarUrl('minha loja')).toBeNull();
    expect(normalizarUrl('localhost')).toBeNull();
    expect(normalizarUrl('javascript:alert(1)')).toBeNull();
  });
});

describe('textoSimples', () => {
  it('tira as marcas e junta tudo numa linha', () => {
    expect(textoSimples('Um **doce** *puro*.\n\n- cacau\n- [site](https://e.com)')).toBe('Um doce puro. cacau site');
  });

  it('texto puro antigo passa igual e vazio dá string vazia', () => {
    expect(textoSimples('Chocolate 70% cacau')).toBe('Chocolate 70% cacau');
    expect(textoSimples(null)).toBe('');
  });
});

describe('edição da barra', () => {
  it('negrito: envolve a seleção sem os espaços das pontas', () => {
    const v = 'um doce  puro';
    const op = envolverSelecao(v, 3, 8, '**', 'x'); // "doce " (Windows seleciona o espaço junto)
    expect(aplicar(v, op)).toBe('um **doce**  puro');
    expect(aplicar(v, op).slice(op.selIni, op.selFim)).toBe('doce');
  });

  it('negrito sem seleção insere o exemplo já selecionado', () => {
    const op = envolverSelecao('ab', 1, 1, '**', 'texto em negrito');
    expect(aplicar('ab', op)).toBe('a**texto em negrito**b');
    expect(aplicar('ab', op).slice(op.selIni, op.selFim)).toBe('texto em negrito');
  });

  it('clicar de novo desfaz (marca dentro da seleção ou em volta dela)', () => {
    expect(aplicar('a **b** c', envolverSelecao('a **b** c', 2, 7, '**', 'x'))).toBe('a b c');
    expect(aplicar('a **b** c', envolverSelecao('a **b** c', 4, 5, '**', 'x'))).toBe('a b c');
    expect(aplicar('a *b* c', envolverSelecao('a *b* c', 3, 4, '*', 'x'))).toBe('a b c');
  });

  it('itálico sobre negrito soma, não desfaz o negrito', () => {
    expect(aplicar('a **b** c', envolverSelecao('a **b** c', 2, 7, '*', 'x'))).toBe('a ***b*** c');
    expect(aplicar('a **b** c', envolverSelecao('a **b** c', 4, 5, '*', 'x'))).toBe('a ***b*** c');
  });

  it('várias linhas: a marca vale por linha', () => {
    const v = 'um\n\ndois';
    expect(aplicar(v, envolverSelecao(v, 0, v.length, '**', 'x'))).toBe('**um**\n\n**dois**');
  });

  it('lista: prefixa as linhas tocadas, tira se já são lista, troca de tipo', () => {
    const v = 'antes\num\ndois\ndepois';
    const lista = aplicar(v, formatarLista(v, 7, 11, 'ul'));
    expect(lista).toBe('antes\n- um\n- dois\ndepois');
    expect(aplicar(lista, formatarLista(lista, 8, 14, 'ul'))).toBe(v);
    expect(aplicar(lista, formatarLista(lista, 8, 14, 'ol'))).toBe('antes\n1. um\n2. dois\ndepois');
  });

  it('lista numerada pula linha em branco sem numerar', () => {
    const v = 'a\n\nb';
    expect(aplicar(v, formatarLista(v, 0, v.length, 'ol'))).toBe('1. a\n\n2. b');
  });

  it('lista sem texto insere um item de exemplo selecionado', () => {
    const op = formatarLista('', 0, 0, 'ul');
    expect(op.texto).toBe('- item da lista');
    expect(op.texto.slice(op.selIni, op.selFim)).toBe('item da lista');
  });

  it('link: monta [rótulo](endereço) ou devolve null se o endereço for inválido', () => {
    const op = inserirLink('ver aqui', 4, 8, 'aqui', 'www.e.com');
    expect(aplicar('ver aqui', op)).toBe('ver [aqui](https://www.e.com/)');
    expect(inserirLink('x', 0, 1, 'x', 'javascript:alert(1)')).toBeNull();
    expect(inserirLink('x', 0, 0, '', 'e.com').texto).toBe('[https://e.com/](https://e.com/)');
  });
});
