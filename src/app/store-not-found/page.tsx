import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Store Not Found",
  description: "The store you are looking for does not exist or has been removed.",
};

/**
 * 404 page for non-existent stores
 * Shown when a subdomain doesn't match any active store
 */
export default function StoreNotFoundPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center px-4">
        {/* 404 Icon */}
        <div className="text-8xl mb-6">🏪</div>

        {/* Main Message */}
        <h1 className="text-4xl font-bold mb-4">Store Not Found</h1>
        <p className="text-lg text-muted-foreground mb-8 max-w-md mx-auto">
          The store you are looking for does not exist, has been removed, or the
          subdomain is incorrect.
        </p>

        {/* Suggestions */}
        <div className="space-y-4 mb-8">
          <p className="text-sm text-muted-foreground">Here are some things you can try:</p>
          <ul className="text-sm text-muted-foreground list-disc list-inside space-y-2">
            <li>Check the URL for typos</li>
            <li>Make sure you have the correct subdomain</li>
            <li>Contact the store owner if you believe this is an error</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-6 py-3 text-sm font-medium text-primary-foreground shadow hover:bg-primary/90"
          >
            Go to Homepage
          </Link>
          <Link
            href="/signup"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-6 py-3 text-sm font-medium shadow-sm hover:bg-accent hover:text-accent-foreground"
          >
            Create Your Store
          </Link>
        </div>

        {/* Help Link */}
        <p className="mt-8 text-sm text-muted-foreground">
          Need help?{" "}
          <a href="mailto:support@stormcom.app" className="text-primary hover:underline">
            Contact Support
          </a>
        </p>
      </div>
    </div>
  );
}
