/**
 * Audit Logs API Route
 * 
 * Provides endpoints for retrieving audit logs with filtering and pagination.
 * Supports filtering by store, user, entity type, action, and date range.
 * 
 * @module app/api/audit-logs/route
 */

import { NextRequest, NextResponse } from 'next/server';
import { AuditLogService } from '@/lib/services/audit-log.service';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

/**
 * Query parameters schema for GET /api/audit-logs
 */
const AuditLogsQuerySchema = z.object({
  storeId: z.string().optional(),
  userId: z.string().optional(),
  entityType: z.string().optional(),
  entityId: z.string().optional(),
  action: z.enum(['CREATE', 'UPDATE', 'DELETE']).optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
});

/**
 * GET /api/audit-logs
 * 
 * Retrieve audit logs with optional filters and pagination.
 * Requires authentication.
 * 
 * Query Parameters:
 * - storeId (optional): Filter by store ID
 * - userId (optional): Filter by user ID
 * - entityType (optional): Filter by entity type (Product, Order, User, etc.)
 * - entityId (optional): Filter by specific entity ID
 * - action (optional): Filter by action (CREATE, UPDATE, DELETE)
 * - startDate (optional): Filter logs created after this date (ISO 8601)
 * - endDate (optional): Filter logs created before this date (ISO 8601)
 * - page (optional): Page number (default: 1)
 * - limit (optional): Results per page (default: 50, max: 100)
 * 
 * @returns 200 - Paginated audit logs
 * @returns 401 - Unauthorized (not authenticated)
 * @returns 400 - Bad Request (invalid parameters)
 * @returns 500 - Internal Server Error
 */
export async function GET(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        {
          error: 'Authentication required',
        },
        { status: 401 }
      );
    }

    // Parse and validate query parameters
    const { searchParams } = new URL(request.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    const validationResult = AuditLogsQuerySchema.safeParse(queryParams);
    if (!validationResult.success) {
      return NextResponse.json(
        {
          error: 'Invalid query parameters',
          details: validationResult.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const filters = validationResult.data;

    // Convert date strings to Date objects
    const processedFilters = {
      ...filters,
      startDate: filters.startDate ? new Date(filters.startDate) : undefined,
      endDate: filters.endDate ? new Date(filters.endDate) : undefined,
    };

    // Retrieve audit logs
    const auditLogService = AuditLogService.getInstance();
    const result = await auditLogService.getAll(processedFilters);

    return NextResponse.json(
      {
        data: result.logs,
        meta: {
          total: result.total,
          page: result.page,
          perPage: result.limit,
          totalPages: result.totalPages,
        },
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Error retrieving audit logs:', error);

    // Handle specific errors
    if (error instanceof Error) {
      if (error.message.includes('page must be') || error.message.includes('limit must be')) {
        return NextResponse.json(
          {
            error: error.message,
          },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      {
        error: 'Failed to retrieve audit logs',
      },
      { status: 500 }
    );
  }
}
