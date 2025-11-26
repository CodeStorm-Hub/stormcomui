-- AlterTable
ALTER TABLE "Order" ADD COLUMN "estimatedDelivery" DATETIME;
ALTER TABLE "Order" ADD COLUMN "notes" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN "archivedAt" DATETIME;
ALTER TABLE "Product" ADD COLUMN "seoDescription" TEXT;
ALTER TABLE "Product" ADD COLUMN "seoTitle" TEXT;

-- CreateIndex
CREATE INDEX "Category_slug_idx" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_storeId_slug_idx" ON "Category"("storeId", "slug");

-- CreateIndex
CREATE INDEX "Customer_email_storeId_idx" ON "Customer"("email", "storeId");

-- CreateIndex
CREATE INDEX "Order_customerId_createdAt_idx" ON "Order"("customerId", "createdAt");

-- CreateIndex
CREATE INDEX "Order_storeId_status_createdAt_idx" ON "Order"("storeId", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Product_sku_idx" ON "Product"("sku");

-- CreateIndex
CREATE INDEX "Product_storeId_categoryId_status_idx" ON "Product"("storeId", "categoryId", "status");

-- CreateIndex
CREATE INDEX "Product_storeId_createdAt_idx" ON "Product"("storeId", "createdAt");
