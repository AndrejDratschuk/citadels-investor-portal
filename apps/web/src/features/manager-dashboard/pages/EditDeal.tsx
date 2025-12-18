import { useState, useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2 } from 'lucide-react';
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
        description: formData.owningEntityName ? `${formData.dealType} - ${formData.owningEntityName}` : deal?.description,
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

