'use client';

import { usePathname } from 'next/navigation';

// Oculta o Header e o Footer institucionais em /login e /admin, onde a
// área tem sua própria identidade visual (tela de login isolada, header
// próprio do admin).
export default function SiteChrome({ header, footer, children }) {
  const pathname = usePathname();
  const hideChrome = pathname === '/login' || pathname.startsWith('/admin');

  return (
    <>
      {!hideChrome && header}
      {children}
      {!hideChrome && footer}
    </>
  );
}
