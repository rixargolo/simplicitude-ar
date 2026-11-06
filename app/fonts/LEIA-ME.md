# Fontes hospedadas

Tipografia da marca, subconjunto **latin** (cobre o português + setas `← → ↑ ↓` e `♪`), em WOFF2,
carregada por `next/font/local` em `app/layout.js`. Os zips originais ficam em `docs/Fontes da marca/`
(fora do git). Grandeurs e Simplicity não são usadas.

| Arquivo | Origem | Uso |
|---|---|---|
| `fraunces-latin.woff2`, `fraunces-italic-latin.woff2` | Fraunces (variável) | `--font-display`: títulos e nomes de produto |
| `assistant-400-latin.woff2`, `assistant-600-latin.woff2` | Assistant Regular e SemiBold (estáticas) | `--font-body`: texto, botões, preços, rótulos |
| `amsterdam-one-latin.woff2` | Amsterdam One 400 (sem o Slant) | `--font-accent`: **só** destaque curto em tamanho grande |

**Licenças.** Fraunces e Assistant: SIL Open Font License 1.1 (`OFL-Fraunces.txt`, `OFL-Assistant.txt`;
uso e redistribuição livres, desde que a licença acompanhe as fontes). **Amsterdam One: o pacote
recebido não trouxe licença**; o uso segue a orientação do criador do projeto (da dona da marca).
Se a marca for publicada de forma mais ampla, confirmar a licença antes.

## Como foram geradas (receita avulsa, sem script no repo)

Ambiente temporário: `py -3.11 -m venv` + `pip install fonttools brotli`.

- **Fraunces**: de `Fraunces-VariableFont_SOFTWONKopszwght.ttf` e `Fraunces-Italic-…` com
  `fontTools.varLib.instancer`, fixando `SOFT=0` (sem suavização) e `WONK=0`, `wght=300:700`,
  `opsz=9:72` (o maior texto do site fica em ~44px; sem limitar, o itálico passa de 80 KB). Salvar e
  recarregar o resultado antes de subsetar (o subset direto após instanciar falha com `KeyError: '.notdef'`).
- **Assistant** e **Amsterdam One**: só subset (sem instanciar).
- **Subset** (`fontTools.subset`, `flavor=woff2`, `layout_features=*`), faixa unicode:
  `U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,
  U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD` (latin do Google Fonts) `+ U+2190,U+2192,U+266A`.
- Amsterdam One cobre todos os acentos do português (conferido no `cmap`).

Assistant não tem itálico: texto em itálico usa Fraunces itálico. O peso 700 cai no 600.
Para outro idioma que use acentos fora do latin (ex.: latin-ext), gerar o subconjunto também.
