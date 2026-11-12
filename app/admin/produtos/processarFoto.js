// Só no navegador (canvas). Reduz a foto escolhida no admin para as versões que a loja usa
// (ver lib/fotos.js): uma por largura de LARGURAS e a prévia de link 1200×630. Orientação EXIF é aplicada
// e os metadados (GPS inclusive) saem, porque o canvas só guarda pixels.
// shortcut: o original é decodificado inteiro (24 MP = ~100 MB de bitmap; 48 MP = ~200 MB) e só depois
// reduzido; o maior canvas criado tem 1/4 dos pixels do original (passos de metade), então fica abaixo do limite
// de canvas do iOS (16,7 MP) até ~67 MP. Upgrade: `resizeWidth` no createImageBitmap, se um iPhone velho
// ficar sem memória com foto de 48 MP.
import {
  COR_FUNDO_OG,
  LARGURAS,
  OG,
  QUALIDADE_JPEG,
  QUALIDADE_WEBP,
  dimensoesLimitadas,
  retanguloContido,
} from '@/lib/fotos';

const novoCanvas = (w, h) => Object.assign(document.createElement('canvas'), { width: w, height: h });

// Safari não gera WebP pelo canvas (devolve PNG); nesse caso as versões saem em JPEG
const navegadorGeraWebp = () => novoCanvas(1, 1).toDataURL('image/webp').startsWith('data:image/webp');

// Safari só devolve a memória de um canvas quando ele é zerado (senão várias fotos seguidas acumulam)
const liberar = (canvas) => {
  canvas.width = 0;
  canvas.height = 0;
};

const paraBlob = (canvas, tipo, qualidade) =>
  new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error('Não foi possível converter a foto.'))), tipo, qualidade),
  );

// Desenha `origem` (bitmap ou canvas) em w×h. Reduz em passos de metade antes do último, que dá
// resultado bem mais nítido que um único salto grande. `fundo` pinta o canvas antes (JPEG não tem transparência).
function reduzir(origem, w, h, fundo) {
  let atual = origem;
  const intermediarios = [];
  while (atual.width / 2 >= w && atual.height / 2 >= h) {
    const meio = novoCanvas(Math.round(atual.width / 2), Math.round(atual.height / 2));
    meio.getContext('2d').drawImage(atual, 0, 0, meio.width, meio.height);
    intermediarios.push(meio);
    atual = meio;
  }
  const canvas = novoCanvas(w, h);
  const ctx = canvas.getContext('2d');
  ctx.imageSmoothingQuality = 'high';
  if (fundo) {
    ctx.fillStyle = fundo;
    ctx.fillRect(0, 0, w, h);
  }
  ctx.drawImage(atual, 0, 0, w, h);
  intermediarios.forEach(liberar);
  return canvas;
}

async function abrir(arquivo) {
  try {
    return await createImageBitmap(arquivo, { imageOrientation: 'from-image' });
  } catch {
    return await createImageBitmap(arquivo); // navegador antigo sem a opção
  }
}

// → { larguras: { 320: Blob, 640: Blob, … }, og: Blob, ext: 'webp' | 'jpg' }
export async function processarFoto(arquivo) {
  const webp = navegadorGeraWebp();
  const [tipo, ext, qualidade, fundo] = webp
    ? ['image/webp', 'webp', QUALIDADE_WEBP, null]
    : ['image/jpeg', 'jpg', QUALIDADE_JPEG, COR_FUNDO_OG];

  const bitmap = await abrir(arquivo);
  const canvases = [];
  try {
    // da maior para a menor: cada uma parte da anterior (menos pixels a processar)
    let origem = bitmap;
    for (const largura of [...LARGURAS].reverse()) {
      const { largura: w, altura: h } = dimensoesLimitadas(bitmap.width, bitmap.height, largura);
      const canvas = reduzir(origem, w, h, fundo);
      canvases.unshift(canvas); // fica em ordem crescente, igual a LARGURAS
      origem = canvas;
    }

    const larguras = {};
    for (const [i, largura] of LARGURAS.entries()) larguras[largura] = await paraBlob(canvases[i], tipo, qualidade);

    // prévia: foto inteira sobre o bege, partindo da menor versão que ainda cobre o tamanho final
    const r = retanguloContido(bitmap.width, bitmap.height, OG.largura, OG.altura);
    const fonte = canvases.find((c) => c.width >= r.largura && c.height >= r.altura) ?? canvases[canvases.length - 1];
    const og = novoCanvas(OG.largura, OG.altura);
    const ctx = og.getContext('2d');
    ctx.imageSmoothingQuality = 'high';
    ctx.fillStyle = COR_FUNDO_OG;
    ctx.fillRect(0, 0, OG.largura, OG.altura);
    ctx.drawImage(fonte, r.x, r.y, r.largura, r.altura);

    return { larguras, og: await paraBlob(og, 'image/jpeg', QUALIDADE_JPEG), ext };
  } finally {
    bitmap.close();
    canvases.forEach(liberar);
  }
}
