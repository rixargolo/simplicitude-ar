# Paleta azul — referência

> **Cor padrão da paleta da marca, não usada por enquanto.** Desde o X2 (2026-11-05) a paleta de uso
> do site é a verde (ver `app/globals.css`). Este arquivo guarda os valores do azul para o caso de
> voltarem a ser usados. Nenhum código lê este arquivo.

## Papéis-base (os mesmos tokens de `app/globals.css`)

| Token | Valor | Cor |
|---|---|---|
| `--cor-fundo` | `#f6f3ea` | Bege Background |
| `--cor-texto` | `#272a5c` | Azul Simplicitude |
| `--cor-destaque` | `#27401e` | Verde Musgo (nomes de produto, item ativo do menu, foco) |
| `--cor-botao` | `#272a5c` (= `--cor-texto`) | |
| `--cor-botao-texto` | `#f6f3ea` (= `--cor-fundo`) | |
| `--cor-rodape` | `#272a5c` (= `--cor-texto`) | |
| `--cor-rodape-texto` | `#f6f3ea` (= `--cor-fundo`) | |

Derivados (calculados em `globals.css` por `color-mix`, seguem `--cor-texto` sozinhos):

| Token | Fórmula | Resultado com o azul |
|---|---|---|
| `--cor-texto-suave` | 72% de `--cor-texto` no `--cor-fundo` | `#616284` |
| `--cor-superficie` | 6% de `--cor-texto` no `--cor-fundo` | `#eae7e1` |
| `--cor-borda` | 18% de `--cor-texto` no `--cor-fundo` | `#d1cfd0` |

## Contraste medido (WCAG 2.x, mínimo 4,5:1)

| Combinação | Razão |
|---|---|
| texto / fundo | 12,04 |
| texto / superfície | 10,82 |
| botão e rodapé (bege sobre azul) | 12,04 |
| texto suave / fundo | 5,27 |
| texto suave / superfície | 4,74 |
| cartão translúcido do hero (70%) sobre foto preta | 5,75 |
| cartões de categoria (tons de 7% a 14%) | 9,31 a 10,63 |

**Regra: nunca azul sobre verde (e vice-versa): 1,17:1.** No azul, o destaque verde só vale sobre o
bege (10,30:1), nunca sobre o azul.

## Como voltar ao azul

Em `app/globals.css`, trocar `--cor-texto` para `#272a5c`. Botão, rodapé e derivados acompanham.
`--cor-destaque` fica `#27401e` (com o azul ele é o único verde). Conferir com `npm test`
(`tests/paletas.test.js` lê os tokens do CSS; o teste "a paleta de uso é a verde" precisa ser
atualizado junto) e rever à mão os trechos que dependiam do verde monocromático: `--green` (alias de
`--cor-destaque`) pinta as faixas dos heros de `/quem-somos` e `/meditacao`, que no azul ficariam
verdes sobre um site azul.
