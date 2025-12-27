import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2, Lock, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const accountCreationSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

export type AccountCreationData = z.infer<typeof accountCreationSchema>;

interface AccountCreationStepProps {
  prefilledEmail?: string;
  onNext: (data: AccountCreationData) => Promise<void>;
  isLoading?: boolean;
  error?: string | null;
}

export function AccountCreationStep({ 
  prefilledEmail, 
  onNext, 
  isLoading = false,
  error: externalError 
}: AccountCreationStepProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<AccountCreationData>({
    resolver: zodResolver(accountCreationSchema),
    defaultValues: {
      email: prefilledEmail || '',
    },
  });

  const onSubmit = async (data: AccountCreationData) => {
    await onNext(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <div className="text-center mb-6">
        <div className="mx-auto w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Lock className="h-6 w-6 text-primary" />
        </div>
        <h3 className="text-lg font-semibold">Create Your Account</h3>
        <p className="text-sm text-muted-foreground mt-1">
          Set up your login credentials to access your investor portal
        </p>
      </div>

      {externalError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {externalError}
        </div>
      )}

      <div>
        <Label htmlFor="email" className="flex items-center gap-2">
          <Mail className="h-4 w-4" />
          Email Address *
        </Label>
        <Input
          id="email"
          type="email"
          {...register('email')}
          placeholder="john.smith@example.com"
          className="mt-1.5"
          autoComplete="email"
          disabled={!!prefilledEmail}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
        {prefilledEmail && (
          <p className="mt-1 text-sm text-muted-foreground">
            This email was pre-filled from your KYC application
          </p>
        )}
      </div>

      <div>
        <Label htmlFor="password" className="flex items-center gap-2">
          <Lock className="h-4 w-4" />
          Password *
        </Label>
        <div className="relative mt-1.5">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            {...register('password')}
            placeholder="Create a strong password"
            autoComplete="new-password"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && (
          <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
        )}
        <p className="mt-1 text-xs text-muted-foreground">
          At least 8 characters with uppercase, lowercase, and a number
        </p>
      </div>

      <div>
        <Label htmlFor="confirmPassword">Confirm Password *</Label>
        <div className="relative mt-1.5">
          <Input
            id="confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            {...register('confirmPassword')}
            placeholder="Confirm your password"
            autoComplete="new-password"
            className="pr-10"
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.confirmPassword && (
          <p className="mt-1 text-sm text-red-600">{errors.confirmPassword.message}</p>
        )}
      </div>

      <div className="rounded-lg border bg-muted/50 p-4 text-sm">
        <p className="font-medium mb-2">Why create an account?</p>
        <ul className="text-muted-foreground space-y-1">
          <li>• Securely save your progress</li>
          <li>• Access your investor dashboard</li>
          <li>• View documents and sign agreements</li>
          <li>• Track your investments</li>
        </ul>
      </div>

      <div className="flex justify-end pt-4">
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Creating Account...
            </>
          ) : (
            'Create Account & Continue'
          )}
        </Button>
      </div>
    </form>
  );
}

