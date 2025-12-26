import { Shield, Loader2 } from 'lucide-react';
import { useFundBranding } from '@/hooks/useFund';

interface PublicFormHeaderProps {
  fundId?: string;
  showSaving?: boolean;
  isSaving?: boolean;
}

export function PublicFormHeader({ fundId, showSaving, isSaving }: PublicFormHeaderProps) {
  const { data: fundBranding, isLoading } = useFundBranding(fundId);

  const logoUrl = fundBranding?.branding?.logoUrl;
  const fundName = fundBranding?.name || 'Investor Portal';

  return (
    <header className="border-b bg-white">
      <div className="mx-auto max-w-3xl px-4 py-4">
        <div className="flex items-center justify-between">
          {isLoading ? (
            <div className="h-8 w-32 bg-gray-100 animate-pulse rounded" />
          ) : logoUrl ? (
            <img 
              src={logoUrl} 
              alt={fundName} 
              className="h-10 max-w-[160px] object-contain"
            />
          ) : (
            <h1 className="text-xl font-bold">{fundName}</h1>
          )}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            {showSaving && isSaving && (
              <span className="flex items-center gap-1 text-xs">
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving...
              </span>
            )}
            <Shield className="h-4 w-4" />
            Secure Form
          </div>
        </div>
      </div>
    </header>
  );
}


















