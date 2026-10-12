// app/middleware.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

const PUBLIC_ROUTES = ['/login', '/api/config', '/favicon.ico', '/_next'];

/**
 * Simple JWT check for protected routes.
 * Adjust the decoding logic to match your backend (use an external library if needed).
 */
export async function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();

  // Skip public routes
  if (PUBLIC_ROUTES.some((path) => url.pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // Get token from cookies
  const token = req.cookies.get('token')?.value;

  if (!token) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Very basic validation – in production verify signature, expiry, role, etc.
  // Optionally call an auth endpoint to validate
  const payload = parseJwt(token);
  if (!payload || !payload.sub) {
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // Attach role to request header for API calls
  req.headers.set('x-user-role', payload.role as string);
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|login|_next|favicon\\.ico).*)'],
};

function parseJwt(token: string) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => {
          return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        })
        .join(''),
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}