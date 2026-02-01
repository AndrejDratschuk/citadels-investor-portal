import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { HelpCircle, Loader2, Upload, Trash2, Building2, Factory, Store, Landmark, Home } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

interface DealFormData {
  name: string;
  dealType: string;
  dealStage: string;
  secType: string;
  propertyType: string;
  closeDate: string;
  owningEntityName: string;
  requireFundsBeforeCountersign: boolean;
  autoSendFundingInstructions: boolean;
  imageFile?: File | null;
}

interface DealFormProps {
  initialData?: Partial<DealFormData>;
  onSubmit?: (data: DealFormData) => void;
  isEdit?: boolean;
  isSubmitting?: boolean;
}

// Property type gradients and icons for image placeholder
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

const propertyTypes = [
  { value: 'multifamily', label: 'Multifamily' },
  { value: 'office', label: 'Office' },
  { value: 'retail', label: 'Retail' },
  { value: 'industrial', label: 'Industrial' },
  { value: 'other', label: 'Other' },
];

// Tooltip content for each field
const tooltips = {
  name: 'Enter a unique, descriptive name for this deal. This will be visible to investors and used throughout the platform.',
  dealType: 'Select the investment structure:\n• Direct Syndication: Individual property investment\n• Fund: Pooled investment vehicle\n• Flexible Fund: Fund with varied investment strategy\n• SPE: Entity created for a single investment\n• Joint Venture: Partnership between multiple parties',
  dealStage: 'Current phase of the deal:\n• Raising Capital: Actively seeking investor commitments\n• Asset Managing: Investment made, now managing the asset\n• Liquidated: Investment has been sold/exited',
  secType: 'SEC exemption type for this offering:\n• 506(b): Up to 35 non-accredited investors, no general solicitation\n• 506(c): Accredited investors only, general solicitation allowed\n• Reg A/A+: Mini-IPO, up to $75M raise\n• Reg CF: Crowdfunding, up to $5M\n• Reg S: For non-US investors only',
  propertyType: 'Select the type of real estate property:\n• Multifamily: Apartment buildings, residential complexes\n• Office: Commercial office buildings\n• Retail: Shopping centers, storefronts\n• Industrial: Warehouses, manufacturing facilities\n• Other: Mixed-use or specialty properties',
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

export function DealForm({ initialData, onSubmit, isEdit = false, isSubmitting = false }: DealFormProps) {
  const navigate = useNavigate();
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<DealFormData>({
    name: initialData?.name || '',
    dealType: initialData?.dealType || '',
    dealStage: initialData?.dealStage || '',
    secType: initialData?.secType || '',
    propertyType: initialData?.propertyType || '',
    closeDate: initialData?.closeDate || '',
    owningEntityName: initialData?.owningEntityName || '',
    requireFundsBeforeCountersign: initialData?.requireFundsBeforeCountersign ?? false,
    autoSendFundingInstructions: initialData?.autoSendFundingInstructions ?? false,
    imageFile: null,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageError, setImageError] = useState<string | null>(null);

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

    if (onSubmit) {
      onSubmit(formData);
    } else {
      // Fallback navigation if no onSubmit provided
    navigate('/manager/deals');
    }
  };

  const updateField = <K extends keyof DealFormData>(field: K, value: DealFormData[K]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleImageSelect = (file: File | null) => {
    if (!file) return;

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      setImageError('Invalid file type. Please use PNG, JPEG, or WebP.');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setImageError('File too large. Maximum size is 5MB.');
      return;
    }

    setImageError(null);
    setFormData((prev) => ({ ...prev, imageFile: file }));
    
    // Create preview URL
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleImageRemove = () => {
    setFormData((prev) => ({ ...prev, imageFile: null }));
    setImagePreview(null);
    setImageError(null);
    if (imageInputRef.current) {
      imageInputRef.current.value = '';
    }
  };

  const config = propertyTypeConfig[formData.propertyType || 'other'] || propertyTypeConfig.other;

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

          {/* Owning Entity Name & Property Type */}
          <div className="grid gap-6 sm:grid-cols-2">
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

            <div className="space-y-2">
              <div className="flex items-center">
                <Label htmlFor="propertyType">Property Type</Label>
                <Tooltip content={tooltips.propertyType} />
              </div>
              <select
                id="propertyType"
                value={formData.propertyType}
                onChange={(e) => updateField('propertyType', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="">Select property type...</option>
                {propertyTypes.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <p className="text-xs text-muted-foreground">Optional - helps categorize the deal</p>
            </div>
          </div>
        </div>
      </div>

      {/* Deal Image */}
      {!isEdit && (
        <div className="rounded-xl border bg-card p-6">
          <h3 className="text-lg font-semibold">Deal Image</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Upload an image to represent this investment opportunity (optional)
          </p>
          
          <div className="mt-4 space-y-3">
            <div
              className={cn(
                'relative aspect-video w-full max-w-md overflow-hidden rounded-lg border-2 border-dashed transition-colors',
                'border-muted-foreground/25 hover:border-muted-foreground/50'
              )}
            >
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Deal preview"
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
                    {formData.propertyType
                      ? formData.propertyType.charAt(0).toUpperCase() + formData.propertyType.slice(1)
                      : 'No image selected'}
                  </p>
                </div>
              )}
            </div>

            {imageError && (
              <p className="text-sm text-destructive">{imageError}</p>
            )}

            <div className="flex items-center gap-2">
              <input
                ref={imageInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/webp"
                className="hidden"
                onChange={(e) => handleImageSelect(e.target.files?.[0] || null)}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => imageInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                {imagePreview ? 'Change Image' : 'Upload Image'}
              </Button>
              {imagePreview && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleImageRemove}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove
                </Button>
              )}
            </div>

            <p className="text-xs text-muted-foreground">
              PNG, JPEG, or WebP. Max 5MB. You can also add or change the image later.
            </p>
          </div>
        </div>
      )}

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
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {isEdit ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            isEdit ? 'Update Deal' : 'Create Deal'
          )}
        </Button>
      </div>
    </form>
  );
}
