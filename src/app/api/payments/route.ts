/**
 * GET /api/payments
 *
 * Get payment attempts for an order
 *
 * Query Parameters:
 *   - storeId: string (required)
 *   - orderId: string (required)
 *
 * Returns:
 *   - 200: List of payment attempts with transactions
 *   - 400: Missing required parameters
 *   - 401: Unauthorized
 *   - 500: Server error
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { PaymentService } from '@/lib/services/payment.service';
import { z } from 'zod';

const querySchema = z.object({
  storeId: z.string().cuid(),
  orderId: z.string().cuid(),
});

export async function GET(request: NextRequest) {
  try {
    // Auth check
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const params = querySchema.parse({
      storeId: searchParams.get('storeId'),
      orderId: searchParams.get('orderId'),
    });

    // Get payment attempts
    const paymentService = PaymentService.getInstance();
    const attempts = await paymentService.getAttemptsByOrderId(
      params.orderId,
      params.storeId
    );

    return NextResponse.json({
      attempts: attempts.map((attempt) => ({
        id: attempt.id,
        storeId: attempt.storeId,
        orderId: attempt.orderId,
        provider: attempt.provider,
        providerReference: attempt.providerReference,
        status: attempt.status,
        amount: attempt.amount,
        currency: attempt.currency,
        idempotencyKey: attempt.idempotencyKey,
        attemptCount: attempt.attemptCount,
        lastErrorCode: attempt.lastErrorCode,
        lastErrorMessage: attempt.lastErrorMessage,
        nextRetryAt: attempt.nextRetryAt,
        createdAt: attempt.createdAt,
        updatedAt: attempt.updatedAt,
        transactions: attempt.transactions.map((t) => ({
          id: t.id,
          type: t.type,
          amount: t.amount,
          currency: t.currency,
          providerReference: t.providerReference,
          createdAt: t.createdAt,
        })),
      })),
      total: attempts.length,
    });
  } catch (error) {
    console.error('GET /api/payments error:', error);

    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation error', details: error.issues },
        { status: 400 }
      );
    }

    if (error instanceof Error) {
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to fetch payment attempts' },
      { status: 500 }
    );
  }
}
