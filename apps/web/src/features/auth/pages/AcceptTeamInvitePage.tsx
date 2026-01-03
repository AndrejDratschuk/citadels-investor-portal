import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { 
  Loader2, 
  Mail, 
  Building2, 
  UserPlus,
  AlertCircle,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { teamInvitesApi } from '@/lib/api/teamInvites';
import { useAuthStore } from '@/stores/authStore';
import { acceptTeamInviteSchema, type AcceptTeamInviteInput, type TeamRole } from '@altsui/shared';

interface InviteDetails {
  id: string;
  email: string;
  fundId: string;
  fundName: string;
  role: TeamRole;
  invitedByName: string;
  expiresAt: string;
}

const ROLE_LABELS: Record<TeamRole, string> = {
  manager: 'Manager',
  accountant: 'Accountant',
  attorney: 'Attorney',
  investor: 'Investor',
};

function PasswordStrength({ password }: { password: string }): JSX.Element {
  const checks = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
  };

  const strength = Object.values(checks).filter(Boolean).length;

  return (
    <div className="space-y-2">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((level) => (
          <div
            key={level}
            className={`h-1 flex-1 rounded ${
              strength >= level
                ? strength <= 1
                  ? 'bg-red-500'
                  : strength <= 2
                  ? 'bg-orange-500'
                  : strength <= 3
                  ? 'bg-yellow-500'
                  : 'bg-green-500'
                : 'bg-gray-200'
            }`}
          />
        ))}
      </div>
      <ul className="text-xs space-y-1">
        {Object.entries({
          length: 'At least 8 characters',
          uppercase: 'One uppercase letter',
          lowercase: 'One lowercase letter',
          number: 'One number',
        }).map(([key, label]) => (
          <li
            key={key}
            className={`flex items-center gap-1 ${
              checks[key as keyof typeof checks] ? 'text-green-600' : 'text-gray-400'
            }`}
          >
            {checks[key as keyof typeof checks] ? (
              <CheckCircle2 className="h-3 w-3" />
            ) : (
              <XCircle className="h-3 w-3" />
            )}
            {label}
          </li>
        ))}
      </ul>
    </div>
  );
}

export function AcceptTeamInvitePage(): JSX.Element {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [isExistingUser, setIsExistingUser] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const token = searchParams.get('token') || '';

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<Omit<AcceptTeamInviteInput, 'token'>>({
    resolver: zodResolver(acceptTeamInviteSchema.omit({ token: true })),
    defaultValues: {
      firstName: '',
      lastName: '',
      password: '',
    },
  });

  const password = watch('password') || '';

  useEffect(() => {
    if (!token) {
      setError('No invite token provided');
      setLoading(false);
      return;
    }

    verifyToken();
  }, [token]);

  const verifyToken = async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      const result = await teamInvitesApi.verifyToken(token);
      
      if (!result.valid || !result.invite) {
        setError(result.error || 'Invalid or expired invite');
        return;
      }

      setInvite(result.invite);
      setIsExistingUser(result.isExistingUser || false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to verify invite');
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: Omit<AcceptTeamInviteInput, 'token'>): Promise<void> => {
    if (!invite) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await teamInvitesApi.acceptInvite({
        token,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
      });

      // Check if this was an existing user (no tokens returned)
      if (!result.accessToken || result.accessToken === '') {
        // Existing user - redirect to login with success message
        navigate(`/login?message=${encodeURIComponent('Invite accepted! Please log in to access your new fund.')}`);
        return;
      }

      // New user - set auth state
      setAuth(
        {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role,
          fundId: result.user.fundId,
          firstName: data.firstName || null,
          lastName: data.lastName || null,
          onboardingCompleted: true,
          createdAt: new Date().toISOString(),
        },
        result.accessToken,
        result.refreshToken
      );

      // Redirect based on role
      const rolePaths: Record<TeamRole, string> = {
        manager: '/manager',
        accountant: '/accountant',
        attorney: '/attorney',
        investor: '/investor',
      };
      navigate(rolePaths[result.user.role] || '/manager');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to accept invite');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <p className="mt-4 text-slate-600">Verifying your invite...</p>
        </div>
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
          <div className="mx-auto w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-red-600" />
          </div>
          <h1 className="text-xl font-semibold text-slate-900">Invalid Invite</h1>
          <p className="mt-2 text-slate-600">{error}</p>
          <div className="mt-6">
            <Link to="/login">
              <Button variant="outline" className="w-full">
                Go to Login
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (isExistingUser) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <UserPlus className="h-8 w-8 text-blue-600" />
            </div>
            <h1 className="text-2xl font-bold text-slate-900">You're Already Registered</h1>
            <p className="mt-2 text-slate-600">
              Please log in to accept the invitation to join <strong>{invite?.fundName}</strong>.
            </p>
          </div>

          <div className="bg-slate-50 rounded-xl p-4 mb-6">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-slate-400" />
              <div>
                <p className="font-medium text-slate-900">{invite?.fundName}</p>
                <p className="text-sm text-slate-500">
                  Role: {ROLE_LABELS[invite?.role || 'investor']}
                </p>
              </div>
            </div>
          </div>

          <Link to={`/login?redirect=${encodeURIComponent(window.location.href)}`}>
            <Button className="w-full">
              Log In to Accept
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <UserPlus className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">Join {invite?.fundName}</h1>
          <p className="mt-2 text-slate-600">
            <strong>{invite?.invitedByName}</strong> invited you to join as a{' '}
            <strong>{ROLE_LABELS[invite?.role || 'investor']}</strong>
          </p>
        </div>

        {/* Invite Details */}
        <div className="bg-slate-50 rounded-xl p-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white shadow-sm">
              <Building2 className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-slate-900">{invite?.fundName}</p>
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {invite?.email}
              </p>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-6 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">First Name</Label>
              <Input
                id="firstName"
                placeholder="John"
                {...register('firstName')}
                disabled={isSubmitting}
              />
              {errors.firstName && (
                <p className="text-sm text-red-500">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Last Name</Label>
              <Input
                id="lastName"
                placeholder="Doe"
                {...register('lastName')}
                disabled={isSubmitting}
              />
              {errors.lastName && (
                <p className="text-sm text-red-500">{errors.lastName.message}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Create Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                className="pr-10"
                {...register('password')}
                disabled={isSubmitting}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
            {password && <PasswordStrength password={password} />}
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating Account...
              </>
            ) : (
              'Accept Invitation'
            )}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline font-medium">
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

