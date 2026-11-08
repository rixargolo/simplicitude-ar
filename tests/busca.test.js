import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { buscarProdutos, normalizarTermo, semAcento, TERMO_MAX } from '../lib/busca.js';

const P = (nome, extra = {}) => ({ id: nome, nome, ...extra });
const catalogo = [
  P('Esperança', { descricao_curta: 'Barra com cacau 70%', tags: [{ nome: 'vegano' }], ingredientes: 'cacau, açúcar de coco' }),
  P('Serenidade', { descricao_curta: 'Com lavanda', tags: [], ingredientes: 'cacau, esperança de mel' }),
  P('Alegria', { tags: null, descricao_curta: null, ingredientes: null }),
  P('Chocobook', { tags: [{ nome: 'Presente' }], ingredientes: 'cacau' }),
];
const nomes = (r) => r.produtos.map((p) => p.nome);

describe('normalizarTermo', () => {
  it('apara e junta espaços', () => expect(normalizarTermo('  cacau   70 ')).toBe('cacau 70'));
  it.each([['vazio', ''], ['1 caractere', ' a '], ['array (?q=a&q=b)', ['a', 'b']], ['undefined', undefined]])(
    '%s → vazio',
    (_, q) => expect(normalizarTermo(q)).toBe(''),
  );
  it('corta no máximo', () => expect(normalizarTermo('a'.repeat(TERMO_MAX + 40))).toHaveLength(TERMO_MAX));
});

describe('buscarProdutos', () => {
  it('ignora acento e maiúscula', () => {
    expect(nomes(buscarProdutos(catalogo, 'ESPERANCA'))).toContain('Esperança');
    expect(semAcento('Ação')).toBe('acao');
  });

  it('acha por tag, descrição curta e ingrediente', () => {
    expect(nomes(buscarProdutos(catalogo, 'vegano'))).toEqual(['Esperança']);
    expect(nomes(buscarProdutos(catalogo, 'lavanda'))).toEqual(['Serenidade']);
    expect(nomes(buscarProdutos(catalogo, 'coco'))).toEqual(['Esperança']);
  });

  it('várias palavras: todas precisam aparecer (E)', () => {
    expect(nomes(buscarProdutos(catalogo, 'cacau lavanda'))).toEqual(['Serenidade']);
    expect(buscarProdutos(catalogo, 'cacau xyz').total).toBe(0);
  });

  it('nome vem antes de ingrediente', () => {
    expect(nomes(buscarProdutos(catalogo, 'esperanca'))).toEqual(['Esperança', 'Serenidade']);
  });

  it('termo curto ou vazio não acha nada; campos nulos não quebram', () => {
    expect(buscarProdutos(catalogo, 'a')).toEqual({ total: 0, produtos: [] });
    expect(buscarProdutos(catalogo, 'alegria').total).toBe(1);
  });

  it('limite corta a lista, total mostra quantos há', () => {
    const r = buscarProdutos(catalogo, 'cacau', 2);
    expect(r.total).toBe(4 - 1);
    expect(r.produtos).toHaveLength(2);
  });

  it('termo com caracteres de filtro é só texto', () => {
    expect(buscarProdutos(catalogo, 'a,b)%').total).toBe(0);
  });
});

describe('página /busca', () => {
  it('fica fora do Google (noindex) e usa a consulta fixa', () => {
    const fonte = fs.readFileSync(path.join(process.cwd(), 'app', 'busca', 'page.js'), 'utf8');
    expect(fonte).toMatch(/robots:\s*\{\s*index:\s*false/);
    expect(fonte).toContain('getProdutosBusca()');
  });
});
