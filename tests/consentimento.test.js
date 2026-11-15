import { describe, expect, it } from 'vitest';
import {
  CHAVE,
  CHAVE_INTERNO,
  SCRIPT_TRAFEGO_INTERNO,
  cookiesParaApagar,
  deveCarregarGtm,
  gravarEscolha,
  gtmIdValido,
  lerEscolha,
  mostrarBanner,
  origemNaoEncontrado,
} from '../lib/consentimento.js';

const ID = 'GTM-K9T83L53';
const T0 = new Date('2026-11-09T12:00:00Z');

function armazenamento(inicial = {}) {
  const dados = { ...inicial };
  return {
    getItem: (k) => dados[k] ?? null,
    setItem: (k, v) => {
      dados[k] = v;
    },
  };
}
const quebrado = {
  getItem: () => {
    throw new Error('bloqueado');
  },
  setItem: () => {
    throw new Error('bloqueado');
  },
};

describe('lerEscolha / gravarEscolha', () => {
  it('ida e volta', () => {
    const s = armazenamento();
    gravarEscolha(s, 'recusado', T0);
    expect(lerEscolha(s, T0)).toBe('recusado');
    gravarEscolha(s, 'aceito', T0);
    expect(lerEscolha(s, T0)).toBe('aceito');
  });

  it.each([
    ['ausente', armazenamento()],
    ['JSON quebrado', armazenamento({ [CHAVE]: '{nao-e-json' })],
    ['valor inválido', armazenamento({ [CHAVE]: JSON.stringify({ escolha: 'talvez', em: T0 }) })],
    ['data inválida', armazenamento({ [CHAVE]: JSON.stringify({ escolha: 'aceito', em: 'ontem' }) })],
    ['armazenamento que lança', quebrado],
  ])('%s = nunca escolheu', (_, s) => {
    expect(lerEscolha(s, T0)).toBeNull();
  });

  it('vale até 6 meses e expira depois', () => {
    const s = armazenamento();
    gravarEscolha(s, 'aceito', T0);
    expect(lerEscolha(s, new Date('2027-05-08T12:00:00Z'))).toBe('aceito'); // 6 meses - 1 dia
    expect(lerEscolha(s, new Date('2027-05-10T12:00:00Z'))).toBeNull(); // 6 meses + 1 dia
  });

  it('gravar com armazenamento bloqueado não lança', () => {
    expect(() => gravarEscolha(quebrado, 'aceito', T0)).not.toThrow();
  });
});

describe('decisão de carregar o GTM e mostrar o banner', () => {
  it('só aceita IDs no formato do GTM', () => {
    expect(gtmIdValido(ID)).toBe(ID);
    for (const ruim of ['', undefined, 'UA-123', 'gtm-abc', 'GTM-ab c', "GTM-X');alert(1)"]) {
      expect(gtmIdValido(ruim)).toBe('');
    }
  });

  it('carrega para quem nunca escolheu e para quem aceitou, nunca para quem recusou', () => {
    expect(deveCarregarGtm(ID, null)).toBe(true);
    expect(deveCarregarGtm(ID, 'aceito')).toBe(true);
    expect(deveCarregarGtm(ID, 'recusado')).toBe(false);
  });

  it('sem ID (ou inválido) nada carrega e não há banner', () => {
    for (const escolha of [null, 'aceito', 'recusado']) {
      expect(deveCarregarGtm('', escolha)).toBe(false);
      expect(mostrarBanner('', escolha)).toBe(false);
      expect(mostrarBanner('x', escolha)).toBe(false);
    }
  });

  it('banner só até a primeira escolha', () => {
    expect(mostrarBanner(ID, null)).toBe(true);
    expect(mostrarBanner(ID, 'aceito')).toBe(false);
    expect(mostrarBanner(ID, 'recusado')).toBe(false);
  });
});

describe('SCRIPT_TRAFEGO_INTERNO', () => {
  function rodar(url, dados = {}, bloqueado = false) {
    const store = { ...dados };
    const w = {
      location: { href: `https://x.com${url}` },
      localStorage: bloqueado
        ? quebrado
        : {
            getItem: (k) => store[k] ?? null,
            setItem: (k, v) => {
              store[k] = v;
            },
            removeItem: (k) => {
              delete store[k];
            },
          },
      history: { state: null, urls: [], replaceState(_s, _t, u) { this.urls.push(u); } },
    };
    new Function('window', SCRIPT_TRAFEGO_INTERNO)(w);
    return { w, store };
  }
  const MARCA = { [CHAVE_INTERNO]: '1' };

  it('?interno=1 grava, limpa a URL (mantém o resto) e envia traffic_type', () => {
    const { w, store } = rodar('/p?x=2&interno=1#a');
    expect(store[CHAVE_INTERNO]).toBe('1');
    expect(w.history.urls).toEqual(['/p?x=2#a']);
    expect(w.dataLayer).toEqual([{ traffic_type: 'internal' }]);
  });

  it('marca existente sem parâmetro: envia, sem mexer na URL', () => {
    const { w } = rodar('/p', MARCA);
    expect(w.history.urls).toEqual([]);
    expect(w.dataLayer).toEqual([{ traffic_type: 'internal' }]);
  });

  it('?interno=0 apaga a marca, limpa a URL e não envia', () => {
    const { w, store } = rodar('/?interno=0', MARCA);
    expect(store[CHAVE_INTERNO]).toBeUndefined();
    expect(w.history.urls).toEqual(['/']);
    expect(w.dataLayer).toBeUndefined();
  });

  it('sem marca e sem parâmetro: nada acontece', () => {
    const { w } = rodar('/p');
    expect(w.history.urls).toEqual([]);
    expect(w.dataLayer).toBeUndefined();
  });

  it('armazenamento bloqueado: limpa a URL, não envia e não lança', () => {
    const { w } = rodar('/?interno=1', {}, true);
    expect(w.history.urls).toEqual(['/']);
    expect(w.dataLayer).toBeUndefined();
  });
});

describe('cookiesParaApagar', () => {
  const EXP = 'expires=Thu, 01 Jan 1970 00:00:00 GMT';

  it('www.: sem domain, host atual e domínio raiz', () => {
    expect(cookiesParaApagar('_ga=1', 'www.simplicitude.com.br')).toEqual([
      `_ga=; path=/; ${EXP}`,
      `_ga=; path=/; ${EXP}; domain=www.simplicitude.com.br`,
      `_ga=; path=/; ${EXP}; domain=.simplicitude.com.br`,
    ]);
  });

  it('domínio raiz: host atual e raiz com ponto, sem repetir', () => {
    const r = cookiesParaApagar('_fbp=1', 'simplicitude.com.br');
    expect(r).toEqual([
      `_fbp=; path=/; ${EXP}`,
      `_fbp=; path=/; ${EXP}; domain=simplicitude.com.br`,
      `_fbp=; path=/; ${EXP}; domain=.simplicitude.com.br`,
    ]);
    expect(new Set(r).size).toBe(r.length);
  });

  it('localhost e IP: só a variante sem domain', () => {
    expect(cookiesParaApagar('_ga=1', 'localhost')).toEqual([`_ga=; path=/; ${EXP}`]);
    expect(cookiesParaApagar('_ga=1', '127.0.0.1')).toEqual([`_ga=; path=/; ${EXP}`]);
  });

  it('só os de medição (_ga*, _gid, _fbp, _fbc); nome repetido conta uma vez', () => {
    const nomes = cookiesParaApagar(
      '_ga_ABC123=x; _gid=2; _fbc=3; outro=1; sb-token=4; _ga_ABC123=y',
      'localhost',
    ).map((c) => c.split('=')[0]);
    expect(nomes).toEqual(['_ga_ABC123', '_gid', '_fbc']);
  });

  it('sem cookies = nada a escrever', () => {
    expect(cookiesParaApagar('', 'www.simplicitude.com.br')).toEqual([]);
  });
});

describe('origemNaoEncontrado', () => {
  const SITE = 'https://simplicitude.com.br';

  it('navegação interna, rastreio ainda não rodou: a página anterior', () => {
    const nav = { atual: '/loja', anterior: null };
    expect(origemNaoEncontrado(nav, '/xyz', 'https://instagram.com/', SITE)).toBe(`${SITE}/loja`);
  });

  it('rastreio já registrou o 404: usa a anterior', () => {
    const nav = { atual: '/xyz', anterior: '/loja' };
    expect(origemNaoEncontrado(nav, '/xyz', 'https://instagram.com/', SITE)).toBe(`${SITE}/loja`);
  });

  it('1ª carga: referrer sem query nem hash', () => {
    const nav = { atual: '/xyz', anterior: null };
    expect(origemNaoEncontrado(nav, '/xyz', 'https://l.instagram.com/a/b?u=1&fbclid=2#x', SITE)).toBe(
      'https://l.instagram.com/a/b',
    );
    expect(origemNaoEncontrado({ atual: null, anterior: null }, '/xyz', 'https://x.com/p?q=1', SITE)).toBe(
      'https://x.com/p',
    );
  });

  it('sem navegação e referrer vazio ou inválido: vazio', () => {
    const nav = { atual: null, anterior: null };
    expect(origemNaoEncontrado(nav, '/xyz', '', SITE)).toBe('');
    expect(origemNaoEncontrado(nav, '/xyz', 'não é url', SITE)).toBe('');
  });
});
