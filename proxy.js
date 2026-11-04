import { NextResponse } from 'next/server';
import { updateSession } from '@/lib/supabase/middleware';

export async function proxy(request) {
  // Preview de mockups: admin e login não existem (nada de escrita em dados reais).
  if (process.env.NEXT_PUBLIC_MOCKUPS === '1') {
    return new NextResponse(null, { status: 404 });
  }
  return updateSession(request);
}

export const config = {
  matcher: ['/admin/:path*', '/login'],
};
