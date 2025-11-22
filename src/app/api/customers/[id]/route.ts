/**
 * Customer Detail API Route
 * 
 * Provides endpoints for individual customer operations including
 * retrieving, updating, and deleting customers.
 * 
 * @module app/api/customers/[id]/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { CustomerService } from '@/lib/services/customer.service';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

type RouteContext = {
  params: Promise<{ id: string }>;
};

/**
 * Update customer schema
 */
const UpdateCustomerSchema = z.object({
  storeId: z.string().cuid(),
  email: z.string().email().optional(),
  firstName: z.string().min(1).optional(),
  lastName: z.string().min(1).optional(),
  phone: z.string().optional(),
  acceptsMarketing: z.boolean().optional(),
});

/**
 * GET /api/customers/[id]
 * 
 * Get customer by ID
 * 
 * @returns 200 - Customer details
 * @returns 401 - Unauthorized
 * @returns 404 - Customer not found
 * @returns 500 - Internal Server Error
 */
export async function GET(
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
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json(
        { error: 'storeId is required' },
        { status: 400 }
      );
    }

    const customerService = CustomerService.getInstance();
    const customer = await customerService.getById(params.id, storeId);

    if (!customer) {
      return NextResponse.json(
        { error: 'Customer not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { data: customer },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error retrieving customer:', error);
    return NextResponse.json(
      { error: 'Failed to retrieve customer' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/customers/[id]
 * 
 * Update customer
 * 
 * @returns 200 - Customer updated successfully
 * @returns 401 - Unauthorized
 * @returns 400 - Bad Request
 * @returns 404 - Customer not found
 * @returns 500 - Internal Server Error
 */
export async function PUT(
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

    const validationResult = UpdateCustomerSchema.safeParse(body);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid request data',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { storeId, ...updateData } = validationResult.data;

    const customerService = CustomerService.getInstance();
    const customer = await customerService.update(params.id, storeId, updateData);

    return NextResponse.json(
      {
        data: customer,
        message: 'Customer updated successfully',
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error updating customer:', error);

    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        return NextResponse.json(
          { error: error.message },
          { status: 404 }
        );
      }
      if (error.message.includes('already in use')) {
        return NextResponse.json(
          { error: error.message },
          { status: 409 }
        );
      }
    }

    return NextResponse.json(
      { error: 'Failed to update customer' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/customers/[id]
 * 
 * Delete customer (soft delete)
 * 
 * @returns 200 - Customer deleted successfully
 * @returns 401 - Unauthorized
 * @returns 404 - Customer not found
 * @returns 500 - Internal Server Error
 */
export async function DELETE(
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
    const { searchParams } = new URL(request.url);
    const storeId = searchParams.get('storeId');

    if (!storeId) {
      return NextResponse.json(
        { error: 'storeId is required' },
        { status: 400 }
      );
    }

    const customerService = CustomerService.getInstance();
    await customerService.delete(params.id, storeId);

    return NextResponse.json(
      { message: 'Customer deleted successfully' },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error deleting customer:', error);

    if (error instanceof Error && error.message.includes('not found')) {
      return NextResponse.json(
        { error: error.message },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to delete customer' },
      { status: 500 }
    );
  }
}
