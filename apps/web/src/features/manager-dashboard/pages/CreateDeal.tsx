import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DealForm } from '../components/DealForm';
import { dealsApi, CreateDealInput } from '@/lib/api/deals';

export function CreateDeal() {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (formData: any) => {
    setError(null);
    setIsSubmitting(true);

    try {
      // Map form data to API input
      const dealInput: CreateDealInput = {
        name: formData.name,
        description: formData.owningEntityName ? `${formData.dealType} - ${formData.owningEntityName}` : undefined,
        status: formData.dealStage === 'raising_capital' ? 'prospective' : 
                formData.dealStage === 'asset_managing' ? 'acquired' : 
                formData.dealStage === 'liquidated' ? 'sold' : 'prospective',
        propertyType: formData.propertyType || undefined,
      };

      const newDeal = await dealsApi.create(dealInput);
      console.log('Deal created:', newDeal);

      // If an image was selected, upload it after deal creation
      if (formData.imageFile) {
        try {
          await dealsApi.uploadImage(newDeal.id, formData.imageFile);
          console.log('Deal image uploaded');
        } catch (imgErr: any) {
          // Don't fail the whole operation if image upload fails
          console.error('Failed to upload deal image:', imgErr);
          // Could show a toast notification here
        }
      }

      navigate('/manager/deals');
    } catch (err: any) {
      console.error('Failed to create deal:', err);
      setError(err.message || 'Failed to create deal. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Back Button */}
      <Link to="/manager/deals">
        <Button variant="ghost" className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Back to Deals
        </Button>
      </Link>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Add New Deal</h1>
        <p className="mt-1 text-muted-foreground">
          Create a new investment opportunity for your investors
        </p>
      </div>

      {/* Error message */}
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Form */}
      <DealForm onSubmit={handleSubmit} isSubmitting={isSubmitting} />
    </div>
  );
}
