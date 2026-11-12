import { preload as precarregar } from 'react-dom';
import Image from 'next/image';
import { fotoOtimizada, srcsetFoto, urlLargura } from '@/lib/fotos';

// mesmo que o next/image aplica com `fill`
const PREENCHER = { position: 'absolute', height: '100%', width: '100%', inset: 0, color: 'transparent' };

// Foto de produto que preenche o pai posicionado (como <Image fill>). Foto já otimizada (lib/fotos.js)
// vira um <img> com srcset das 4 larguras reais, direto do Storage: o navegador escolhe pela tela
// (`sizes`) e pela densidade, e nada passa pelo Image CDN do Netlify. Foto antiga (ainda não
// reprocessada) segue pelo next/image. `preload` = foto do topo da página (LCP): carrega já.
export default function FotoProduto({ src, alt, sizes, className, style, preload = false }) {
  if (!fotoOtimizada(src)) {
    return <Image src={src} alt={alt} fill sizes={sizes} className={className} style={style} preload={preload} />;
  }
  const srcSet = srcsetFoto(src);
  // como o next/image faz com `preload`: <link rel="preload"> no <head>, antes de o <img> aparecer no HTML
  if (preload) precarregar(urlLargura(src, 640), { as: 'image', imageSrcSet: srcSet, imageSizes: sizes, fetchPriority: 'high' });
  return (
    // eslint-disable-next-line @next/next/no-img-element -- srcset próprio, de propósito (ver acima)
    <img
      src={urlLargura(src, 640)}
      srcSet={srcSet}
      sizes={sizes}
      alt={alt}
      className={className}
      style={{ ...PREENCHER, ...style }}
      loading={preload ? 'eager' : 'lazy'}
      fetchPriority={preload ? 'high' : undefined}
      decoding="async"
    />
  );
}
