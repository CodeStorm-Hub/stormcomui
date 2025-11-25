"use client";

// src/components/products-table.tsx
// Client component for displaying and managing products with search, filters, and bulk actions

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Edit,
  Trash2,
  Package,
  Search,
  Archive,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  price: number;
  status: "DRAFT" | "ACTIVE" | "ARCHIVED";
  inventoryQty: number;
  inventoryStatus: "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "DISCONTINUED";
  category?: { name: string; slug: string };
  brand?: { name: string; slug: string };
}

type ProductStatus = "DRAFT" | "ACTIVE" | "ARCHIVED" | "ALL";
type BulkAction = "delete" | "publish" | "archive";

interface ProductsTableProps {
  storeId: string;
}

const ITEMS_PER_PAGE = 10;
const DEBOUNCE_MS = 300;

export function ProductsTable({ storeId }: ProductsTableProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<ProductStatus>("ALL");

  // Selection state
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);

  // Dialog states
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [bulkActionDialogOpen, setBulkActionDialogOpen] = useState(false);
  const [pendingBulkAction, setPendingBulkAction] = useState<BulkAction | null>(
    null
  );
  const [actionLoading, setActionLoading] = useState(false);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setCurrentPage(1); // Reset to first page on search
    }, DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Filter products based on search and status
  const filteredProducts = useMemo(() => {
    let result = products;

    // Filter by status
    if (statusFilter !== "ALL") {
      result = result.filter((p) => p.status === statusFilter);
    }

    // Filter by search query
    if (debouncedSearch) {
      const query = debouncedSearch.toLowerCase();
      result = result.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.sku.toLowerCase().includes(query) ||
          p.slug.toLowerCase().includes(query)
      );
    }

    return result;
  }, [products, statusFilter, debouncedSearch]);

  // Paginated products
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredProducts.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredProducts, currentPage]);

  const totalPages = Math.ceil(filteredProducts.length / ITEMS_PER_PAGE);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/products?storeId=${storeId}`);
      if (!response.ok) throw new Error("Failed to fetch products");
      const data = await response.json();
      setProducts(data.products || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load products");
    } finally {
      setLoading(false);
    }
  }, [storeId]);

  useEffect(() => {
    if (storeId) {
      fetchProducts();
    }
  }, [storeId, fetchProducts]);

  // Reset selection when filter/search changes
  useEffect(() => {
    setSelectedIds(new Set());
  }, [debouncedSearch, statusFilter]);

  // Selection handlers
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(paginatedProducts.map((p) => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleSelectProduct = (productId: string, checked: boolean) => {
    const newSelected = new Set(selectedIds);
    if (checked) {
      newSelected.add(productId);
    } else {
      newSelected.delete(productId);
    }
    setSelectedIds(newSelected);
  };

  const isAllSelected =
    paginatedProducts.length > 0 &&
    paginatedProducts.every((p) => selectedIds.has(p.id));
  const isSomeSelected = selectedIds.size > 0 && !isAllSelected;

  // Single delete handlers
  const handleDeleteClick = (product: Product) => {
    setProductToDelete(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;

    setActionLoading(true);
    try {
      const response = await fetch(
        `/api/products/${productToDelete.id}?storeId=${storeId}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to delete product");
      }

      toast.success("Product deleted", {
        description: `${productToDelete.name} has been deleted successfully.`,
      });

      await fetchProducts();
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (err) {
      toast.error("Delete failed", {
        description:
          err instanceof Error ? err.message : "Failed to delete product",
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Bulk action handlers
  const handleBulkActionClick = (action: BulkAction) => {
    if (selectedIds.size === 0) {
      toast.error("No products selected", {
        description: "Please select at least one product to perform this action.",
      });
      return;
    }
    setPendingBulkAction(action);
    setBulkActionDialogOpen(true);
  };

  const handleBulkActionConfirm = async () => {
    if (!pendingBulkAction || selectedIds.size === 0) return;

    setActionLoading(true);
    const ids = Array.from(selectedIds);

    try {
      let successCount = 0;
      let failCount = 0;

      for (const id of ids) {
        try {
          if (pendingBulkAction === "delete") {
            const response = await fetch(
              `/api/products/${id}?storeId=${storeId}`,
              {
                method: "DELETE",
              }
            );
            if (response.ok) successCount++;
            else failCount++;
          } else {
            const newStatus =
              pendingBulkAction === "publish" ? "ACTIVE" : "ARCHIVED";
            const response = await fetch(`/api/products/${id}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ storeId, status: newStatus }),
            });
            if (response.ok) successCount++;
            else failCount++;
          }
        } catch {
          failCount++;
        }
      }

      if (successCount > 0) {
        const actionVerb =
          pendingBulkAction === "delete"
            ? "deleted"
            : pendingBulkAction === "publish"
              ? "published"
              : "archived";
        toast.success(`${successCount} product(s) ${actionVerb}`, {
          description:
            failCount > 0
              ? `${failCount} product(s) failed to update.`
              : undefined,
        });
      } else {
        toast.error("Bulk action failed", {
          description: "No products were updated.",
        });
      }

      await fetchProducts();
      setSelectedIds(new Set());
      setBulkActionDialogOpen(false);
      setPendingBulkAction(null);
    } catch (err) {
      toast.error("Bulk action failed", {
        description:
          err instanceof Error ? err.message : "An error occurred.",
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getBulkActionText = () => {
    switch (pendingBulkAction) {
      case "delete":
        return {
          title: "Delete Products",
          description: `Are you sure you want to delete ${selectedIds.size} product(s)? This action cannot be undone.`,
          button: "Delete",
          buttonClass:
            "bg-destructive text-destructive-foreground hover:bg-destructive/90",
        };
      case "publish":
        return {
          title: "Publish Products",
          description: `Are you sure you want to publish ${selectedIds.size} product(s)? They will become visible to customers.`,
          button: "Publish",
          buttonClass: "",
        };
      case "archive":
        return {
          title: "Archive Products",
          description: `Are you sure you want to archive ${selectedIds.size} product(s)? They will be hidden from customers.`,
          button: "Archive",
          buttonClass: "",
        };
      default:
        return { title: "", description: "", button: "", buttonClass: "" };
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="h-10 w-full max-w-sm animate-pulse rounded-md bg-muted" />
          <div className="h-10 w-32 animate-pulse rounded-md bg-muted" />
        </div>
        {[...Array(5)].map((_, i) => (
          <div
            key={i}
            className="h-16 w-full animate-pulse rounded-md bg-muted"
          />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
        <p className="text-sm text-destructive">{error}</p>
        <Button
          variant="outline"
          size="sm"
          onClick={fetchProducts}
          className="mt-2"
        >
          Retry
        </Button>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="rounded-lg border bg-card p-12 text-center">
        <Package className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">No products yet</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Get started by creating your first product.
        </p>
        <Link href="/dashboard/products/new">
          <Button className="mt-4">Create Product</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Search and Filter Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search products..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
            aria-label="Search products"
          />
        </div>

        <div className="flex items-center gap-2">
          <Select
            value={statusFilter}
            onValueChange={(value: ProductStatus) => {
              setStatusFilter(value);
              setCurrentPage(1);
            }}
          >
            <SelectTrigger className="w-[140px]" aria-label="Filter by status">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="DRAFT">Draft</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="ARCHIVED">Archived</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Bulk Actions Bar */}
      {selectedIds.size > 0 && (
        <div className="flex flex-wrap items-center gap-2 rounded-lg border bg-muted/50 p-3">
          <span className="text-sm font-medium">
            {selectedIds.size} selected
          </span>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkActionClick("publish")}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              Publish
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkActionClick("archive")}
            >
              <Archive className="mr-2 h-4 w-4" />
              Archive
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleBulkActionClick("delete")}
              className="text-destructive hover:bg-destructive/10 hover:text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto"
          >
            Clear Selection
          </Button>
        </div>
      )}

      {/* Products Table */}
      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-12">
                <Checkbox
                  checked={isAllSelected}
                  onCheckedChange={handleSelectAll}
                  aria-label="Select all products"
                  className={isSomeSelected ? "opacity-50" : ""}
                />
              </TableHead>
              <TableHead>Product</TableHead>
              <TableHead>SKU</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Stock</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Category</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {paginatedProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="h-24 text-center">
                  <p className="text-muted-foreground">
                    No products found matching your criteria.
                  </p>
                </TableCell>
              </TableRow>
            ) : (
              paginatedProducts.map((product) => (
                <TableRow
                  key={product.id}
                  className={selectedIds.has(product.id) ? "bg-muted/50" : ""}
                >
                  <TableCell>
                    <Checkbox
                      checked={selectedIds.has(product.id)}
                      onCheckedChange={(checked) =>
                        handleSelectProduct(product.id, checked === true)
                      }
                      aria-label={`Select ${product.name}`}
                    />
                  </TableCell>
                  <TableCell className="font-medium">
                    <Link
                      href={`/dashboard/products/${product.id}`}
                      className="hover:underline"
                    >
                      {product.name}
                    </Link>
                  </TableCell>
                  <TableCell className="font-mono text-sm">
                    {product.sku}
                  </TableCell>
                  <TableCell>${product.price.toFixed(2)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{product.inventoryQty}</span>
                      <Badge
                        variant={
                          product.inventoryStatus === "IN_STOCK"
                            ? "default"
                            : product.inventoryStatus === "LOW_STOCK"
                              ? "secondary"
                              : "destructive"
                        }
                      >
                        {product.inventoryStatus.replace("_", " ")}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        product.status === "ACTIVE"
                          ? "default"
                          : product.status === "DRAFT"
                            ? "secondary"
                            : "outline"
                      }
                    >
                      {product.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {product.category ? (
                      <span className="text-sm text-muted-foreground">
                        {product.category.name}
                      </span>
                    ) : (
                      <span className="text-sm text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/dashboard/products/${product.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          aria-label={`Edit ${product.name}`}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteClick(product)}
                        aria-label={`Delete ${product.name}`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <p className="text-sm text-muted-foreground">
              Showing {(currentPage - 1) * ITEMS_PER_PAGE + 1} to{" "}
              {Math.min(currentPage * ITEMS_PER_PAGE, filteredProducts.length)}{" "}
              of {filteredProducts.length} products
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                aria-label="Previous page"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm">
                Page {currentPage} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() =>
                  setCurrentPage((p) => Math.min(totalPages, p + 1))
                }
                disabled={currentPage === totalPages}
                aria-label="Next page"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Single Delete Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Product</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{productToDelete?.name}
              &quot;? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              disabled={actionLoading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Bulk Action Dialog */}
      <AlertDialog
        open={bulkActionDialogOpen}
        onOpenChange={setBulkActionDialogOpen}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{getBulkActionText().title}</AlertDialogTitle>
            <AlertDialogDescription>
              {getBulkActionText().description}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={actionLoading}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkActionConfirm}
              disabled={actionLoading}
              className={getBulkActionText().buttonClass}
            >
              {actionLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                getBulkActionText().button
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
