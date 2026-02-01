import { Link, Navigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';

export function LandingPage() {
  const { isAuthenticated, user } = useAuth();

  const getDashboardPath = () => {
    if (!user) return '/login';
    switch (user.role) {
      case 'investor':
        return '/investor/dashboard';
      case 'manager':
        return '/manager/dashboard';
      case 'accountant':
        return '/accountant/dashboard';
      case 'attorney':
        return '/attorney/dashboard';
      default:
        return '/login';
    }
  };

  // Auto-redirect authenticated users to their dashboard
  if (isAuthenticated && user) {
    return <Navigate to={getDashboardPath()} replace />;
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-bold">Citadel</h1>
          <nav className="flex items-center gap-4">
            <Link to="/login">
              <Button>Log in</Button>
            </Link>
          </nav>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-4xl font-bold">Citadel Investor Portal</h2>
          <p className="mb-8 text-xl text-muted-foreground">
            Comprehensive investor portal for fund management
          </p>
          <div className="flex justify-center gap-4">
            <Link to="/login">
              <Button size="lg">Log in</Button>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}

