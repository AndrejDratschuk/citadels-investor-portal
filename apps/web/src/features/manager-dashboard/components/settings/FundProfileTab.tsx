import { useState } from 'react';
import { Loader2, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { fundsApi, FundAddress } from '@/lib/api/funds';
import { useQueryClient } from '@tanstack/react-query';

interface ProfileFormState {
  name: string;
  legalName: string;
  address: FundAddress;
}

interface FundProfileTabProps {
  initialData: ProfileFormState;
  onRefresh: () => void;
}

export function FundProfileTab({ initialData, onRefresh }: FundProfileTabProps): JSX.Element {
  const queryClient = useQueryClient();
  const [profileForm, setProfileForm] = useState<ProfileFormState>(initialData);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleSaveProfile = async (): Promise<void> => {
    setProfileSaving(true);
    setProfileMessage(null);
    try {
      await fundsApi.updateProfile({
        name: profileForm.name,
        legalName: profileForm.legalName,
        address: profileForm.address,
      });
      setProfileMessage({ type: 'success', text: 'Profile saved successfully!' });
      queryClient.invalidateQueries({ queryKey: ['fund', 'current'] });
      onRefresh();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save profile';
      setProfileMessage({ type: 'error', text: errorMessage });
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      {profileMessage && (
        <div className={cn(
          'p-4 rounded-lg',
          profileMessage.type === 'success' 
            ? 'bg-green-50 text-green-700 border border-green-200'
            : 'bg-red-50 text-red-700 border border-red-200'
        )}>
          {profileMessage.text}
        </div>
      )}

      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-semibold">Fund Information</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="fundName">Fund Name</Label>
            <Input 
              id="fundName" 
              value={profileForm.name}
              onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="legalName">Legal Name</Label>
            <Input 
              id="legalName" 
              value={profileForm.legalName}
              onChange={(e) => setProfileForm(prev => ({ ...prev, legalName: e.target.value }))}
            />
          </div>
        </div>
      </div>

      <div className="rounded-xl border bg-card p-6">
        <h3 className="text-lg font-semibold">Address</h3>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2 space-y-2">
            <Label htmlFor="street">Street Address</Label>
            <Input 
              id="street" 
              value={profileForm.address.street || ''}
              onChange={(e) => setProfileForm(prev => ({ 
                ...prev, 
                address: { ...prev.address, street: e.target.value }
              }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="city">City</Label>
            <Input 
              id="city" 
              value={profileForm.address.city || ''}
              onChange={(e) => setProfileForm(prev => ({ 
                ...prev, 
                address: { ...prev.address, city: e.target.value }
              }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="state">State</Label>
            <Input 
              id="state" 
              value={profileForm.address.state || ''}
              onChange={(e) => setProfileForm(prev => ({ 
                ...prev, 
                address: { ...prev.address, state: e.target.value }
              }))}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="zip">ZIP Code</Label>
            <Input 
              id="zip" 
              value={profileForm.address.zip || ''}
              onChange={(e) => setProfileForm(prev => ({ 
                ...prev, 
                address: { ...prev.address, zip: e.target.value }
              }))}
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSaveProfile} disabled={profileSaving}>
          {profileSaving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Save Changes
        </Button>
      </div>
    </div>
  );
}

