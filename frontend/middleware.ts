import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import type { Database } from './src/types/database';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  
  // Create a Supabase client configured to use cookies
  const supabase = createMiddlewareClient<Database>({ req, res });

  // Refresh session if expired - required for Server Components
  const { data: { session } } = await supabase.auth.getSession();

  // Define protected routes
  const protectedRoutes = [
    '/dashboard',
    '/profile',
    '/saved-clips',
    // Add other protected routes here
  ];

  const isProtectedRoute = protectedRoutes.some(route => 
    req.nextUrl.pathname.startsWith(route)
  );

  // If accessing a protected route without session, redirect to home
  if (isProtectedRoute && !session) {
    const redirectUrl = new URL('/', req.url);
    redirectUrl.searchParams.set('redirectTo', req.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return res;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    // Exclude API routes from middleware to prevent interfering with large uploads
    '/((?!_next/static|_next/image|favicon.ico|public/|api/).*)',
  ],
};
