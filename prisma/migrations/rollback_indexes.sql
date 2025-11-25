-- Rollback script for add_performance_indexes_and_fields migration
-- Use this if you need to revert the schema changes
-- Run with: sqlite3 prisma/dev.db < prisma/migrations/rollback_indexes.sql

-- Drop new indexes
DROP INDEX IF EXISTS "Category_slug_idx";
DROP INDEX IF EXISTS "Category_storeId_slug_idx";
DROP INDEX IF EXISTS "Customer_email_storeId_idx";
DROP INDEX IF EXISTS "Order_customerId_createdAt_idx";
DROP INDEX IF EXISTS "Order_storeId_status_createdAt_idx";
DROP INDEX IF EXISTS "Product_sku_idx";
DROP INDEX IF EXISTS "Product_storeId_categoryId_status_idx";
DROP INDEX IF EXISTS "Product_storeId_createdAt_idx";

-- Remove new columns from Order table
-- Note: SQLite doesn't support DROP COLUMN directly, would need table recreation
-- For production, create a proper migration with table recreation if needed
-- ALTER TABLE "Order" DROP COLUMN "estimatedDelivery";
-- ALTER TABLE "Order" DROP COLUMN "notes";

-- Remove new columns from Product table
-- ALTER TABLE "Product" DROP COLUMN "archivedAt";
-- ALTER TABLE "Product" DROP COLUMN "seoDescription";
-- ALTER TABLE "Product" DROP COLUMN "seoTitle";

-- For SQLite rollback of columns, you would need to:
-- 1. Create a new table without the columns
-- 2. Copy data from old table to new table
-- 3. Drop old table
-- 4. Rename new table to old name
-- 5. Recreate indexes and constraints

-- This script only drops the indexes for safety.
-- Full rollback would require a new migration.
