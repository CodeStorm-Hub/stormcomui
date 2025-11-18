'use client';

// src/components/brands-page-client.tsx
// Brands list component

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { IconSearch, IconEdit, IconTrash } from '@tabler/icons-react';
import Link from 'next/link';

interface Brand {
  id: string;
  name: string;
  slug: string;
  isPublished: boolean;
  website: string | null;
  _count?: {
    products: number;
  };
}

export function BrandsPageClient({ storeId }: { storeId: string }) {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  useEffect(() => {
    fetchBrands();
  }, [storeId]);

  const fetchBrands = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/brands');
      if (response.ok) {
        const data = await response.json();
        setBrands(data.brands || []);
      }
    } catch (error) {
      console.error('Failed to fetch brands:', error);
      alert('Failed to load brands');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm('Are you sure you want to delete this brand?')) {
      return;
    }

    try {
      const response = await fetch(`/api/brands/${slug}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        alert('Brand deleted successfully');
        fetchBrands();
      } else {
        const error = await response.json();
        alert(error.error || 'Failed to delete brand');
      }
    } catch (error) {
      console.error('Failed to delete brand:', error);
      alert('Failed to delete brand');
    }
  };

  const filteredBrands = brands.filter((brand) =>
    brand.name.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="text-center py-8">Loading brands...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <IconSearch className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search brands..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={fetchBrands} variant="outline">
          Refresh
        </Button>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead>Website</TableHead>
              <TableHead>Products</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredBrands.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No brands found. Create your first brand to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredBrands.map((brand) => (
                <TableRow key={brand.id}>
                  <TableCell className="font-medium">{brand.name}</TableCell>
                  <TableCell className="text-muted-foreground">{brand.slug}</TableCell>
                  <TableCell>
                    {brand.website ? (
                      <a
                        href={brand.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Visit
                      </a>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell>{brand._count?.products || 0}</TableCell>
                  <TableCell>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${
                        brand.isPublished
                          ? 'bg-green-50 text-green-700'
                          : 'bg-gray-50 text-gray-700'
                      }`}
                    >
                      {brand.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/dashboard/brands/${brand.slug}`}>
                        <Button variant="ghost" size="sm">
                          <IconEdit className="size-4" />
                        </Button>
                      </Link>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(brand.slug)}
                      >
                        <IconTrash className="size-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <div className="text-sm text-muted-foreground">
        Showing {filteredBrands.length} of {brands.length} brands
      </div>
    </div>
  );
}
