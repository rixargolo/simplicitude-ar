# Assets — Quem Somos

Imagens reais da página `/quem-somos`, já em uso por
`app/quem-somos/page.js` via `next/image`.

| Arquivo                  | Proporção real | Onde entra                     | Conteúdo                                        |
|---------------------------|-----------------|----------------------------------|---------------------------------------------------|
| `hero_agricultores.jpg`   | 1270×446 (2.85:1, panorâmica) | Banner full-bleed no topo | Agricultores da Simplicitude no Sul da Bahia       |
| `cabruca.jpg`              | 622×350 (~16:9) | Seção "Quem Somos"               | Sistema Cabruca, família produtora, plantio        |
| `ingredientes.jpg`         | 788×591 (~4:3)  | Seção "Da Natureza, Para Você"   | Chocolate com flores, frutas, nuts, especiarias    |

O hero é propositalmente panorâmico: o banner usa `object-fit: cover` com
`aspect-ratio` dedicado (2.85:1 no desktop, 3:2 no mobile) para não virar uma
tira fina em telas estreitas. As imagens das seções mantêm a proporção
natural do arquivo (sem crop).

Para trocar qualquer imagem, basta substituir o arquivo mantendo o mesmo
nome — ou atualizar `src`/`width`/`height` em `page.js` se o nome ou a
proporção mudar.
