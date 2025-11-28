import { Link } from 'react-router-dom';
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

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-bold">FlowVeda</h1>
          <nav className="flex items-center gap-4">
            {isAuthenticated ? (
              <Link to={getDashboardPath()}>
                <Button>Go to Dashboard</Button>
              </Link>
            ) : (
              <>
                <Link to="/login">
                  <Button variant="ghost">Log in</Button>
                </Link>
                <Link to="/signup">
                  <Button>Sign up</Button>
                </Link>
              </>
            )}
          </nav>
        </div>
      </header>
      <main className="flex flex-1 items-center justify-center">
        <div className="container mx-auto px-4 text-center">
          <h2 className="mb-4 text-4xl font-bold">FlowVeda Investor Portal</h2>
          <p className="mb-8 text-xl text-muted-foreground">
            Comprehensive investor portal for fund management
          </p>
          {!isAuthenticated && (
            <div className="flex justify-center gap-4">
              <Link to="/signup">
                <Button size="lg">Get Started</Button>
              </Link>
              <Link to="/login">
                <Button size="lg" variant="outline">
                  Log in
                </Button>
              </Link>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

