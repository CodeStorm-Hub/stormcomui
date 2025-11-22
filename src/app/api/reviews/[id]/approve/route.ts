/**
 * Review Approval API
 * 
 * Admin endpoint for approving reviews.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { ReviewService } from '@/lib/services/review.service';
import { z } from 'zod';

const ApproveReviewSchema = z.object({
  storeId: z.string(),
});

/**
 * POST /api/reviews/[id]/approve
 * Approve a review
 */
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = await context.params;
    const body = await request.json();
    const data = ApproveReviewSchema.parse(body);

    const reviewService = ReviewService.getInstance();
    const review = await reviewService.approveReview(id, data.storeId);

    return NextResponse.json(review, { status: 200 });
  } catch (error) {
    console.error('Error approving review:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === 'Review not found') {
      return NextResponse.json(
        { error: 'Review not found' },
        { status: 404 }
      );
    }
    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to approve review' },
      { status: 500 }
    );
  }
}
