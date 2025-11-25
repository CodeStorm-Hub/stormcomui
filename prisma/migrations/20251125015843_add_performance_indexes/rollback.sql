-- Rollback script for add_performance_indexes migration
-- Use this to rollback the changes if needed
-- WARNING: This will remove indexes and columns added in this migration

-- Drop indexes first (safe to drop as they don't affect data)
DROP INDEX IF EXISTS "Category_slug_idx";
DROP INDEX IF EXISTS "Category_storeId_slug_idx";
DROP INDEX IF EXISTS "Order_storeId_status_createdAt_idx";
DROP INDEX IF EXISTS "Order_customerId_createdAt_idx";
DROP INDEX IF EXISTS "Product_sku_idx";
DROP INDEX IF EXISTS "Product_storeId_createdAt_idx";

-- Note: SQLite doesn't support ALTER TABLE DROP COLUMN directly
-- To rollback column changes, you would need to recreate the tables
-- For Order.estimatedDelivery and Product.archivedAt columns:
-- 
-- Option 1: Keep the columns (they're nullable, so no impact)
-- Option 2: Recreate tables without the columns (complex, data migration required)
--
-- Since these columns are nullable DateTime fields, keeping them has no
-- negative impact on the application. The columns will simply be unused
-- if you need to rollback functionality.
--
-- For production rollback, consider using Prisma's migrate reset or
-- a proper database migration tool.
