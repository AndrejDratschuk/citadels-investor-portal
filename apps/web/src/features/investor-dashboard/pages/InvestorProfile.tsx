import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Building, CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import { useInvestorProfile, useUpdateProfile } from '../hooks/useInvestorData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const profileSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().optional(),
  address: z.object({
    street: z.string().optional(),
    city: z.string().optional(),
    state: z.string().optional(),
    zip: z.string().optional(),
    country: z.string().optional(),
  }).optional(),
  entityType: z.string().optional(),
  entityName: z.string().optional(),
});

type ProfileFormData = z.infer<typeof profileSchema>;

const accreditationStatusConfig = {
  pending: { icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50', label: 'Pending Verification' },
  approved: { icon: CheckCircle2, color: 'text-green-600', bg: 'bg-green-50', label: 'Verified' },
  rejected: { icon: AlertCircle, color: 'text-red-600', bg: 'bg-red-50', label: 'Not Verified' },
  expired: { icon: AlertCircle, color: 'text-orange-600', bg: 'bg-orange-50', label: 'Expired' },
};

export function InvestorProfile() {
  const { data: profile, isLoading } = useInvestorProfile();
  const updateProfile = useUpdateProfile();
  const [isEditing, setIsEditing] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      phone: profile?.phone || '',
      address: profile?.address || {},
      entityType: profile?.entityType || '',
      entityName: profile?.entityName || '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    try {
      await updateProfile.mutateAsync(data);
      setIsEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    }
  };

  const handleCancel = () => {
    reset();
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="mx-auto h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  const accreditation = profile?.accreditationStatus
    ? accreditationStatusConfig[profile.accreditationStatus as keyof typeof accreditationStatusConfig]
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Profile</h1>
          <p className="mt-1 text-muted-foreground">
            Manage your investor profile information
          </p>
        </div>
        {!isEditing && (
          <Button onClick={() => setIsEditing(true)}>Edit Profile</Button>
        )}
      </div>

      {/* Accreditation Status */}
      {accreditation && (
        <div className={cn('rounded-lg border p-4', accreditation.bg)}>
          <div className="flex items-center gap-3">
            <accreditation.icon className={cn('h-5 w-5', accreditation.color)} />
            <div>
              <p className={cn('font-medium', accreditation.color)}>
                Accreditation: {accreditation.label}
              </p>
              {profile?.accreditationType && (
                <p className="text-sm text-muted-foreground capitalize">
                  Type: {profile.accreditationType.replace(/_/g, ' ')}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Information */}
        <div className="rounded-xl border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Personal Information</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                {...register('firstName')}
                disabled={!isEditing}
              />
              {errors.firstName && (
                <p className="text-sm text-red-500">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                {...register('lastName')}
                disabled={!isEditing}
              />
              {errors.lastName && (
                <p className="text-sm text-red-500">{errors.lastName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={profile?.email || ''}
                disabled
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                {...register('phone')}
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="rounded-xl border bg-card p-6">
          <h2 className="mb-4 text-lg font-semibold">Address</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="street">Street Address</Label>
              <Input
                id="street"
                {...register('address.street')}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="city">City</Label>
              <Input
                id="city"
                {...register('address.city')}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State</Label>
              <Input
                id="state"
                {...register('address.state')}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="zip">ZIP Code</Label>
              <Input
                id="zip"
                {...register('address.zip')}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input
                id="country"
                {...register('address.country')}
                disabled={!isEditing}
              />
            </div>
          </div>
        </div>

        {/* Entity Information */}
        <div className="rounded-xl border bg-card p-6">
          <div className="mb-4 flex items-center gap-2">
            <Building className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">Entity Information</h2>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="entityType">Entity Type</Label>
              <select
                id="entityType"
                {...register('entityType')}
                disabled={!isEditing}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:cursor-not-allowed disabled:opacity-50"
              >
                <option value="">Select entity type</option>
                <option value="individual">Individual</option>
                <option value="joint">Joint</option>
                <option value="trust">Trust</option>
                <option value="llc">LLC</option>
                <option value="corporation">Corporation</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="entityName">Entity Name</Label>
              <Input
                id="entityName"
                {...register('entityName')}
                disabled={!isEditing}
                placeholder="If applicable"
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {isEditing && (
          <div className="flex justify-end gap-4">
            <Button type="button" variant="outline" onClick={handleCancel}>
              Cancel
            </Button>
            <Button type="submit" disabled={updateProfile.isPending}>
              {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        )}
      </form>
    </div>
  );
}


