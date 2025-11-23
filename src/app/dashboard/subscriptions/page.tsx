import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { SubscriptionsList } from '@/components/subscriptions/subscriptions-list';
import type { Metadata } from 'next';
import { AppSidebar } from "@/components/app-sidebar";
import { SiteHeader } from "@/components/site-header";
import {
  SidebarInset,
  SidebarProvider,
} from "@/components/ui/sidebar";

export const metadata: Metadata = {
  title: 'Subscriptions',
  description: 'Manage your active subscriptions and plans',
};

export default async function SubscriptionsPage() {
  const session = await getServerSession(authOptions);
  
  if (!session) {
    redirect('/login');
  }

  return (
    <SidebarProvider
      style={{
        "--sidebar-width": "calc(var(--spacing) * 72)",
        "--header-height": "calc(var(--spacing) * 12)",
      } as React.CSSProperties}
    >
      <AppSidebar variant="inset" />
      <SidebarInset>
        <SiteHeader />
        <div className="flex flex-1 flex-col">
          <div className="@container/main flex flex-1 flex-col gap-2">
            <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
              <div className="px-4 lg:px-6">
                <div className="flex-1 space-y-4">
                  <div className="flex items-center justify-between space-y-2">
                    <div>
                      <h2 className="text-3xl font-bold tracking-tight">Subscriptions</h2>
                      <p className="text-muted-foreground">
                        Manage your subscription plans and billing
                      </p>
                    </div>
                  </div>
                  <Suspense fallback={<div>Loading subscriptions...</div>}>
                    <SubscriptionsList />
                  </Suspense>
                </div>
              </div>
            </div>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
}
