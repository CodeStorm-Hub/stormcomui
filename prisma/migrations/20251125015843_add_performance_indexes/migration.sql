-- AlterTable
ALTER TABLE "Order" ADD COLUMN "estimatedDelivery" DATETIME;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "archivedAt" DATETIME;

-- CreateIndex
CREATE INDEX "Category_slug_idx" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_storeId_slug_idx" ON "Category"("storeId", "slug");

-- CreateIndex
CREATE INDEX "Order_storeId_status_createdAt_idx" ON "Order"("storeId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Order_customerId_createdAt_idx" ON "Order"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "Product_sku_idx" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "Product_storeId_createdAt_idx" ON "Product"("storeId", "createdAt");
