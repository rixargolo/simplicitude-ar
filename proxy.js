import { NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';
import { COOKIE_IDIOMA, PARES_EN, idiomaPreferido, paisDaRequisicao } from '@/lib/i18n';

export async function proxy(request) {
  // Idioma (ADR 0002, §3): só em página PT que tem versão EN (PARES_EN); /en/... nunca redireciona.
  // Antes do 404 do preview: /meditacao segue pública lá.
  const { pathname } = request.nextUrl;
  if (PARES_EN[pathname]) {
    const idioma = idiomaPreferido({
      cookie: request.cookies.get(COOKIE_IDIOMA)?.value,
      acceptLanguage: request.headers.get('accept-language'),
      pais: paisDaRequisicao(request.headers),
    });
    if (idioma !== 'en') return NextResponse.next();
    const destino = request.nextUrl.clone(); // mantém a query
    destino.pathname = PARES_EN[pathname];
    const resposta = NextResponse.redirect(destino, 307);
    resposta.headers.set('Cache-Control', 'private, no-store'); // a resposta depende do visitante
    return resposta;
  }

  // Preview de mockups: admin e login não existem (nada de escrita em dados reais).
  if (process.env.NEXT_PUBLIC_MOCKUPS === '1') {
    return new NextResponse(null, { status: 404 });
  }
  return updateSession(request);
}

export const config = {
  matcher: ['/admin/:path*', '/login', '/meditacao'],
};
