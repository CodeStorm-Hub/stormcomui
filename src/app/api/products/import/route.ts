// src/app/api/products/import/route.ts
// CSV Bulk Import API Route for Products

import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { ProductService } from '@/lib/services/product.service';

// Constants for import limits
const MAX_PRODUCTS_PER_IMPORT = 1000;
const MAX_ERRORS_RETURNED = 50;

/**
 * POST /api/products/import - Bulk import products from CSV
 * 
 * Request body should be JSON with:
 * - storeId: string (required)
 * - products: Array of product objects with CSV column mappings
 * 
 * Expected CSV columns:
 * - name (required)
 * - sku (auto-generated if not provided)
 * - price (required)
 * - description
 * - short_description
 * - compare_at_price
 * - cost_price
 * - inventory_qty / stock
 * - low_stock_threshold
 * - weight
 * - barcode
 * - status (DRAFT, ACTIVE, ARCHIVED)
 * - is_featured (true/false)
 * - images (comma-separated URLs)
 */
export async function POST(request: NextRequest) {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Parse request body
    const body = await request.json();
    const { storeId, products } = body;

    // Validate required fields
    if (!storeId) {
      return NextResponse.json(
        { error: 'storeId is required' },
        { status: 400 }
      );
    }

    if (!products || !Array.isArray(products)) {
      return NextResponse.json(
        { error: 'products array is required' },
        { status: 400 }
      );
    }

    if (products.length === 0) {
      return NextResponse.json(
        { error: 'products array cannot be empty' },
        { status: 400 }
      );
    }

    // Limit products per import for performance
    if (products.length > MAX_PRODUCTS_PER_IMPORT) {
      return NextResponse.json(
        { error: `Maximum ${MAX_PRODUCTS_PER_IMPORT} products per import. Please split into multiple batches.` },
        { status: 400 }
      );
    }

    // Start timer for performance tracking
    const startTime = Date.now();

    // Perform bulk import
    const productService = ProductService.getInstance();
    const result = await productService.bulkImport(storeId, products);

    const duration = Date.now() - startTime;

    // Determine appropriate HTTP status code
    // 201: All succeeded, 207: Partial success (multi-status), 400: All failed
    let statusCode = 201;
    if (result.errorCount > 0 && result.successCount > 0) {
      statusCode = 207; // Multi-Status for partial success
    } else if (result.errorCount > 0 && result.successCount === 0) {
      statusCode = 400; // All failed
    }

    // Return import result
    return NextResponse.json({
      success: result.successCount > 0,
      message: `Imported ${result.successCount} products successfully${result.errorCount > 0 ? `, ${result.errorCount} failed` : ''}`,
      data: {
        successCount: result.successCount,
        errorCount: result.errorCount,
        totalProcessed: products.length,
        durationMs: duration,
        errors: result.errors.length > 0 ? result.errors.slice(0, MAX_ERRORS_RETURNED) : [],
      },
    }, { status: statusCode });

  } catch (error) {
    console.error('POST /api/products/import error:', error);
    
    return NextResponse.json(
      { 
        error: 'Failed to import products',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/products/import - Get import template/documentation
 */
export async function GET() {
  return NextResponse.json({
    template: {
      description: 'CSV Import Template for Products',
      requiredColumns: ['name', 'price'],
      optionalColumns: [
        'sku',
        'description',
        'short_description',
        'compare_at_price',
        'cost_price',
        'inventory_qty',
        'low_stock_threshold',
        'weight',
        'barcode',
        'status',
        'is_featured',
        'images',
      ],
      columnMappings: {
        name: 'Product name (required)',
        sku: 'Stock Keeping Unit - auto-generated if not provided',
        price: 'Product price (required)',
        description: 'Full product description',
        short_description: 'Short description for listings',
        compare_at_price: 'Original/compare price for sale items',
        cost_price: 'Cost price for profit calculations',
        inventory_qty: 'Initial stock quantity (default: 0)',
        low_stock_threshold: 'Low stock alert threshold (default: 5)',
        weight: 'Product weight for shipping',
        barcode: 'Barcode/UPC',
        status: 'DRAFT, ACTIVE, or ARCHIVED (default: DRAFT)',
        is_featured: 'true or false (default: false)',
        images: 'Comma-separated image URLs',
      },
      exampleRow: {
        name: 'Sample Product',
        sku: 'SAMPLE-001',
        price: '29.99',
        description: 'This is a sample product description',
        inventory_qty: '100',
        status: 'ACTIVE',
        is_featured: 'true',
        images: 'https://example.com/image1.jpg,https://example.com/image2.jpg',
      },
      limits: {
        maxProductsPerImport: 1000,
        maxImagesPerProduct: 10,
        targetImportSpeed: '1000 products in <30 seconds',
      },
    },
  });
}
