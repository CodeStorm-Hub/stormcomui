// src/app/api/categories/[slug]/route.ts
// Category Detail API Routes - Get, Update, Delete by slug

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { CategoryService } from '@/lib/services/category.service';
import { getCurrentStoreId } from '@/lib/get-current-user';
import { z } from 'zod';

// GET /api/categories/[slug] - Get category by slug
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

    const categoryService = CategoryService.getInstance();
    const category = await categoryService.getCategoryBySlug(params.slug, storeId);

    if (!category) {
      return NextResponse.json({ error: 'Category not found' }, { status: 404 });
    }

    return NextResponse.json(category);
  } catch (error) {
    console.error(`GET /api/categories/${params.slug} error:`, error);
    return NextResponse.json({ error: 'Failed to fetch category' }, { status: 500 });
  }
}

// PATCH /api/categories/[slug] - Update category
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
    const categoryService = CategoryService.getInstance();
    
    const updated = await categoryService.updateCategory(
      storeId,
      params.slug,
      body
    );

    return NextResponse.json(updated);
  } catch (error) {
    console.error(`PATCH /api/categories/${params.slug} error:`, error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }
    
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to update category' }, { status: 500 });
  }
}

// DELETE /api/categories/[slug] - Delete category
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

    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';

    const categoryService = CategoryService.getInstance();
    await categoryService.deleteCategory(storeId, params.slug, { force });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`DELETE /api/categories/${params.slug} error:`, error);
    
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ error: 'Failed to delete category' }, { status: 500 });
  }
}
