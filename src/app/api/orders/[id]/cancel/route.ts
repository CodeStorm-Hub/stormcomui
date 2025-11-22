/**
 * Order Cancel API Route
 * 
 * Handles order cancellation with inventory restoration.
 * 
 * @module app/api/orders/[id]/cancel/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { OrderService } from '@/lib/services/order.service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * Cancel order schema
 */
const CancelOrderSchema = z.object({
  storeId: z.string().cuid(),
  reason: z.string().optional(),
});

/**
 * POST /api/orders/[id]/cancel
 * 
 * Cancel an order and restore inventory
 * 
 * @returns 200 - Order canceled successfully
 * @returns 401 - Unauthorized
 * @returns 400 - Bad Request
 * @returns 404 - Order not found
 * @returns 500 - Internal Server Error
 */
export async function POST(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      );
    }

    const params = await context.params;
    const body = await request.json();

    const validationResult = CancelOrderSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { storeId, reason } = validationResult.data;

    const orderService = OrderService.getInstance();
    const order = await orderService.cancelOrder(params.id, storeId, reason);

    return NextResponse.json(
      {
        data: order,
        message: 'Order canceled successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error canceling order:', error);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }
      if (error.message.includes('Cannot cancel')) {
        return NextResponse.json(
          { error: error.message },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to cancel order' },
      { status: 500 }
    );
  }
}
