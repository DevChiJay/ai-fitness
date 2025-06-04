import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/auth';

// Define protected routes that require authentication
const protectedRoutes = [
  '/generate-program',
  '/profile',
  '/api/ai',
  '/api/programs',
  '/api/user',
  '/api/auth/me',
];

// Define public routes that don't require authentication
const publicRoutes = [
  '/',
  '/api/auth/login',
  '/api/auth/register',
  '/api/auth/logout',
  '/api/auth/me',
  '/auth/login',
  '/auth/register',
];

// Define API routes that require authentication
const protectedApiRoutes = [
  '/api/ai',
  '/api/programs',
  '/api/user',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip middleware for static files and Next.js internals
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/static') ||
    pathname.includes('.') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  // Check if the route is public
  const isPublicRoute = publicRoutes.some(route => 
    pathname === route || pathname.startsWith(route)
  );

  // Check if the route is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    pathname.startsWith(route)
  );

  // Check if it's a protected API route
  const isProtectedApiRoute = protectedApiRoutes.some(route => 
    pathname.startsWith(route)
  );
  // If it's a public route, allow access
  if (isPublicRoute || pathname === '/api/auth/me') {
    return NextResponse.next();
  }

  // Get token from cookie
  const token = request.cookies.get('auth-token')?.value;

  // If no token and route is protected, redirect or return unauthorized
  if (!token && (isProtectedRoute || isProtectedApiRoute)) {
    if (isProtectedApiRoute) {
      // For API routes, return 401 Unauthorized
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    } else {
      // For page routes, redirect to sign-in
      const signInUrl = new URL('/auth/login', request.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }
  }

  // If token exists, verify it
  if (token) {
    const payload = verifyToken(token);
    
    // If token is invalid and route is protected
    if (!payload && (isProtectedRoute || isProtectedApiRoute)) {
      if (isProtectedApiRoute) {
        // For API routes, return 401 Unauthorized
        return NextResponse.json(
          { error: 'Invalid or expired token' },
          { status: 401 }
        );
      } else {
        // For page routes, clear invalid cookie and redirect to sign-in
        const response = NextResponse.redirect(new URL('/auth/login', request.url));
        response.cookies.delete('auth-token');
        return response;
      }
    }

    // If token is valid, add user info to headers for API routes
    if (payload && isProtectedApiRoute) {
      const requestHeaders = new Headers(request.headers);
      requestHeaders.set('x-user-id', payload.userId);
      requestHeaders.set('x-user-email', payload.email);
      requestHeaders.set('x-user-name', payload.name);

      return NextResponse.next({
        request: {
          headers: requestHeaders,
        },
      });
    }

    // If authenticated user tries to access auth pages, redirect to profile
    if (payload && (pathname.startsWith('/auth/login') || pathname.startsWith('/sign-up'))) {
      return NextResponse.redirect(new URL('/profile', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    // Always run for API routes
    "/(api|trpc)(.*)",
  ],
};
