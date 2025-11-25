import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Store lookup API for subdomain routing middleware
 * This endpoint is called by the middleware to fetch store data
 * based on subdomain or custom domain
 * 
 * GET /api/stores/lookup?subdomain=vendor1&host=vendor1.stormcom.app
 */
export async function GET(request: NextRequest) {
  // Verify this is an internal request from middleware
  const internalRequest = request.headers.get('x-internal-request');
  if (internalRequest !== 'true') {
    return NextResponse.json(
      { error: 'Unauthorized' },
      { status: 401 }
    );
  }

  const { searchParams } = new URL(request.url);
  const subdomain = searchParams.get('subdomain');
  const host = searchParams.get('host');

  if (!subdomain && !host) {
    return NextResponse.json(
      { error: 'subdomain or host parameter required' },
      { status: 400 }
    );
  }

  try {
    // Build query conditions
    const whereConditions = [];

    // Check by subdomain if provided
    if (subdomain) {
      whereConditions.push({ subdomain: subdomain });
    }

    // Check by custom domain using the full host
    if (host) {
      whereConditions.push({ customDomain: host });
    }

    // Query database for matching store
    const store = await prisma.store.findFirst({
      where: {
        OR: whereConditions,
        deletedAt: null,
      },
      select: {
        id: true,
        slug: true,
        name: true,
        subdomain: true,
        customDomain: true,
        organizationId: true,
      },
    });

    if (!store) {
      return NextResponse.json(
        { error: 'Store not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(store);
  } catch (error) {
    console.error('Store lookup error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
