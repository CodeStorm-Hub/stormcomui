"use client";

// src/components/orders-page-client.tsx
// Client wrapper for orders page

import { useState } from 'react';
import { StoreSelector } from '@/components/store-selector';
import { OrdersTable } from '@/components/orders-table';

export function OrdersPageClient() {
  const [storeId, setStoreId] = useState<string>('');

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <label className="text-sm font-medium">Store:</label>
        <StoreSelector onStoreChange={setStoreId} />
      </div>

      {storeId ? (
        <OrdersTable storeId={storeId} />
      ) : (
        <div className="rounded-lg border bg-card p-12 text-center">
          <p className="text-sm text-muted-foreground">
            Select a store to view orders
          </p>
        </div>
      )}
    </div>
  );
}
