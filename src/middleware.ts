import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const preferredTheme = request.cookies.get('blog-theme');
  if (preferredTheme) {
    response.headers.set('x-blog-theme', preferredTheme.value);
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};