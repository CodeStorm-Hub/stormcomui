import Link from 'next/link';

/**
 * Store Not Found Page
 * Displayed when a user accesses a subdomain/custom domain that doesn't exist
 */
export default async function StoreNotFoundPage({
  searchParams,
}: {
  searchParams: Promise<{ domain?: string }>;
}) {
  const { domain } = await searchParams;
  
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="text-center max-w-md">
        {/* 404 Icon */}
        <div className="mx-auto mb-8 flex h-24 w-24 items-center justify-center rounded-full bg-muted">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="text-muted-foreground"
          >
            <path d="M3 3v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V3" />
            <path d="M7 3v18" />
            <path d="M21 3v7c0 1.1-.9 2-2 2h-4a2 2 0 0 1-2-2V3" />
            <path d="M17 3v18" />
            <path d="M5 21h4" />
            <path d="M15 21h4" />
          </svg>
        </div>

        {/* Error Message */}
        <h1 className="text-4xl font-bold tracking-tight">
          Store Not Found
        </h1>
        
        <p className="mt-4 text-lg text-muted-foreground">
          {domain ? (
            <>
              The store at <code className="rounded bg-muted px-2 py-1 font-mono text-sm">{domain}</code> doesn&apos;t exist or has been removed.
            </>
          ) : (
            <>
              The store you&apos;re looking for doesn&apos;t exist or has been removed.
            </>
          )}
        </p>

        {/* Suggestions */}
        <div className="mt-8 space-y-4">
          <p className="text-sm text-muted-foreground">
            Here are some things you can try:
          </p>
          <ul className="text-sm text-muted-foreground space-y-2">
            <li>• Check the URL for typos</li>
            <li>• Make sure you have the correct store address</li>
            <li>• Contact the store owner for the correct URL</li>
          </ul>
        </div>

        {/* CTA Buttons */}
        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="inline-flex h-11 items-center justify-center rounded-md bg-primary px-8 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Go to Homepage
          </Link>
          <Link
            href="/login"
            className="inline-flex h-11 items-center justify-center rounded-md border border-input bg-background px-8 text-sm font-medium ring-offset-background transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Sign In
          </Link>
        </div>

        {/* Create Store CTA */}
        <div className="mt-12 rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold">Want to create your own store?</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            StormCom makes it easy to build and manage your online store with powerful e-commerce features.
          </p>
          <Link
            href="/signup"
            className="mt-4 inline-flex h-9 items-center justify-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground ring-offset-background transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Get Started Free
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="mt-16 text-center text-sm text-muted-foreground">
        <p>
          Powered by{' '}
          <a
            href="https://stormcom.app"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium hover:text-primary transition-colors"
          >
            StormCom
          </a>
        </p>
      </footer>
    </div>
  );
}
