import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// ============================================================================
// SIMPLE IN-MEMORY CACHE FOR STORE DATA
// Uses 10-minute TTL to reduce database queries
// In production, consider Redis for better scaling
// ============================================================================
class SimpleCache {
  private cache = new Map<string, { data: StoreData; expires: number }>();

  set(key: string, data: StoreData, ttlSeconds: number) {
    this.cache.set(key, {
      data,
      expires: Date.now() + (ttlSeconds * 1000)
    });
  }

  get(key: string): StoreData | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }
    return entry.data;
  }

  clear(key?: string) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }
}

const storeCache = new SimpleCache();
const STORE_CACHE_TTL = 600; // 10 minutes in seconds

// ============================================================================
// STORE DATA TYPES
// ============================================================================
interface StoreData {
  id: string;
  slug: string;
  name: string;
  subdomain: string | null;
  customDomain: string | null;
  organizationId: string;
}

// ============================================================================
// SUBDOMAIN EXTRACTION
// ============================================================================

/**
 * Extract subdomain from hostname
 * Examples:
 * - vendor1.stormcom.app → vendor1
 * - vendor1.localhost → vendor1
 * - vendor.com → null (handled separately as custom domain)
 * - www.stormcom.app → www (filtered out later)
 * - stormcom.app → null
 */
function extractSubdomain(hostname: string): string | null {
  // Remove port if present
  const host = hostname.split(':')[0];

  // Development: vendor1.localhost
  if (host.endsWith('.localhost')) {
    const subdomain = host.replace('.localhost', '');
    return subdomain || null;
  }

  // Production: vendor1.stormcom.app or vendor1.domain.com
  const parts = host.split('.');
  
  // Three or more parts: subdomain.domain.tld
  if (parts.length >= 3) {
    return parts[0];
  }

  // Two parts could be a custom domain (vendor.com) - handled separately
  return null;
}

/**
 * Check if hostname is a potential custom domain
 * Examples:
 * - vendor.com → true
 * - stormcom.app → false (root domain)
 * - vendor1.stormcom.app → false (has subdomain)
 */
function isPotentialCustomDomain(hostname: string): boolean {
  const host = hostname.split(':')[0];
  
  // Skip localhost variations
  if (host === 'localhost' || host.endsWith('.localhost')) {
    return false;
  }

  const parts = host.split('.');
  
  // Custom domain is exactly two parts (e.g., vendor.com)
  // And not the root stormcom.app domain
  const rootDomains = ['stormcom.app', 'stormcom.com', 'localhost'];
  if (parts.length === 2 && !rootDomains.includes(host)) {
    return true;
  }

  return false;
}

// ============================================================================
// STORE DATA FETCHING (Edge-compatible)
// ============================================================================

/**
 * Get store by subdomain or custom domain
 * Uses internal API route to fetch store data (Edge-compatible)
 */
async function getStoreBySubdomainOrDomain(
  subdomain: string | null,
  hostname: string,
  baseUrl: string
): Promise<StoreData | null> {
  // Create cache key based on hostname
  const cacheKey = `store:${hostname.split(':')[0]}`;
  
  // Check cache first
  const cached = storeCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    // Use internal API to fetch store data
    // This API route has Prisma access and returns minimal store data
    const cleanHost = hostname.split(':')[0];
    const apiUrl = `${baseUrl}/api/stores/lookup?subdomain=${subdomain || ''}&host=${cleanHost}`;
    
    const response = await fetch(apiUrl, {
      headers: {
        'x-internal-request': 'true', // Mark as internal request
      },
    });

    if (!response.ok) {
      return null;
    }

    const store = await response.json() as StoreData;
    
    if (store && store.id) {
      storeCache.set(cacheKey, store, STORE_CACHE_TTL);
      return store;
    }

    return null;
  } catch {
    // If API fails, return null (store not found)
    return null;
  }
}

// ============================================================================
// MIDDLEWARE LOGIC
// ============================================================================

export async function middleware(req: NextRequest) {
  const url = req.nextUrl;
  const hostname = req.headers.get('host') || '';
  const pathname = url.pathname;

  // -------------------------------------------------------------------------
  // 1. Skip middleware for static files and API routes (except store lookup)
  // -------------------------------------------------------------------------
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.startsWith('/api/auth') ||
    pathname.includes('.') // Static files with extensions
  ) {
    return NextResponse.next();
  }

  // -------------------------------------------------------------------------
  // 2. Check if this is a protected admin route (NextAuth protection)
  // -------------------------------------------------------------------------
  const protectedPaths = [
    '/dashboard',
    '/settings',
    '/team',
    '/projects',
    '/products',
  ];

  const isProtectedRoute = protectedPaths.some(path => 
    pathname.startsWith(path)
  );

  if (isProtectedRoute) {
    // Verify authentication for protected routes
    const token = await getToken({ 
      req, 
      secret: process.env.NEXTAUTH_SECRET 
    });

    if (!token) {
      const signInUrl = new URL('/login', req.url);
      signInUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(signInUrl);
    }

    // User is authenticated, continue to the protected route
    return NextResponse.next();
  }

  // -------------------------------------------------------------------------
  // 3. Extract subdomain for storefront routing
  // -------------------------------------------------------------------------
  const subdomain = extractSubdomain(hostname);
  const isCustomDomain = isPotentialCustomDomain(hostname);

  // Skip subdomain logic for:
  // - Root domain (no subdomain)
  // - www subdomain
  // - Auth routes
  // - API routes (handled above for /api/auth, but let other API routes through)
  // - Store routes (already rewritten)
  // - Onboarding routes
  if (
    (!subdomain && !isCustomDomain) ||
    subdomain === 'www' ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/signup') ||
    pathname.startsWith('/verify-email') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/store') ||
    pathname.startsWith('/store-not-found') ||
    pathname.startsWith('/onboarding') ||
    pathname.startsWith('/checkout')
  ) {
    return NextResponse.next();
  }

  // -------------------------------------------------------------------------
  // 4. Load store by subdomain or custom domain
  // -------------------------------------------------------------------------
  const baseUrl = `${url.protocol}//${hostname}`;
  const store = await getStoreBySubdomainOrDomain(subdomain, hostname, baseUrl);

  if (!store) {
    // Redirect to store-not-found page for invalid subdomain/domain
    const notFoundUrl = new URL('/store-not-found', req.url);
    notFoundUrl.searchParams.set('domain', hostname.split(':')[0]);
    return NextResponse.rewrite(notFoundUrl);
  }

  // -------------------------------------------------------------------------
  // 5. Rewrite URL to store route with slug
  // Example: vendor1.stormcom.app/products → /store/vendor1/products
  // -------------------------------------------------------------------------
  const storePath = pathname === '/' ? '' : pathname;
  const storeUrl = new URL(`/store/${store.slug}${storePath}`, req.url);
  
  // Preserve query parameters
  storeUrl.search = url.search;
  
  // Note: Hash fragments are not available server-side, but they are 
  // preserved client-side automatically

  // -------------------------------------------------------------------------
  // 6. Create response with store data in headers
  // -------------------------------------------------------------------------
  const response = NextResponse.rewrite(storeUrl);
  
  // Pass store data via headers for use in Server Components
  response.headers.set('x-store-id', store.id);
  response.headers.set('x-store-slug', store.slug);
  response.headers.set('x-store-name', encodeURIComponent(store.name));
  response.headers.set('x-store-organization-id', store.organizationId);

  return response;
}

// ============================================================================
// MIDDLEWARE CONFIGURATION
// ============================================================================
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (browser icon)
     * - sitemap.xml, robots.txt (SEO files)
     * - Public folder files with extensions
     */
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
