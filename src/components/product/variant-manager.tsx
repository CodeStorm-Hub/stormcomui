"use client";

// src/components/product/variant-manager.tsx
// Variant management component for products

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2 } from "lucide-react";

export interface Variant {
  id?: string;
  name: string;
  sku: string;
  price: number;
  inventoryQty: number;
}

interface VariantManagerProps {
  variants: Variant[];
  onChange: (variants: Variant[]) => void;
  maxVariants?: number;
}

const MAX_VARIANTS = 100;

export function VariantManager({
  variants,
  onChange,
  maxVariants = MAX_VARIANTS,
}: VariantManagerProps) {
  const addVariant = () => {
    if (variants.length >= maxVariants) return;

    const newVariant: Variant = {
      name: "",
      sku: "",
      price: 0,
      inventoryQty: 0,
    };
    onChange([...variants, newVariant]);
  };

  const removeVariant = (index: number) => {
    const updated = variants.filter((_, i) => i !== index);
    onChange(updated);
  };

  const updateVariant = (
    index: number,
    field: keyof Variant,
    value: string | number
  ) => {
    const updated = variants.map((variant, i) => {
      if (i !== index) return variant;
      return { ...variant, [field]: value };
    });
    onChange(updated);
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-lg font-medium">Variants</CardTitle>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={addVariant}
          disabled={variants.length >= maxVariants}
        >
          <Plus className="mr-2 h-4 w-4" />
          Add Variant
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        {variants.length === 0 ? (
          <div className="rounded-lg border border-dashed p-6 text-center">
            <p className="text-sm text-muted-foreground">
              No variants added yet. Add variants for different sizes, colors,
              or other options.
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addVariant}
              className="mt-4"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add First Variant
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {variants.map((variant, index) => (
              <div
                key={variant.id || `variant-${index}`}
                className="rounded-lg border bg-card p-4"
              >
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-muted-foreground">
                    Variant {index + 1}
                  </span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removeVariant(index)}
                    className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10 hover:text-destructive"
                    aria-label={`Remove variant ${index + 1}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div className="space-y-2">
                    <Label htmlFor={`variant-name-${index}`}>
                      Name <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id={`variant-name-${index}`}
                      value={variant.name}
                      onChange={(e) =>
                        updateVariant(index, "name", e.target.value)
                      }
                      placeholder="e.g., Large / Red"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`variant-sku-${index}`}>
                      SKU <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id={`variant-sku-${index}`}
                      value={variant.sku}
                      onChange={(e) =>
                        updateVariant(index, "sku", e.target.value)
                      }
                      placeholder="SKU-001-L"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`variant-price-${index}`}>Price</Label>
                    <Input
                      id={`variant-price-${index}`}
                      type="number"
                      step="0.01"
                      min="0"
                      value={variant.price || ""}
                      onChange={(e) =>
                        updateVariant(
                          index,
                          "price",
                          parseFloat(e.target.value) || 0
                        )
                      }
                      placeholder="0.00"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`variant-stock-${index}`}>Stock Qty</Label>
                    <Input
                      id={`variant-stock-${index}`}
                      type="number"
                      min="0"
                      value={variant.inventoryQty || ""}
                      onChange={(e) =>
                        updateVariant(
                          index,
                          "inventoryQty",
                          parseInt(e.target.value) || 0
                        )
                      }
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
            ))}

            {variants.length > 0 && variants.length < maxVariants && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={addVariant}
                className="w-full"
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Another Variant
              </Button>
            )}

            {variants.length >= maxVariants && (
              <p className="text-center text-sm text-muted-foreground">
                Maximum of {maxVariants} variants reached.
              </p>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
