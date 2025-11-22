// src/app/api/inventory/route.ts
// Inventory Management API Endpoints

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { InventoryService } from '@/lib/services/inventory.service';

// GET /api/inventory - Retrieve inventory levels with filters
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');
    const search = searchParams.get('search') || undefined;
    const categoryId = searchParams.get('categoryId') || undefined;
    const brandId = searchParams.get('brandId') || undefined;
    const lowStockOnly = searchParams.get('lowStockOnly') === 'true';
    const page = parseInt(searchParams.get('page') || '1', 10);
    const perPage = Math.min(
      parseInt(searchParams.get('perPage') || '20', 10),
      100
    );

    if (!storeId) {
      return NextResponse.json(
        { error: 'storeId is required' },
        { status: 400 }
      );
    }

    // Validate pagination
    if (page < 1) {
      return NextResponse.json(
        { error: 'Page must be >= 1' },
        { status: 400 }
      );
    }

    if (perPage < 1 || perPage > 100) {
      return NextResponse.json(
        { error: 'perPage must be between 1 and 100' },
        { status: 400 }
      );
    }

    // Fetch inventory levels
    const inventoryService = InventoryService.getInstance();
    const { items, total } = await inventoryService.getInventoryLevels(storeId, {
      search,
      categoryId,
      brandId,
      lowStockOnly,
      page,
      perPage,
    });

    const totalPages = Math.ceil(total / perPage);

    return NextResponse.json({
      data: items,
      meta: {
        page,
        perPage,
        total,
        totalPages,
      },
    });
  } catch (error) {
    console.error('GET /api/inventory error:', error);
    return NextResponse.json(
      {
        error: 'Failed to fetch inventory levels',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
