import { describe, expect, it } from 'vitest';
import { WHATSAPP_NUMERO, linkCompra, linkWhatsApp } from '../lib/whatsapp.js';

describe('linkWhatsApp', () => {
  it('usa o número da marca (55 73 9 2002 6708)', () => {
    expect(WHATSAPP_NUMERO).toBe('5573920026708');
    expect(linkWhatsApp()).toBe('https://wa.me/5573920026708');
  });

  it('sem texto não há ?text=', () => {
    expect(linkWhatsApp('')).not.toContain('?text=');
  });
});

describe('linkCompra', () => {
  const url = 'https://exemplo.com/loja/barra-70?a=1&b=2';

  it('leva nome e endereço da página, codificados', () => {
    const link = linkCompra('Café & Cacau Esperança', url);
    expect(link.startsWith('https://wa.me/5573920026708?text=')).toBe(true);
    expect(link).not.toMatch(/[ \n]/);
    const texto = new URL(link).searchParams.get('text');
    expect(texto).toContain('Café & Cacau Esperança');
    expect(texto).toContain(url);
  });
});
