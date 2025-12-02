import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

interface DealFormData {
  name: string;
  dealType: string;
  dealStage: string;
  secType: string;
  closeDate: string;
  owningEntityName: string;
  requireFundsBeforeCountersign: boolean;
  autoSendFundingInstructions: boolean;
}

interface DealFormProps {
  initialData?: Partial<DealFormData>;
  onSubmit?: (data: DealFormData) => void;
}

const dealTypes = [
  { value: 'direct_syndication', label: 'Direct Syndication' },
  { value: 'fund', label: 'Fund' },
  { value: 'flexible_fund', label: 'Flexible Fund' },
  { value: 'spe', label: 'Single Purpose Entity (SPE)' },
  { value: 'joint_venture', label: 'Joint Venture' },
];

const dealStages = [
  { value: 'raising_capital', label: 'Raising Capital' },
  { value: 'asset_managing', label: 'Asset Managing' },
  { value: 'liquidated', label: 'Liquidated' },
];

const secTypes = [
  { value: 'reg_d_506b', label: 'Reg D 506(b)' },
  { value: 'reg_d_506c', label: 'Reg D 506(c)' },
  { value: 'reg_a', label: 'Reg A' },
  { value: 'reg_a_plus', label: 'Reg A+' },
  { value: 'reg_cf', label: 'Reg CF (Crowdfunding)' },
  { value: 'reg_s', label: 'Reg S (Offshore)' },
];

// Tooltip content for each field
const tooltips = {
  name: 'Enter a unique, descriptive name for this deal. This will be visible to investors and used throughout the platform.',
  dealType: 'Select the investment structure:\n• Direct Syndication: Individual property investment\n• Fund: Pooled investment vehicle\n• Flexible Fund: Fund with varied investment strategy\n• SPE: Entity created for a single investment\n• Joint Venture: Partnership between multiple parties',
  dealStage: 'Current phase of the deal:\n• Raising Capital: Actively seeking investor commitments\n• Asset Managing: Investment made, now managing the asset\n• Liquidated: Investment has been sold/exited',
  secType: 'SEC exemption type for this offering:\n• 506(b): Up to 35 non-accredited investors, no general solicitation\n• 506(c): Accredited investors only, general solicitation allowed\n• Reg A/A+: Mini-IPO, up to $75M raise\n• Reg CF: Crowdfunding, up to $5M\n• Reg S: For non-US investors only',
  closeDate: 'Optional deadline for the offering. After this date, new investments may not be accepted.',
  owningEntityName: 'The legal entity (LLC, LP, etc.) that will hold this investment. This appears on legal documents and subscription agreements.',
  requireFundsBeforeCountersign: 'When enabled, investors must transfer funds to your escrow/bank account before the GP (General Partner) will countersign their subscription agreement. This ensures committed capital before finalizing.',
  autoSendFundingInstructions: 'When enabled, funding/wiring instructions will be automatically emailed to investors immediately after the GP countersigns their subscription agreement.',
};

// Tooltip component
function Tooltip({ content }: { content: string }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <button
        type="button"
        className="ml-1.5 inline-flex items-center text-muted-foreground hover:text-foreground transition-colors"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
      >
        <HelpCircle className="h-4 w-4" />
      </button>
      {isVisible && (
        <div className="absolute left-6 top-0 z-50 w-72 rounded-lg border bg-popover p-3 text-sm text-popover-foreground shadow-lg">
          <div className="whitespace-pre-line">{content}</div>
          <div className="absolute -left-2 top-1 h-0 w-0 border-y-8 border-r-8 border-y-transparent border-r-popover" />
        </div>
      )}
    </div>
  );
}

export function DealForm({ initialData, onSubmit }: DealFormProps) {
  const navigate = useNavigate();
  const [formData, setFormData] = useState<DealFormData>({
    name: initialData?.name || '',
    dealType: initialData?.dealType || '',
    dealStage: initialData?.dealStage || '',
    secType: initialData?.secType || '',
    closeDate: initialData?.closeDate || '',
    owningEntityName: initialData?.owningEntityName || '',
    requireFundsBeforeCountersign: initialData?.requireFundsBeforeCountersign ?? false,
    autoSendFundingInstructions: initialData?.autoSendFundingInstructions ?? false,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof DealFormData, string>>>({});

  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof DealFormData, string>> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Deal name is required';
    }
    if (!formData.dealType) {
      newErrors.dealType = 'Deal type is required';
    }
    if (!formData.dealStage) {
      newErrors.dealStage = 'Deal stage is required';
    }
    if (!formData.secType) {
      newErrors.secType = 'SEC type is required';
    }
    if (!formData.owningEntityName.trim()) {
      newErrors.owningEntityName = 'Owning entity name is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    onSubmit?.(formData);
    navigate('/manager/deals');
  };

  const updateField = <K extends keyof DealFormData>(field: K, value: DealFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Deal Information */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-semibold">Deal Information</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Enter the basic details about this investment opportunity
        </p>
        
        <div className="mt-6 space-y-6">
          {/* Deal Name */}
          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="name">Deal Name *</Label>
              <Tooltip content={tooltips.name} />
            </div>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => updateField('name', e.target.value)}
              placeholder="e.g., Riverside Apartments Fund I"
              className={errors.name ? 'border-destructive' : ''}
            />
            {errors.name && (
              <p className="text-sm text-destructive">{errors.name}</p>
            )}
          </div>

          {/* Deal Type & Deal Stage */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="dealType">Deal Type *</Label>
                <Tooltip content={tooltips.dealType} />
              </div>
              <select
                id="dealType"
                value={formData.dealType}
                onChange={(e) => updateField('dealType', e.target.value)}
                className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  errors.dealType ? 'border-destructive' : 'border-input'
                }`}
              >
                <option value="">Select deal type...</option>
                {dealTypes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.dealType && (
                <p className="text-sm text-destructive">{errors.dealType}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="dealStage">Deal Stage *</Label>
                <Tooltip content={tooltips.dealStage} />
              </div>
              <select
                id="dealStage"
                value={formData.dealStage}
                onChange={(e) => updateField('dealStage', e.target.value)}
                className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  errors.dealStage ? 'border-destructive' : 'border-input'
                }`}
              >
                <option value="">Select deal stage...</option>
                {dealStages.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.dealStage && (
                <p className="text-sm text-destructive">{errors.dealStage}</p>
              )}
            </div>
          </div>

          {/* SEC Type & Close Date */}
          <div className="grid gap-6 sm:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="secType">SEC Type *</Label>
                <Tooltip content={tooltips.secType} />
              </div>
              <select
                id="secType"
                value={formData.secType}
                onChange={(e) => updateField('secType', e.target.value)}
                className={`flex h-10 w-full rounded-md border bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                  errors.secType ? 'border-destructive' : 'border-input'
                }`}
              >
                <option value="">Select SEC type...</option>
                {secTypes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              {errors.secType && (
                <p className="text-sm text-destructive">{errors.secType}</p>
              )}
            </div>

            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="closeDate">Close Date</Label>
                <Tooltip content={tooltips.closeDate} />
              </div>
              <Input
                id="closeDate"
                type="date"
                value={formData.closeDate}
                onChange={(e) => updateField('closeDate', e.target.value)}
              />
              <p className="text-xs text-muted-foreground">Optional</p>
            </div>
          </div>

          {/* Owning Entity Name */}
          <div className="space-y-2">
            <div className="flex items-center">
              <Label htmlFor="owningEntityName">Owning Entity Name *</Label>
              <Tooltip content={tooltips.owningEntityName} />
            </div>
            <Input
              id="owningEntityName"
              value={formData.owningEntityName}
              onChange={(e) => updateField('owningEntityName', e.target.value)}
              placeholder="e.g., Riverside Holdings LLC"
              className={errors.owningEntityName ? 'border-destructive' : ''}
            />
            {errors.owningEntityName && (
              <p className="text-sm text-destructive">{errors.owningEntityName}</p>
            )}
          </div>
        </div>
      </div>

      {/* Funding & Signing Settings */}
      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-semibold">Funding & Signing Settings</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Configure how funding and document signing are handled
        </p>
        
        <div className="mt-6 space-y-4">
          {/* Require Funds Before Countersign */}
          <label className="flex items-start gap-4 p-4 rounded-lg border bg-background cursor-pointer hover:bg-accent/50 transition-colors">
            <input
              type="checkbox"
              checked={formData.requireFundsBeforeCountersign}
              onChange={(e) => updateField('requireFundsBeforeCountersign', e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <div className="flex-1">
              <div className="flex items-center">
                <span className="font-medium">Funds must be received before GP countersigns</span>
                <Tooltip content={tooltips.requireFundsBeforeCountersign} />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Investors must transfer funds to your account before you countersign their subscription agreement
              </p>
            </div>
          </label>

          {/* Auto Send Funding Instructions */}
          <label className="flex items-start gap-4 p-4 rounded-lg border bg-background cursor-pointer hover:bg-accent/50 transition-colors">
            <input
              type="checkbox"
              checked={formData.autoSendFundingInstructions}
              onChange={(e) => updateField('autoSendFundingInstructions', e.target.checked)}
              className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
            />
            <div className="flex-1">
              <div className="flex items-center">
                <span className="font-medium">Automatically send funding instructions after GP countersigns</span>
                <Tooltip content={tooltips.autoSendFundingInstructions} />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                Wiring instructions will be automatically emailed to investors after you countersign
              </p>
            </div>
          </label>
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-4">
        <Button
          type="button"
          variant="outline"
          onClick={() => navigate('/manager/deals')}
        >
          Cancel
        </Button>
        <Button type="submit">
          {initialData ? 'Update Deal' : 'Create Deal'}
        </Button>
      </div>
    </form>
  );
}
