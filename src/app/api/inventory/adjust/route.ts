// src/app/api/inventory/adjust/route.ts
// Inventory Adjustment API Endpoint

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { InventoryService } from '@/lib/services/inventory.service';
import { z } from 'zod';

const adjustStockSchema = z.object({
  storeId: z.string(),
  productId: z.string(),
  quantity: z.number().int().nonnegative(),
  type: z.enum(['ADD', 'REMOVE', 'SET']),
  reason: z.string().min(1),
  note: z.string().optional(),
});

// POST /api/inventory/adjust - Adjust product stock levels
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = adjustStockSchema.parse(body);

    const { storeId, ...adjustment } = validatedData;

    const inventoryService = InventoryService.getInstance();
    const updatedItem = await inventoryService.adjustStock(storeId, {
      ...adjustment,
      userId: session.user.id,
    });

    return NextResponse.json({
      data: updatedItem,
      message: 'Stock adjusted successfully',
    });
  } catch (error) {
    console.error('POST /api/inventory/adjust error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validation error',
          details: error.issues,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: 'Failed to adjust stock',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
