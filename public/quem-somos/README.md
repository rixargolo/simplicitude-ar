# Assets — Quem Somos

Imagens da página `/quem-somos`, em uso por `app/quem-somos/page.js` via `next/image`. Originais em
`_DOCS/quem-somos/` (fora do git). WebP `quality: 85` (`effort: 6`, `smartSubsample: true`) com `sharp`,
PSNR ≥ ~38 dB contra o original; `capa-2` e `quem-somos` precisaram de q90.

| Arquivo | Tamanho | Onde entra | Conteúdo |
|---|---|---|---|
| `capa-1.webp` | 835×587 | Faixa do topo, 1ª foto | Dois frutos de cacau sobre folha de palmeira |
| `capa-2.webp` | 2004×587 | Faixa do topo, 2ª foto | Agricultor revolvendo cacau que seca ao sol numa barcaça |
| `capa-3.webp` | 1188×587 | Faixa do topo, 3ª foto | Travessa de madeira com folhas, discos de chocolate e folhas picadas |
| `quem-somos.webp` | 1600×1200 (4:3) | Topo, coluna da direita (bloco 1) | Jovem e agricultor entre cacaueiros com frutos |
| `fabrica.webp` | 1600×1200 (4:3) | Seção "Made in Bahia!" | Mulher de touca e avental diante do mural da fábrica; recorte do original sem os 700 px da esquerda (janela e parede vazia) e sem o pé (chão e avental), para ficar em 4:3 como `quem-somos.webp` |
| `cabruca.jpg` | 622×350 | **Sem uso** na página | Resto da versão anterior; só citado no histórico de `docs/plano-v1.md` |

As três `capa-*` são recortes de `_DOCS/quem-somos/capa quem somos.png` (4106×591), que traz as 3 fotos separadas
por barras pretas embutidas. Colunas cortadas fora: 835–866 e 2871–2916; linha 0 e linhas 588–590 também
(1 px preto no alto e no pé de cada foto). A faixa usa a largura real de cada recorte (`FOTOS` em `page.js`) para
as três dividirem a largura na mesma altura, sem cortar nada.

Para trocar uma foto, substituir o arquivo e atualizar `src`/`largura`/`alt` em `page.js` se o tamanho mudar.
