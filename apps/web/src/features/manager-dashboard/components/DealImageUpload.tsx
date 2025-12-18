import { useState, useRef, useCallback } from 'react';
import { Upload, Trash2, Loader2, Building2, Factory, Store, Landmark, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface DealImageUploadProps {
  imageUrl: string | null;
  propertyType: 'multifamily' | 'office' | 'retail' | 'industrial' | 'other' | null;
  onUpload: (file: File) => Promise<void>;
  onDelete: () => Promise<void>;
  className?: string;
  compact?: boolean;
}

// Property type gradients and icons
const propertyTypeConfig: Record<string, { gradient: string; icon: React.ReactNode }> = {
  multifamily: {
    gradient: 'from-blue-600 to-indigo-700',
    icon: <Building2 className="h-12 w-12 text-white/80" />,
  },
  office: {
    gradient: 'from-slate-600 to-slate-800',
    icon: <Landmark className="h-12 w-12 text-white/80" />,
  },
  retail: {
    gradient: 'from-amber-500 to-orange-600',
    icon: <Store className="h-12 w-12 text-white/80" />,
  },
  industrial: {
    gradient: 'from-zinc-600 to-zinc-800',
    icon: <Factory className="h-12 w-12 text-white/80" />,
  },
  other: {
    gradient: 'from-purple-600 to-violet-700',
    icon: <Home className="h-12 w-12 text-white/80" />,
  },
};

export function DealImageUpload({
  imageUrl,
  propertyType,
  onUpload,
  onDelete,
  className,
  compact = false,
}: DealImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const config = propertyTypeConfig[propertyType || 'other'] || propertyTypeConfig.other;

  const handleFileChange = useCallback(
    async (file: File | null) => {
      if (!file) return;

      // Validate file type
      const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
      if (!allowedTypes.includes(file.type)) {
        setError('Invalid file type. Please use PNG, JPEG, or WebP.');
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File too large. Maximum size is 5MB.');
        return;
      }

      setError(null);
      setIsUploading(true);
      try {
        await onUpload(file);
      } catch (err: any) {
        setError(err.message || 'Failed to upload image');
      } finally {
        setIsUploading(false);
      }
    },
    [onUpload]
  );

  const handleDelete = async () => {
    setIsDeleting(true);
    setError(null);
    try {
      await onDelete();
    } catch (err: any) {
      setError(err.message || 'Failed to delete image');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      handleFileChange(file);
    },
    [handleFileChange]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const isLoading = isUploading || isDeleting;

  if (compact) {
    // Compact version for DealCard display
    return (
      <div className={cn('relative overflow-hidden', className)}>
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Deal"
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className={cn(
              'flex h-full w-full items-center justify-center bg-gradient-to-br',
              config.gradient
            )}
          >
            {config.icon}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={cn('space-y-3', className)}>
      <div
        className={cn(
          'relative aspect-video w-full overflow-hidden rounded-lg border-2 border-dashed transition-colors',
          isDragging ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
          isLoading && 'pointer-events-none opacity-50'
        )}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
      >
        {imageUrl ? (
          <img
            src={imageUrl}
            alt="Deal"
            className="h-full w-full object-cover"
          />
        ) : (
          <div
            className={cn(
              'flex h-full w-full flex-col items-center justify-center bg-gradient-to-br',
              config.gradient
            )}
          >
            {config.icon}
            <p className="mt-3 text-sm font-medium text-white/70">
              {propertyType
                ? propertyType.charAt(0).toUpperCase() + propertyType.slice(1)
                : 'Property'}
            </p>
          </div>
        )}

        {/* Loading overlay */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        )}

        {/* Drag overlay */}
        {isDragging && !isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-primary/20">
            <Upload className="h-10 w-10 text-primary" />
          </div>
        )}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-sm text-destructive">{error}</p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2">
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg,image/webp"
          className="hidden"
          onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isLoading}
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mr-2 h-4 w-4" />
          {imageUrl ? 'Change Image' : 'Upload Image'}
        </Button>
        {imageUrl && (
          <Button
            type="button"
            variant="outline"
            size="sm"
            disabled={isLoading}
            onClick={handleDelete}
            className="text-destructive hover:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Remove
          </Button>
        )}
      </div>

      <p className="text-xs text-muted-foreground">
        Drag and drop or click to upload. PNG, JPEG, or WebP. Max 5MB.
      </p>
    </div>
  );
}






