import { describe, expect, it } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { blocosTexto } from '../lib/texto.js';

const ARQUIVOS = ['privacidade', 'entrega', 'trocas'];
const MARCA = /\[CONFIRMAR[^\]]*\]/g;
const ler = (nome) => fs.readFileSync(path.join(process.cwd(), 'content', 'legal', `${nome}.md`), 'utf8');

describe('textos legais (content/legal)', () => {
  it('existem, têm texto e títulos ##', () => {
    for (const nome of ARQUIVOS) {
      const texto = ler(nome);
      expect(texto.trim().length, nome).toBeGreaterThan(0);
      expect(blocosTexto(texto).some((b) => b.tipo === 'h2'), nome).toBe(true);
    }
  });

  it('não sobra [DATA] (a data vem de lib/legal.js)', () => {
    for (const nome of ARQUIVOS) expect(ler(nome), nome).not.toContain('[DATA]');
  });

  // Só avisa: as marcas são pendências de revisão (docs/plano-v1.md, D2), não erro. Nunca falha por elas.
  it('conta as marcas [CONFIRMAR] que ainda faltam resolver', () => {
    const onde = [];
    for (const nome of ARQUIVOS) {
      ler(nome).split(/\r?\n/).forEach((linha, i) => {
        for (const m of linha.match(MARCA) ?? []) onde.push(`  ${nome}.md:${i + 1}  ${m.slice(0, 70)}`);
      });
    }
    if (onde.length) {
      console.warn(`\n⚠ ${onde.length} marca(s) [CONFIRMAR] nos textos legais (resolver antes do go-live, D2):\n${onde.join('\n')}\n`);
    }
    expect(onde.length).toBeGreaterThanOrEqual(0);
  });
});
