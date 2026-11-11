'use client';

import { usePathname } from 'next/navigation';
import { areaInterna, semChrome } from '@/lib/navegacao';
import Consentimento from './Consentimento';

// Oculta o Header e o Footer institucionais em /login e /admin, onde a
// área tem sua própria identidade visual (tela de login isolada, header
// próprio do admin). O aviso de cookies/GTM também fica de fora dessas rotas.
export default function SiteChrome({ header, footer, children }) {
  const pathname = usePathname();
  const hideChrome = semChrome(pathname);

  return (
    <>
      {!hideChrome && header}
      {children}
      {!hideChrome && footer}
      {!areaInterna(pathname) && <Consentimento />}
    </>
  );
}
