import { describe, expect, it } from 'vitest';
import {
  acaoTraducao,
  caminhoNoOutroIdioma,
  idiomaDoCaminho,
  idiomaPreferido,
  paisDaRequisicao,
  mesclar,
  textos,
  traducaoCompleta,
  traduzir,
  traduzirProduto,
} from '../lib/i18n.js';
import pt from '../lib/i18n/pt.js';
import en from '../lib/i18n/en.js';

const cat = { id: 'c1', nome: 'Chocolates', descricao: 'Barras artesanais', slug: 'chocolates' };

describe('traduzir', () => {
  it('pt devolve o registro intacto', () => {
    const t = { categoria_id: 'c1', idioma: 'en', nome: 'Chocolate' };
    expect(traduzir(cat, t, 'pt')).toBe(cat);
  });

  it('sem tradução ou sem registro devolve o que veio', () => {
    expect(traduzir(cat, null, 'en')).toBe(cat);
    expect(traduzir(cat, undefined, 'en')).toBe(cat);
    expect(traduzir(null, { nome: 'x' }, 'en')).toBeNull();
  });

  it('en completo sobrescreve os campos de texto', () => {
    const t = { categoria_id: 'c1', idioma: 'en', nome: 'Chocolates EN', descricao: 'Artisan bars' };
    expect(traduzir(cat, t, 'en')).toEqual({ ...cat, nome: 'Chocolates EN', descricao: 'Artisan bars' });
  });

  it('campo vazio, só espaços ou nulo cai no PT', () => {
    const t = { categoria_id: 'c1', idioma: 'en', nome: '  ', descricao: null };
    expect(traduzir(cat, t, 'en')).toEqual(cat);
    expect(traduzir(cat, { nome: 'Only name', descricao: '' }, 'en')).toEqual({ ...cat, nome: 'Only name' });
  });

  it('não copia idioma nem chaves estrangeiras para o registro', () => {
    const r = traduzir(cat, { categoria_id: 'outro', idioma: 'en', nome: 'N' }, 'en');
    expect(r.id).toBe('c1');
    expect(r).not.toHaveProperty('idioma');
    expect(r).not.toHaveProperty('categoria_id');
  });
});

describe('traduzir (produto, X13)', () => {
  const produto = {
    id: 'p1',
    nome: 'Esperança',
    descricao_curta: 'Intenso e cítrico',
    descricao: 'Texto longo\n\nSegundo parágrafo',
    ingredientes: 'Cacau, açúcar',
  };

  it('curta EN vazia cai no PT; ingredientes EN valem', () => {
    const t = { produto_id: 'p1', idioma: 'en', nome: 'Hope', descricao_curta: ' ', descricao: null, ingredientes: 'Cocoa, sugar' };
    expect(traduzir(produto, t, 'en')).toEqual({ ...produto, nome: 'Hope', ingredientes: 'Cocoa, sugar' });
  });

  it('preserva as quebras de linha da tradução', () => {
    const r = traduzir(produto, { idioma: 'en', descricao: 'Long\n\nSecond' }, 'en');
    expect(r.descricao).toBe('Long\n\nSecond');
  });
});

describe('acaoTraducao', () => {
  it('vale para os campos do produto', () => {
    const vazio = { nome: '', descricao_curta: '', descricao: '', ingredientes: '' };
    expect(acaoTraducao(vazio, false)).toBe('nada');
    expect(acaoTraducao(vazio, true)).toBe('apagar');
    expect(acaoTraducao({ ...vazio, ingredientes: 'Cocoa' }, false)).toBe('gravar');
  });

  it('algum campo preenchido grava', () => {
    expect(acaoTraducao({ nome: 'A', descricao: '' }, false)).toBe('gravar');
    expect(acaoTraducao({ nome: '', descricao: 'd' }, true)).toBe('gravar');
  });

  it('tudo vazio apaga se existia, senão não faz nada', () => {
    expect(acaoTraducao({ nome: ' ', descricao: '' }, true)).toBe('apagar');
    expect(acaoTraducao({ nome: '', descricao: '' }, false)).toBe('nada');
  });
});

describe('idiomaDoCaminho / caminhoNoOutroIdioma', () => {
  it('só /en e /en/... são EN (/entrega não)', () => {
    expect(idiomaDoCaminho('/en')).toBe('en');
    expect(idiomaDoCaminho('/en/meditacao')).toBe('en');
    expect(idiomaDoCaminho('/entrega')).toBe('pt');
    expect(idiomaDoCaminho('/meditacao')).toBe('pt');
  });

  it('o par PT ↔ EN vale só para a meditação', () => {
    expect(caminhoNoOutroIdioma('/meditacao')).toEqual({ href: '/en/meditacao', idioma: 'en' });
    expect(caminhoNoOutroIdioma('/en/meditacao/')).toEqual({ href: '/meditacao', idioma: 'pt' });
    expect(caminhoNoOutroIdioma('/loja')).toBeNull();
    expect(caminhoNoOutroIdioma('/')).toBeNull();
  });
});

describe('idiomaPreferido (ADR 0002, §3)', () => {
  const p = (o) => idiomaPreferido({ cookie: undefined, acceptLanguage: undefined, pais: null, ...o });

  it('o cookie manda, mesmo contra o navegador', () => {
    expect(p({ cookie: 'pt', acceptLanguage: 'en-US,en;q=0.9', pais: 'US' })).toBe('pt');
    expect(p({ cookie: 'en', acceptLanguage: 'pt-BR' })).toBe('en');
    expect(p({ cookie: 'xx', acceptLanguage: 'pt-BR' })).toBe('pt'); // cookie inválido é ignorado
  });

  it('sem Accept-Language (Googlebot, prévia do WhatsApp) é PT', () => {
    expect(p({ pais: 'US' })).toBe('pt');
  });

  it('navegador em EN sem PT na lista abre EN', () => {
    expect(p({ acceptLanguage: 'en-US,en;q=0.9' })).toBe('en');
    expect(p({ acceptLanguage: 'en-GB,fr;q=0.8', pais: 'BR' })).toBe('en'); // turista no Brasil
  });

  it('com PT na lista, EN só em país anglófono e preferindo EN', () => {
    expect(p({ acceptLanguage: 'en-US,en;q=0.9,pt;q=0.8', pais: 'BR' })).toBe('pt');
    expect(p({ acceptLanguage: 'en-US,en;q=0.9,pt;q=0.8', pais: 'US' })).toBe('en');
    expect(p({ acceptLanguage: 'en-US,en;q=0.9,pt;q=0.8' })).toBe('pt'); // país desconhecido
  });

  it('brasileiro em país anglófono, navegador em PT, abre PT', () => {
    expect(p({ acceptLanguage: 'pt-BR,pt;q=0.9,en;q=0.8', pais: 'US' })).toBe('pt');
  });

  it('empate e idiomas fora de PT/EN abrem PT', () => {
    expect(p({ acceptLanguage: 'en,pt', pais: 'US' })).toBe('pt');
    expect(p({ acceptLanguage: 'fr-FR,de;q=0.8', pais: 'US' })).toBe('pt');
    expect(p({ acceptLanguage: 'en;q=0,pt' })).toBe('pt');
  });
});

describe('paisDaRequisicao', () => {
  const h = (obj) => new Headers(obj);

  it('lê x-country, cf-ipcountry e cloudfront-viewer-country (maiúsculas)', () => {
    expect(paisDaRequisicao(h({ 'x-country': 'us' }))).toBe('US');
    expect(paisDaRequisicao(h({ 'cf-ipcountry': 'GB' }))).toBe('GB');
    expect(paisDaRequisicao(h({ 'cloudfront-viewer-country': 'CA' }))).toBe('CA');
  });

  it('lê x-nf-geo (JSON em base64) e tolera lixo', () => {
    const geo = btoa(JSON.stringify({ country: { code: 'AU' } }));
    expect(paisDaRequisicao(h({ 'x-nf-geo': geo }))).toBe('AU');
    expect(paisDaRequisicao(h({ 'x-nf-geo': '%%%' }))).toBeNull();
    expect(paisDaRequisicao(h({}))).toBeNull();
  });
});

describe('dicionários', () => {
  const caminhos = (o, base = '') =>
    Object.entries(o).flatMap(([k, v]) => (v && typeof v === 'object' ? caminhos(v, `${base}${k}.`) : [`${base}${k}`]));

  it('EN tem exatamente as chaves do PT (e arrays do mesmo tamanho), mais o menu', () => {
    const doPt = caminhos(pt);
    const doEn = caminhos(en).filter((c) => !c.startsWith('menu.'));
    expect(doEn).toEqual(doPt);
  });

  it('texto EN preenchido vence o PT; idioma desconhecido é PT', () => {
    expect(textos('en').meditacao.titulo).toBe('Inspirar Collection');
    expect(textos('en').menu['/loja']).toBe('Shop');
    expect(textos('pt').meditacao.titulo).toBe(pt.meditacao.titulo);
    expect(textos('xx')).toBe(textos('pt'));
  });

  it('texto EN vazio ou só com espaços cai no PT (strings e arrays)', () => {
    const parcial = { meditacao: { titulo: '', abertura: ['Only first', ' '] } };
    const m = mesclar(pt, parcial);
    expect(m.meditacao.titulo).toBe(pt.meditacao.titulo);
    expect(m.meditacao.abertura).toEqual(['Only first', pt.meditacao.abertura[1]]);
    expect(m.player).toEqual(pt.player);
  });

  it('o EN entregue está completo; um vazio derruba o "completo" (noindex, sem hreflang)', () => {
    expect(traducaoCompleta()).toBe(true);
    expect(traducaoCompleta({ ...en, player: { ...en.player, sub: ' ' } })).toBe(false);
    expect(traducaoCompleta({ ...en, menu: { ...en.menu, '/loja': '' } })).toBe(false);
  });
});

describe('traduzirProduto', () => {
  const produto = {
    id: 'p1',
    nome: 'Esperança',
    titulo_meditacao: 'Meditação da Esperança',
    audio_url: 'https://x/pt.mp3',
    categorias: { nome: 'Chocolates', categoria_traducoes: [{ idioma: 'en', nome: 'Chocolates EN' }] },
    produto_traducoes: [{ idioma: 'en', nome: 'Hope', titulo_meditacao: '', audio_url: 'https://x/en.mp3' }],
  };

  it('no EN traduz o produto e a categoria e usa o áudio EN', () => {
    const r = traduzirProduto(produto, 'en');
    expect(r).toMatchObject({ nome: 'Hope', titulo_meditacao: 'Meditação da Esperança', audio_url: 'https://x/en.mp3', audio_idioma: 'en' });
    expect(r.categorias.nome).toBe('Chocolates EN');
  });

  it('sem áudio EN toca o PT e avisa (audio_idioma = pt)', () => {
    for (const audio_url of ['', '  ', null, undefined]) {
      const r = traduzirProduto({ ...produto, produto_traducoes: [{ idioma: 'en', nome: 'Hope', audio_url }] }, 'en');
      expect(r.audio_url).toBe('https://x/pt.mp3');
      expect(r.audio_idioma).toBe('pt');
    }
  });

  it('sem linha de tradução fica tudo em PT; no PT nada muda', () => {
    expect(traduzirProduto({ ...produto, produto_traducoes: [] }, 'en')).toMatchObject({ nome: 'Esperança', audio_idioma: 'pt' });
    expect(traduzirProduto(produto, 'pt')).toMatchObject({ nome: 'Esperança', audio_url: 'https://x/pt.mp3', audio_idioma: 'pt' });
  });
});
