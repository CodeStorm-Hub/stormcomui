import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import Link from 'next/link';

/**
 * Store Layout Component
 * Provides the shell for all storefront pages with header and footer
 * Store data is passed via headers from middleware
 */
export default async function StoreLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  // Get store info from headers (set by middleware)
  const headersList = await headers();
  const storeId = headersList.get('x-store-id');
  const storeSlug = headersList.get('x-store-slug');
  
  // Await params for Next.js 16+
  const { slug } = await params;

  // If no store ID in headers, try to fetch directly by slug
  // This handles direct navigation to /store/[slug]
  let store;
  
  if (storeId) {
    // Fetch full store data using the ID from headers
    store = await prisma.store.findUnique({
      where: { id: storeId, deletedAt: null },
      include: {
        organization: {
          select: { name: true },
        },
      },
    });
  } else {
    // Fallback: fetch by slug from URL params
    store = await prisma.store.findUnique({
      where: { slug: storeSlug || slug, deletedAt: null },
      include: {
        organization: {
          select: { name: true },
        },
      },
    });
  }

  if (!store) {
    notFound();
  }

  const currentYear = new Date().getFullYear();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Store Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-4">
            {/* Store Logo/Name */}
            <Link 
              href={`/store/${store.slug}`}
              className="flex items-center gap-2"
            >
              {store.logo ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={store.logo} 
                  alt={store.name}
                  className="h-8 w-8 rounded-md object-cover"
                />
              ) : (
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground font-semibold">
                  {store.name.charAt(0).toUpperCase()}
                </div>
              )}
              <span className="text-xl font-bold">{store.name}</span>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-6">
            <Link 
              href={`/store/${store.slug}`}
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Home
            </Link>
            <Link 
              href={`/store/${store.slug}/products`}
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Products
            </Link>
            <Link 
              href={`/store/${store.slug}/categories`}
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Categories
            </Link>
            <Link 
              href={`/store/${store.slug}/about`}
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              About
            </Link>
          </nav>

          {/* Mobile Menu / Cart */}
          <div className="flex items-center gap-2">
            <Link
              href={`/store/${store.slug}/cart`}
              className="flex h-9 w-9 items-center justify-center rounded-md border border-input bg-background hover:bg-accent hover:text-accent-foreground"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="8" cy="21" r="1" />
                <circle cx="19" cy="21" r="1" />
                <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
              </svg>
              <span className="sr-only">Cart</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1">
        {children}
      </main>

      {/* Store Footer */}
      <footer className="border-t bg-muted/50">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Store Info */}
            <div>
              <h3 className="mb-4 text-lg font-semibold">{store.name}</h3>
              {store.description && (
                <p className="text-sm text-muted-foreground">
                  {store.description}
                </p>
              )}
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="mb-4 text-lg font-semibold">Quick Links</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li>
                  <Link 
                    href={`/store/${store.slug}/products`}
                    className="hover:text-primary transition-colors"
                  >
                    All Products
                  </Link>
                </li>
                <li>
                  <Link 
                    href={`/store/${store.slug}/categories`}
                    className="hover:text-primary transition-colors"
                  >
                    Categories
                  </Link>
                </li>
                <li>
                  <Link 
                    href={`/store/${store.slug}/about`}
                    className="hover:text-primary transition-colors"
                  >
                    About Us
                  </Link>
                </li>
              </ul>
            </div>

            {/* Contact Info */}
            <div>
              <h3 className="mb-4 text-lg font-semibold">Contact</h3>
              <ul className="space-y-2 text-sm text-muted-foreground">
                {store.email && (
                  <li>
                    <a 
                      href={`mailto:${store.email}`}
                      className="hover:text-primary transition-colors"
                    >
                      {store.email}
                    </a>
                  </li>
                )}
                {store.phone && (
                  <li>
                    <a 
                      href={`tel:${store.phone}`}
                      className="hover:text-primary transition-colors"
                    >
                      {store.phone}
                    </a>
                  </li>
                )}
                {store.address && (
                  <li>{store.address}</li>
                )}
              </ul>
            </div>
          </div>

          <div className="mt-8 border-t pt-8 text-center text-sm text-muted-foreground">
            <p>
              © {currentYear} {store.name}. Powered by{' '}
              <a 
                href="https://stormcom.app" 
                target="_blank" 
                rel="noopener noreferrer"
                className="hover:text-primary transition-colors"
              >
                StormCom
              </a>
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
