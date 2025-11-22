/**
 * Product Reviews Summary API
 * 
 * Public endpoint for getting product review statistics.
 */

import { NextRequest, NextResponse } from 'next/server';
import { ReviewService } from '@/lib/services/review.service';
import { z } from 'zod';

const ListReviewsQuerySchema = z.object({
  storeId: z.string(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  sortBy: z.enum(['rating', 'createdAt', 'updatedAt']).optional(),
  sortOrder: z.enum(['asc', 'desc']).optional(),
});

/**
 * GET /api/products/[id]/reviews
 * Get product reviews and statistics
 */
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: productId } = await context.params;
    const { searchParams } = new URL(request.url);
    const params = Object.fromEntries(searchParams.entries());

    const query = ListReviewsQuerySchema.parse(params);

    if (!query.storeId) {
      return NextResponse.json(
        { error: 'Store ID is required' },
        { status: 400 }
      );
    }

    const reviewService = ReviewService.getInstance();

    // Get rating stats
    const stats = await reviewService.getProductRatingStats(productId, query.storeId);

    // Get approved reviews
    const reviewsResult = await reviewService.listReviews(query.storeId, {
      productId,
      isApproved: true,
      page: query.page || 1,
      limit: query.limit || 20,
      sortBy: query.sortBy || 'createdAt',
      sortOrder: query.sortOrder || 'desc',
    });

    return NextResponse.json(
      {
        stats,
        reviews: reviewsResult.reviews,
        pagination: reviewsResult.pagination,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error fetching product reviews:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid query parameters', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to fetch product reviews' },
      { status: 500 }
    );
  }
}
