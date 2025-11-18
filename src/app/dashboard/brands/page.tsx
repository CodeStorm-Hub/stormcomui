// src/app/dashboard/brands/page.tsx
// Brands listing page

import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { IconPlus } from '@tabler/icons-react';
import { BrandsPageClient } from '@/components/brands-page-client';
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";
import { getCurrentStoreId } from '@/lib/get-current-user';

export const metadata = {
  title: 'Brands | Dashboard',
  description: 'Manage your product brands',
};

export default async function BrandsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session?.user) {
    redirect('/login');
  }

  const storeId = await getCurrentStoreId();

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "calc(var(--spacing) * 72)",
          "--header-height": "calc(var(--spacing) * 12)",
        } as React.CSSProperties
      }
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="mb-8 flex items-center justify-between">
                  <div>
                    <h1 className="text-3xl font-bold tracking-tight">Brands</h1>
                    <p className="text-muted-foreground">
                      Manage product brands and manufacturers.
                    </p>
                  </div>
                  <Link href="/dashboard/brands/new">
                    <Button className="gap-2">
                      <IconPlus className="size-4" />
                      Add Brand
                    </Button>
                  </Link>
                </div>

                {storeId ? (
                  <BrandsPageClient storeId={storeId} />
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <p className="text-muted-foreground">Select a store to view brands</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
