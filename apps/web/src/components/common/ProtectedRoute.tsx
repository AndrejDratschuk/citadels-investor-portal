import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import type { UserRole } from '@altsui/shared';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: UserRole;
  /**
   * If true, only allow users who have NOT completed onboarding
   * Used for the fund creation wizard route
   */
  requireOnboardingIncomplete?: boolean;
}

const ONBOARDING_EXEMPT_PATHS = [
  '/onboarding/create-fund',
  '/invite/accept',
  '/login',
  '/signup',
];

function isOnboardingExemptPath(pathname: string): boolean {
  return ONBOARDING_EXEMPT_PATHS.some(path => pathname.startsWith(path));
}

export function ProtectedRoute({ 
  children, 
  requiredRole,
  requireOnboardingIncomplete = false,
}: ProtectedRouteProps): JSX.Element {
  const { isAuthenticated, isLoading, user } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // If this route requires onboarding to be incomplete (fund creation wizard)
  if (requireOnboardingIncomplete) {
    if (user?.onboardingCompleted) {
      // User already completed onboarding, redirect to their dashboard
      const roleRoutes: Record<string, string> = {
        manager: '/manager',
        accountant: '/accountant',
        attorney: '/attorney',
        investor: '/investor',
      };
      const dashboardPath = user?.role ? roleRoutes[user.role] || '/manager' : '/manager';
      return <Navigate to={dashboardPath} replace />;
    }
    // Allow access to fund creation wizard
    return <>{children}</>;
  }

  // Check if user needs to complete onboarding
  // Skip this check for onboarding-exempt paths
  if (!isOnboardingExemptPath(location.pathname) && user && !user.onboardingCompleted) {
    // User needs to complete onboarding - redirect to fund creation wizard
    return <Navigate to="/onboarding/create-fund" replace />;
  }

  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
