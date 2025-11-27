"use client";

// src/components/product/image-upload.tsx
// Image upload component with drag-to-reorder functionality

import { useState, useCallback } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ImagePlus, X, GripVertical } from "lucide-react";

interface ImageUploadProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
}

interface SortableImageProps {
  id: string;
  url: string;
  index: number;
  onRemove: (index: number) => void;
}

function SortableImage({ id, url, index, onRemove }: SortableImageProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group relative aspect-square overflow-hidden rounded-lg border bg-muted"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={url}
        alt={`Product image ${index + 1}`}
        className="h-full w-full object-cover"
      />

      {/* Overlay with controls */}
      <div className="absolute inset-0 bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
        {/* Drag handle */}
        <button
          type="button"
          className="absolute left-2 top-2 cursor-grab rounded bg-white/90 p-1.5 text-gray-700 hover:bg-white active:cursor-grabbing"
          {...attributes}
          {...listeners}
          aria-label="Drag to reorder"
        >
          <GripVertical className="h-4 w-4" />
        </button>

        {/* Remove button */}
        <Button
          type="button"
          variant="destructive"
          size="sm"
          className="absolute right-2 top-2 h-8 w-8 p-0"
          onClick={() => onRemove(index)}
          aria-label={`Remove image ${index + 1}`}
        >
          <X className="h-4 w-4" />
        </Button>

        {/* Image index badge */}
        {index === 0 && (
          <span className="absolute bottom-2 left-2 rounded bg-primary px-2 py-1 text-xs font-medium text-primary-foreground">
            Main
          </span>
        )}
      </div>
    </div>
  );
}

export function ImageUpload({
  images,
  onChange,
  maxImages = 10,
}: ImageUploadProps) {
  const [isDragOver, setIsDragOver] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((_, i) => `image-${i}` === active.id);
      const newIndex = images.findIndex((_, i) => `image-${i}` === over.id);
      onChange(arrayMove(images, oldIndex, newIndex));
    }
  };

  const handleRemove = (index: number) => {
    const updated = images.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleFileSelect = useCallback(
    (files: FileList | null) => {
      if (!files) return;

      const remainingSlots = maxImages - images.length;
      const filesToProcess = Array.from(files).slice(0, remainingSlots);

      const newImages: string[] = [];

      filesToProcess.forEach((file) => {
        if (!file.type.startsWith("image/")) return;

        // For demo purposes, convert to base64
        // In production, you would upload to a server/CDN
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          newImages.push(result);

          // Once all files are processed, update state
          if (newImages.length === filesToProcess.length) {
            onChange([...images, ...newImages]);
          }
        };
        reader.readAsDataURL(file);
      });
    },
    [images, maxImages, onChange]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);
      handleFileSelect(e.dataTransfer.files);
    },
    [handleFileSelect]
  );

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg font-medium">Product Images</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload dropzone */}
        {images.length < maxImages && (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className={`relative flex min-h-32 cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-6 transition-colors ${
              isDragOver
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-primary/50"
            }`}
          >
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => handleFileSelect(e.target.files)}
              className="absolute inset-0 cursor-pointer opacity-0"
              aria-label="Upload images"
            />
            <ImagePlus className="mb-2 h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Drag & drop images or click to upload
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {images.length} / {maxImages} images
            </p>
          </div>
        )}

        {/* Image grid with drag-to-reorder */}
        {images.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Drag images to reorder. First image will be the main product
              image.
            </p>
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={images.map((_, i) => `image-${i}`)}
                strategy={rectSortingStrategy}
              >
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
                  {images.map((url, index) => (
                    <SortableImage
                      key={`image-${index}`}
                      id={`image-${index}`}
                      url={url}
                      index={index}
                      onRemove={handleRemove}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}

        {/* Empty state */}
        {images.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">
            No images uploaded yet.
          </p>
        )}

        {/* Max images reached */}
        {images.length >= maxImages && (
          <p className="text-center text-sm text-muted-foreground">
            Maximum of {maxImages} images reached. Remove an image to add more.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
