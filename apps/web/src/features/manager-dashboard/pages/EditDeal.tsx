import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, Upload, Trash2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DealForm } from '../components/DealForm';
import { dealsApi, Deal, CreateDealInput } from '@/lib/api/deals';

export function EditDeal() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [deal, setDeal] = useState<Deal | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch deal data
  useEffect(() => {
    async function fetchDeal() {
      if (!id) return;

      try {
        const dealData = await dealsApi.getById(id);
        setDeal(dealData);
      } catch (err: any) {
        console.error('Failed to fetch deal:', err);
        setError(err.message || 'Failed to load deal');
      } finally {
        setIsLoading(false);
      }
    }

    fetchDeal();
  }, [id]);

  // Map API deal status to form deal stage
  const mapStatusToDealStage = (status: Deal['status']): string => {
    switch (status) {
      case 'prospective':
      case 'under_contract':
        return 'raising_capital';
      case 'acquired':
      case 'renovating':
      case 'stabilized':
      case 'for_sale':
        return 'asset_managing';
      case 'sold':
        return 'liquidated';
      default:
        return 'raising_capital';
    }
  };

  // Map form deal stage to API status
  const mapDealStageToStatus = (dealStage: string): Deal['status'] => {
    switch (dealStage) {
      case 'raising_capital':
        return 'prospective';
      case 'asset_managing':
        return 'acquired';
      case 'liquidated':
        return 'sold';
      default:
        return 'prospective';
    }
  };

  const handleSubmit = async (formData: any) => {
    if (!id) return;

    setError(null);
    setIsSubmitting(true);

    try {
      // Map form data to API input
      const updateInput: Partial<CreateDealInput> = {
        name: formData.name,
        description: formData.owningEntityName ? `${formData.dealType} - ${formData.owningEntityName}` : (deal?.description ?? undefined),
        status: mapDealStageToStatus(formData.dealStage),
        propertyType: formData.propertyType || undefined,
      };

      await dealsApi.update(id, updateInput);
      navigate(`/manager/deals/${id}`);
    } catch (err: any) {
      console.error('Failed to update deal:', err);
      setError(err.message || 'Failed to update deal. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleImageUpload = async (file: File): Promise<void> => {
    if (!id) return;
    try {
      const { imageUrl } = await dealsApi.uploadImage(id, file);
      setDeal(prev => prev ? { ...prev, imageUrl } : null);
    } catch (err) {
      console.error('Failed to upload image:', err);
      throw err;
    }
  };

  const handleImageDelete = async (): Promise<void> => {
    if (!id) return;
    try {
      await dealsApi.deleteImage(id);
      setDeal(prev => prev ? { ...prev, imageUrl: null } : null);
    } catch (err) {
      console.error('Failed to delete image:', err);
      throw err;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error && !deal) {
    return (
      <div className="space-y-6">
        <Link to="/manager/deals">
          <Button variant="ghost" className="gap-2">
            <ArrowLeft className="h-4 w-4" /> Back to Deals
          </Button>
        </Link>
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      </div>
    );
  }

  // Prepare initial data for the form
  const initialFormData = deal ? {
    name: deal.name,
    dealType: 'direct_syndication', // Default, since we don't store this
    dealStage: mapStatusToDealStage(deal.status),
    secType: 'reg_d_506b', // Default, since we don't store this
    propertyType: deal.propertyType || '',
    closeDate: '',
    owningEntityName: deal.description?.split(' - ')[1] || '',
    requireFundsBeforeCountersign: false,
    autoSendFundingInstructions: false,
  } : undefined;

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link to={`/manager/deals/${id}`}>
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Deal
        </Button>
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Edit Deal</h1>
        <p className="mt-1 text-muted-foreground">
          Update the details for {deal?.name}
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Deal Image Section */}
      {deal && (
        <DealImageSection
          deal={deal}
          onUpload={handleImageUpload}
          onDelete={handleImageDelete}
        />
      )}

      {/* Form */}
      <DealForm 
        initialData={initialFormData} 
        onSubmit={handleSubmit} 
        isEdit={true}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}

// Compact Deal Image Section Component
interface DealImageSectionProps {
  deal: Deal;
  onUpload: (file: File) => Promise<void>;
  onDelete: () => Promise<void>;
}

function DealImageSection({ deal, onUpload, onDelete }: DealImageSectionProps): JSX.Element {
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (file: File | null): Promise<void> => {
    if (!file) return;

    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Please use PNG, JPEG, or WebP.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError('File too large. Maximum size is 5MB.');
      return;
    }

    setError(null);
    setIsUploading(true);
    try {
      await onUpload(file);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = async (): Promise<void> => {
    setIsDeleting(true);
    setError(null);
    try {
      await onDelete();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to delete image');
    } finally {
      setIsDeleting(false);
    }
  };

  const isLoading = isUploading || isDeleting;

  return (
    <div className="rounded-xl border bg-card p-5">
      <div className="flex items-center gap-5">
        {/* Small Image Preview */}
        <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-lg border bg-muted">
          {deal.imageUrl ? (
            <img
              src={deal.imageUrl}
              alt={deal.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-blue-600 to-indigo-700">
              <Building2 className="h-8 w-8 text-white/70" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold">Deal Image</h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            PNG, JPEG, or WebP. Max 5MB.
          </p>
          
          {error && (
            <p className="mt-2 text-sm text-destructive">{error}</p>
          )}

          <div className="mt-3 flex items-center gap-2">
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
              {isUploading ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Upload className="mr-2 h-4 w-4" />
              )}
              {deal.imageUrl ? 'Change' : 'Upload'}
            </Button>
            {deal.imageUrl && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isLoading}
                onClick={handleDelete}
                className="text-destructive hover:text-destructive"
              >
                {isDeleting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="mr-2 h-4 w-4" />
                )}
                Remove
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

