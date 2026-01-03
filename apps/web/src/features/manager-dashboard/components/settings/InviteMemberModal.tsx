import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Loader2, Mail, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createTeamInviteSchema, type CreateTeamInviteInput } from '@altsui/shared';
import type { TeamRole } from '@altsui/shared';

interface InviteMemberModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateTeamInviteInput) => Promise<void>;
  isLoading: boolean;
  error: string | null;
}

const ROLE_OPTIONS: { value: TeamRole; label: string; description: string }[] = [
  { 
    value: 'manager', 
    label: 'Manager', 
    description: 'Full access to all fund settings and data' 
  },
  { 
    value: 'accountant', 
    label: 'Accountant', 
    description: 'Can manage K-1s and view investor tax data' 
  },
  { 
    value: 'attorney', 
    label: 'Attorney', 
    description: 'Access to legal documents and signing status' 
  },
  { 
    value: 'investor', 
    label: 'Investor', 
    description: 'View their own investments and fund updates' 
  },
];

export function InviteMemberModal({
  isOpen,
  onClose,
  onSubmit,
  isLoading,
  error,
}: InviteMemberModalProps): JSX.Element | null {
  const [selectedRole, setSelectedRole] = useState<TeamRole>('manager');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<CreateTeamInviteInput>({
    resolver: zodResolver(createTeamInviteSchema),
    defaultValues: {
      email: '',
      role: 'manager',
    },
  });

  const handleFormSubmit = async (data: CreateTeamInviteInput): Promise<void> => {
    await onSubmit({ ...data, role: selectedRole });
    reset();
    setSelectedRole('manager');
  };

  const handleClose = (): void => {
    reset();
    setSelectedRole('manager');
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-xl shadow-xl w-full max-w-md p-6 m-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <UserPlus className="h-5 w-5 text-primary" />
            </div>
            <h2 className="text-xl font-semibold">Invite Team Member</h2>
          </div>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                placeholder="colleague@company.com"
                className="pl-10"
                {...register('email')}
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label>Role</Label>
            <div className="space-y-2">
              {ROLE_OPTIONS.map((option) => (
                <label
                  key={option.value}
                  className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedRole === option.value
                      ? 'border-primary bg-primary/5'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={option.value}
                    checked={selectedRole === option.value}
                    onChange={() => setSelectedRole(option.value)}
                    className="mt-1"
                    disabled={isLoading}
                  />
                  <div>
                    <p className="font-medium">{option.label}</p>
                    <p className="text-sm text-muted-foreground">{option.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Invite'
              )}
            </Button>
          </div>
        </form>

        <p className="mt-4 text-xs text-center text-muted-foreground">
          An email invitation will be sent with a link to join your fund.
          The invite expires in 7 days.
        </p>
      </div>
    </div>
  );
}

