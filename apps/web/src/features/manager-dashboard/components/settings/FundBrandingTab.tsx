import { useState } from 'react';
import { Building2, Upload, Trash2, Save, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { fundsApi, FundBranding } from '@/lib/api/funds';
import { useQueryClient } from '@tanstack/react-query';

interface FundBrandingTabProps {
  initialData: FundBranding;
  onRefresh: () => void;
}

export function FundBrandingTab({ initialData, onRefresh }: FundBrandingTabProps): JSX.Element {
  const queryClient = useQueryClient();
  const [brandingForm, setBrandingForm] = useState<FundBranding>(initialData);
  const [logoUploading, setLogoUploading] = useState(false);
  const [brandingSaving, setBrandingSaving] = useState(false);
  const [brandingMessage, setBrandingMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoUploading(true);
    setBrandingMessage(null);
    try {
      const { logoUrl } = await fundsApi.uploadLogo(file);
      setBrandingForm(prev => ({ ...prev, logoUrl }));
      setBrandingMessage({ type: 'success', text: 'Logo uploaded successfully!' });
      onRefresh();
      queryClient.invalidateQueries({ queryKey: ['fund', 'current'] });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to upload logo';
      setBrandingMessage({ type: 'error', text: errorMessage });
    } finally {
      setLogoUploading(false);
    }
  };

  const handleLogoDelete = async (): Promise<void> => {
    setLogoUploading(true);
    setBrandingMessage(null);
    try {
      await fundsApi.deleteLogo();
      setBrandingForm(prev => ({ ...prev, logoUrl: '' }));
      setBrandingMessage({ type: 'success', text: 'Logo removed successfully!' });
      onRefresh();
      queryClient.invalidateQueries({ queryKey: ['fund', 'current'] });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete logo';
      setBrandingMessage({ type: 'error', text: errorMessage });
    } finally {
      setLogoUploading(false);
    }
  };

  const handleSaveBranding = async (): Promise<void> => {
    setBrandingSaving(true);
    setBrandingMessage(null);
    try {
      await fundsApi.updateBranding({
        primaryColor: brandingForm.primaryColor,
        secondaryColor: brandingForm.secondaryColor,
      });
      setBrandingMessage({ type: 'success', text: 'Branding saved successfully!' });
      onRefresh();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save branding';
      setBrandingMessage({ type: 'error', text: errorMessage });
    } finally {
      setBrandingSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {brandingMessage && (
        <div className={cn(
          'p-4 rounded-lg',
          brandingMessage.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        )}>
          {brandingMessage.text}
        </div>
      )}

      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-semibold">Logo</h3>
        <div className="mt-4 flex items-center gap-6">
          <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-muted overflow-hidden">
            {brandingForm.logoUrl ? (
              <img 
                src={brandingForm.logoUrl} 
                alt="Fund logo" 
                className="h-full w-full object-contain"
              />
            ) : (
              <Building2 className="h-12 w-12 text-muted-foreground" />
            )}
          </div>
          <div className="space-y-2">
            <div className="flex gap-2">
              <label>
                <input
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/svg+xml"
                  onChange={handleLogoUpload}
                  className="hidden"
                  disabled={logoUploading}
                />
                <Button variant="outline" asChild disabled={logoUploading}>
                  <span className="cursor-pointer">
                    {logoUploading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="mr-2 h-4 w-4" />
                    )}
                    {brandingForm.logoUrl ? 'Change Logo' : 'Upload Logo'}
                  </span>
                </Button>
              </label>
              {brandingForm.logoUrl && (
                <Button 
                  variant="outline" 
                  onClick={handleLogoDelete}
                  disabled={logoUploading}
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Remove
                </Button>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Recommended: 200x200px, PNG or SVG. Max 2MB.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-semibold">Colors</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label>Primary Color</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={brandingForm.primaryColor || '#4f46e5'}
                onChange={(e) => setBrandingForm(prev => ({ ...prev, primaryColor: e.target.value }))}
                className="h-10 w-10 cursor-pointer rounded border"
              />
              <Input
                value={brandingForm.primaryColor || '#4f46e5'}
                onChange={(e) => setBrandingForm(prev => ({ ...prev, primaryColor: e.target.value }))}
                className="flex-1"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Secondary Color</Label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={brandingForm.secondaryColor || '#7c3aed'}
                onChange={(e) => setBrandingForm(prev => ({ ...prev, secondaryColor: e.target.value }))}
                className="h-10 w-10 cursor-pointer rounded border"
              />
              <Input
                value={brandingForm.secondaryColor || '#7c3aed'}
                onChange={(e) => setBrandingForm(prev => ({ ...prev, secondaryColor: e.target.value }))}
                className="flex-1"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-semibold">Preview</h3>
        <div className="mt-4 rounded-lg border p-6">
          <div
            className="h-24 rounded-lg"
            style={{
              background: `linear-gradient(to right, ${brandingForm.primaryColor || '#4f46e5'}, ${brandingForm.secondaryColor || '#7c3aed'})`,
            }}
          />
          <div className="mt-4 flex items-center gap-4">
            <Button style={{ backgroundColor: brandingForm.primaryColor || '#4f46e5' }}>
              Primary Button
            </Button>
            <Button
              variant="outline"
              style={{ 
                borderColor: brandingForm.primaryColor || '#4f46e5', 
                color: brandingForm.primaryColor || '#4f46e5' 
              }}
            >
              Secondary Button
            </Button>
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSaveBranding} disabled={brandingSaving}>
          {brandingSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Branding
        </Button>
      </div>
    </div>
  );
}

