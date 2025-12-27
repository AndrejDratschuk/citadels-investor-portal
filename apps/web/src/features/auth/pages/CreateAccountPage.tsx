import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  Shield,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ArrowRight,
  KeyRound,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { accountCreationApi } from '@/lib/api/account-creation';
import { useAuthStore } from '@/stores/authStore';
import type { VerifyTokenResponse } from '@flowveda/shared';

// Form schemas
const passwordSchema = z.object({
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

const verificationSchema = z.object({
  code: z
    .string()
    .length(6, 'Code must be 6 digits')
    .regex(/^\d+$/, 'Code must contain only digits'),
});

type PasswordFormData = z.infer<typeof passwordSchema>;
type VerificationFormData = z.infer<typeof verificationSchema>;

type PageState = 'validating' | 'invalid' | 'password' | 'sending-code' | 'verification' | 'creating' | 'success';

export function CreateAccountPage() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();

  const [pageState, setPageState] = useState<PageState>('validating');
  const [tokenData, setTokenData] = useState<VerifyTokenResponse | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [codeExpiresIn, setCodeExpiresIn] = useState(0);
  const [passwordData, setPasswordData] = useState<PasswordFormData | null>(null);

  const passwordForm = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      password: '',
      confirmPassword: '',
    },
  });

  const verificationForm = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      code: '',
    },
  });

  // Validate token on mount
  useEffect(() => {
    const validateToken = async (): Promise<void> => {
      if (!token) {
        setPageState('invalid');
        setErrorMessage('No token provided');
        return;
      }

      try {
        const data = await accountCreationApi.verifyToken(token);
        setTokenData(data);
        setPageState('password');
      } catch (error: any) {
        setPageState('invalid');
        setErrorMessage(error.response?.data?.error || 'This link is invalid or has expired');
      }
    };

    validateToken();
  }, [token]);

  // Countdown timer for code expiration
  useEffect(() => {
    if (codeExpiresIn > 0 && pageState === 'verification') {
      const timer = setInterval(() => {
        setCodeExpiresIn((prev) => Math.max(0, prev - 1));
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [codeExpiresIn, pageState]);

  const handlePasswordSubmit = async (data: PasswordFormData): Promise<void> => {
    if (!token) return;

    setPasswordData(data);
    setPageState('sending-code');
    setErrorMessage('');

    try {
      const result = await accountCreationApi.sendCode(token);
      setCodeExpiresIn(result.expiresIn);
      setPageState('verification');
    } catch (error: any) {
      setPageState('password');
      setErrorMessage(error.response?.data?.error || 'Failed to send verification code');
    }
  };

  const handleVerificationSubmit = async (data: VerificationFormData): Promise<void> => {
    if (!token || !passwordData) return;

    setPageState('creating');
    setErrorMessage('');

    try {
      const result = await accountCreationApi.createAccount({
        token,
        password: passwordData.password,
        confirmPassword: passwordData.confirmPassword,
        verificationCode: data.code,
      });

      // Set auth state (setAuth expects 3 separate arguments)
      setAuth(
        {
          id: result.user.id,
          email: result.user.email,
          role: result.user.role,
        } as any, // Type cast needed since User type may have more fields
        result.accessToken,
        result.refreshToken
      );

      setPageState('success');

      // Redirect to investor dashboard after account creation
      // The investor will receive an onboarding invite separately
      setTimeout(() => {
        navigate('/investor/dashboard', { replace: true });
      }, 2000);
    } catch (error: any) {
      setPageState('verification');
      setErrorMessage(error.response?.data?.error || 'Failed to create account');
    }
  };

  const handleResendCode = async (): Promise<void> => {
    if (!token) return;

    setPageState('sending-code');
    setErrorMessage('');

    try {
      const result = await accountCreationApi.sendCode(token);
      setCodeExpiresIn(result.expiresIn);
      setPageState('verification');
      verificationForm.reset();
    } catch (error: any) {
      setPageState('verification');
      setErrorMessage(error.response?.data?.error || 'Failed to resend code');
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Loading state
  if (pageState === 'validating') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
          <p className="mt-4 text-slate-400">Validating your link...</p>
        </div>
      </div>
    );
  }

  // Invalid token state
  if (pageState === 'invalid') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-500/10 mx-auto">
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
            <h1 className="mt-6 text-2xl font-bold text-white">Invalid Link</h1>
            <p className="mt-3 text-slate-400">{errorMessage}</p>
            <p className="mt-4 text-sm text-slate-500">
              If you need a new link, please contact your fund manager.
            </p>
            <Link to="/login">
              <Button className="mt-6 w-full">Go to Login</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (pageState === 'success') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
        <div className="w-full max-w-md text-center">
          <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 mx-auto">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <h1 className="mt-6 text-2xl font-bold text-white">Account Created!</h1>
            <p className="mt-3 text-slate-400">
              Your investor account has been created successfully.
            </p>
            <p className="mt-4 text-sm text-slate-500">Redirecting to complete your profile...</p>
            <Loader2 className="h-5 w-5 animate-spin text-primary mx-auto mt-4" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-4">
      <div className="w-full max-w-md">
        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10 mx-auto">
              <Shield className="h-7 w-7 text-primary" />
            </div>
            <h1 className="mt-4 text-2xl font-bold text-white">Create Your Account</h1>
            {tokenData?.fundName && (
              <p className="mt-2 text-slate-400">Join {tokenData.fundName}</p>
            )}
          </div>

          {/* Email Display */}
          <div className="mb-6 p-4 bg-slate-700/30 rounded-lg">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-slate-400" />
              <div>
                <p className="text-xs text-slate-500">Email Address</p>
                <p className="text-white font-medium">{tokenData?.email}</p>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {errorMessage && (
            <div className="mb-6 p-4 bg-red-500/10 border border-red-500/20 rounded-lg flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
              <p className="text-red-400 text-sm">{errorMessage}</p>
            </div>
          )}

          {/* Password Form */}
          {(pageState === 'password' || pageState === 'sending-code') && (
            <form onSubmit={passwordForm.handleSubmit(handlePasswordSubmit)} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-200">
                  Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    className="pl-10 pr-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                    placeholder="Create a strong password"
                    {...passwordForm.register('password')}
                    disabled={pageState === 'sending-code'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordForm.formState.errors.password && (
                  <p className="text-sm text-red-400">{passwordForm.formState.errors.password.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-slate-200">
                  Confirm Password
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    className="pl-10 pr-10 bg-slate-700/50 border-slate-600 text-white placeholder:text-slate-500"
                    placeholder="Confirm your password"
                    {...passwordForm.register('confirmPassword')}
                    disabled={pageState === 'sending-code'}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {passwordForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-red-400">{passwordForm.formState.errors.confirmPassword.message}</p>
                )}
              </div>

              {/* Password Requirements */}
              <div className="text-xs text-slate-500 space-y-1">
                <p>Password must contain:</p>
                <ul className="list-disc list-inside space-y-0.5">
                  <li>At least 8 characters</li>
                  <li>One uppercase letter</li>
                  <li>One lowercase letter</li>
                  <li>One number</li>
                </ul>
              </div>

              <Button type="submit" className="w-full" disabled={pageState === 'sending-code'}>
                {pageState === 'sending-code' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending Code...
                  </>
                ) : (
                  <>
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>
            </form>
          )}

          {/* Verification Form */}
          {(pageState === 'verification' || pageState === 'creating') && (
            <form onSubmit={verificationForm.handleSubmit(handleVerificationSubmit)} className="space-y-5">
              <div className="text-center mb-4">
                <KeyRound className="h-10 w-10 text-primary mx-auto mb-3" />
                <p className="text-slate-300">
                  We sent a 6-digit code to <strong className="text-white">{tokenData?.email}</strong>
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="code" className="text-slate-200">
                  Verification Code
                </Label>
                <Input
                  id="code"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  className="bg-slate-700/50 border-slate-600 text-white text-center text-2xl tracking-[0.5em] placeholder:text-slate-500 placeholder:tracking-normal"
                  placeholder="000000"
                  {...verificationForm.register('code')}
                  disabled={pageState === 'creating'}
                />
                {verificationForm.formState.errors.code && (
                  <p className="text-sm text-red-400">{verificationForm.formState.errors.code.message}</p>
                )}
              </div>

              {codeExpiresIn > 0 ? (
                <p className="text-center text-sm text-slate-500">
                  Code expires in <span className="text-primary">{formatTime(codeExpiresIn)}</span>
                </p>
              ) : (
                <p className="text-center text-sm text-amber-500">Code has expired</p>
              )}

              <Button
                type="submit"
                className="w-full"
                disabled={pageState === 'creating' || codeExpiresIn === 0}
              >
                {pageState === 'creating' ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    Create Account
                    <CheckCircle2 className="ml-2 h-4 w-4" />
                  </>
                )}
              </Button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={pageState === 'creating'}
                  className="text-sm text-primary hover:underline disabled:opacity-50"
                >
                  Resend Code
                </button>
              </div>

              <button
                type="button"
                onClick={() => {
                  setPageState('password');
                  setErrorMessage('');
                  verificationForm.reset();
                }}
                className="w-full text-sm text-slate-500 hover:text-slate-300"
                disabled={pageState === 'creating'}
              >
                ← Back to password
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-sm text-slate-500">
          Already have an account?{' '}
          <Link to="/login" className="text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

