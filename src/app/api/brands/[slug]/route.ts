// src/app/api/brands/[slug]/route.ts
// Brand Detail API Routes - Get, Update, Delete by slug

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { BrandService } from '@/lib/services/brand.service';
import { getCurrentStoreId } from '@/lib/get-current-user';
import { z } from 'zod';

// GET /api/brands/[slug] - Get brand by slug
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = await getCurrentStoreId();
    if (!storeId) {
      return NextResponse.json({ error: 'No store found for user' }, { status: 400 });
    }

    const brandService = BrandService.getInstance();
    const brand = await brandService.getBrandBySlug(params.slug, storeId);

    if (!brand) {
      return NextResponse.json({ error: 'Brand not found' }, { status: 404 });
    }

    return NextResponse.json(brand);
  } catch (error) {
    console.error(`GET /api/brands/${params.slug} error:`, error);
    return NextResponse.json({ error: 'Failed to fetch brand' }, { status: 500 });
  }
}

// PATCH /api/brands/[slug] - Update brand
export async function PATCH(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = await getCurrentStoreId();
    if (!storeId) {
      return NextResponse.json({ error: 'No store found for user' }, { status: 400 });
    }

    const body = await request.json();
    const brandService = BrandService.getInstance();
    
    const updated = await brandService.updateBrand(
      storeId,
      params.slug,
      body
    );

    return NextResponse.json(updated);
  } catch (error) {
    console.error(`PATCH /api/brands/${params.slug} error:`, error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to update brand' }, { status: 500 });
  }
}

// DELETE /api/brands/[slug] - Delete brand
export async function DELETE(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const storeId = await getCurrentStoreId();
    if (!storeId) {
      return NextResponse.json({ error: 'No store found for user' }, { status: 400 });
    }

    const brandService = BrandService.getInstance();
    await brandService.deleteBrand(storeId, params.slug);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`DELETE /api/brands/${params.slug} error:`, error);
    
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to delete brand' }, { status: 500 });
  }
}
