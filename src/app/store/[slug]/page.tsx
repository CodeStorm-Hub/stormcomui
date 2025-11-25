import { headers } from 'next/headers';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import Link from 'next/link';
import { ProductStatus } from '@prisma/client';

/**
 * Store Homepage
 * Displays featured products and store information
 */
export default async function StoreHomePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  // Get store info from headers (set by middleware)
  const headersList = await headers();
  const storeId = headersList.get('x-store-id');
  
  // Await params for Next.js 16+
  const { slug } = await params;

  // Get the store ID (from headers or by looking up slug)
  let effectiveStoreId = storeId;
  
  if (!effectiveStoreId) {
    // Fallback: look up store by slug
    const store = await prisma.store.findUnique({
      where: { slug, deletedAt: null },
      select: { id: true },
    });
    
    if (!store) {
      notFound();
    }
    
    effectiveStoreId = store.id;
  }

  // Fetch featured products
  const products = await prisma.product.findMany({
    where: {
      storeId: effectiveStoreId,
      isFeatured: true,
      status: ProductStatus.ACTIVE,
      deletedAt: null,
    },
    select: {
      id: true,
      name: true,
      slug: true,
      price: true,
      compareAtPrice: true,
      thumbnailUrl: true,
      shortDescription: true,
    },
    take: 12,
    orderBy: { createdAt: 'desc' },
  });

  // Fetch categories for navigation
  const categories = await prisma.category.findMany({
    where: {
      storeId: effectiveStoreId,
      isPublished: true,
      deletedAt: null,
      parentId: null, // Only top-level categories
    },
    select: {
      id: true,
      name: true,
      slug: true,
      image: true,
    },
    take: 6,
    orderBy: { sortOrder: 'asc' },
  });

  // Fetch store details
  const store = await prisma.store.findUnique({
    where: { id: effectiveStoreId },
    select: {
      name: true,
      description: true,
      currency: true,
    },
  });

  if (!store) {
    notFound();
  }

  // Format price based on store currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: store.currency,
    }).format(price);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Hero Section */}
      <section className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl">
          Welcome to {store.name}
        </h1>
        {store.description && (
          <p className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground">
            {store.description}
          </p>
        )}
        <div className="mt-8 flex flex-wrap justify-center gap-4">
          <Link
            href={`/store/${slug}/products`}
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Shop All Products
          </Link>
          <Link
            href={`/store/${slug}/categories`}
            className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Browse Categories
          </Link>
        </div>
      </section>

      {/* Categories Section */}
      {categories.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold">Shop by Category</h2>
            <Link
              href={`/store/${slug}/categories`}
              className="text-sm font-medium text-primary hover:underline"
            >
              View All Categories
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            {categories.map((category) => (
              <Link
                key={category.id}
                href={`/store/${slug}/categories/${category.slug}`}
                className="group relative flex flex-col items-center justify-center rounded-lg border bg-card p-6 text-center transition-colors hover:bg-accent"
              >
                {category.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={category.image}
                    alt={category.name}
                    className="mb-3 h-16 w-16 rounded-md object-cover"
                  />
                ) : (
                  <div className="mb-3 flex h-16 w-16 items-center justify-center rounded-md bg-muted">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="text-muted-foreground"
                    >
                      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                  </div>
                )}
                <span className="font-medium group-hover:text-primary">
                  {category.name}
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured Products Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Featured Products</h2>
          <Link
            href={`/store/${slug}/products`}
            className="text-sm font-medium text-primary hover:underline"
          >
            View All Products
          </Link>
        </div>
        
        {products.length > 0 ? (
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
            {products.map((product) => (
              <Link
                key={product.id}
                href={`/store/${slug}/products/${product.slug}`}
                className="group rounded-lg border bg-card overflow-hidden transition-all hover:shadow-lg"
              >
                {/* Product Image */}
                <div className="aspect-square relative overflow-hidden bg-muted">
                  {product.thumbnailUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={product.thumbnailUrl}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="48"
                        height="48"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="1"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        className="text-muted-foreground/50"
                      >
                        <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                        <circle cx="9" cy="9" r="2" />
                        <path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21" />
                      </svg>
                    </div>
                  )}
                  
                  {/* Sale Badge */}
                  {product.compareAtPrice && product.compareAtPrice > product.price && (
                    <span className="absolute top-2 left-2 rounded-full bg-destructive px-2 py-1 text-xs font-medium text-destructive-foreground">
                      Sale
                    </span>
                  )}
                </div>

                {/* Product Info */}
                <div className="p-4">
                  <h3 className="font-medium line-clamp-1 group-hover:text-primary">
                    {product.name}
                  </h3>
                  {product.shortDescription && (
                    <p className="mt-1 text-sm text-muted-foreground line-clamp-2">
                      {product.shortDescription}
                    </p>
                  )}
                  <div className="mt-2 flex items-center gap-2">
                    <span className="font-bold">
                      {formatPrice(product.price)}
                    </span>
                    {product.compareAtPrice && product.compareAtPrice > product.price && (
                      <span className="text-sm text-muted-foreground line-through">
                        {formatPrice(product.compareAtPrice)}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-lg border bg-card p-12 text-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="mx-auto text-muted-foreground/50"
            >
              <circle cx="8" cy="21" r="1" />
              <circle cx="19" cy="21" r="1" />
              <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
            </svg>
            <h3 className="mt-4 text-lg font-medium">No products yet</h3>
            <p className="mt-2 text-sm text-muted-foreground">
              Check back soon for new products!
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
