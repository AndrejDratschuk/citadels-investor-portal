import { useParams, Link } from 'react-router-dom';
import { useMemo } from 'react';
import { User, Building2, Users, Briefcase, ArrowRight } from 'lucide-react';
import { PublicFormHeader } from '@/components/layout/PublicFormHeader';
import { useFundBranding } from '@/hooks/useFund';

interface InvestorTypeOption {
  id: string;
  category: 'individual' | 'entity';
  type: string;
  title: string;
  description: string;
  icon: typeof User;
  path: string;
}

const INVESTOR_TYPE_OPTIONS: InvestorTypeOption[] = [
  {
    id: 'individual',
    category: 'individual',
    type: 'hnw',
    title: 'Individual',
    description: 'High net worth individual investors',
    icon: User,
    path: 'individual',
  },
  {
    id: 'trust',
    category: 'entity',
    type: 'trust',
    title: 'Trust',
    description: 'Family trusts, revocable and irrevocable trusts',
    icon: Users,
    path: 'trust',
  },
  {
    id: 'fund',
    category: 'entity',
    type: 'family_office',
    title: 'Fund / Family Office',
    description: 'Family offices and investment funds',
    icon: Briefcase,
    path: 'fund',
  },
  {
    id: 'entity',
    category: 'entity',
    type: 'corp_llc',
    title: 'Entity',
    description: 'Corporations, LLCs, and other business entities',
    icon: Building2,
    path: 'entity',
  },
];

export function KYCTypeSelectorPage() {
  const { fundCode } = useParams<{ fundCode: string }>();

  // Fetch fund branding
  const { data: fundBranding } = useFundBranding(fundCode);

  // Create CSS custom properties for branding colors
  const brandingStyle = useMemo(() => {
    const primaryColor = fundBranding?.branding?.primaryColor || '#4f46e5';
    const secondaryColor = fundBranding?.branding?.secondaryColor || '#7c3aed';
    return {
      '--brand-primary': primaryColor,
      '--brand-secondary': secondaryColor,
    } as React.CSSProperties;
  }, [fundBranding]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white" style={brandingStyle}>
      <PublicFormHeader fundId={fundCode} />

      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-bold tracking-tight">
            Investor Pre-Qualification
          </h1>
          <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
            Select your investor type to begin the pre-qualification process.
            This helps us tailor the application to your specific situation.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {INVESTOR_TYPE_OPTIONS.map((option) => {
            const Icon = option.icon;
            return (
              <Link
                key={option.id}
                to={`/kyc/${fundCode}/${option.path}`}
                className="group relative rounded-xl border bg-white p-6 shadow-sm transition-all hover:shadow-md hover:border-primary/50"
              >
                <div className="flex items-start gap-4">
                  <div 
                    className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--brand-primary, #4f46e5) 10%, transparent)' }}
                  >
                    <Icon 
                      className="h-6 w-6" 
                      style={{ color: 'var(--brand-primary, #4f46e5)' }}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold group-hover:text-primary">
                      {option.title}
                    </h3>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {option.description}
                    </p>
                  </div>
                  <ArrowRight className="h-5 w-5 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-muted-foreground">
            Not sure which type applies to you?{' '}
            <a 
              href="mailto:support@flowveda.com" 
              className="font-medium underline hover:no-underline"
              style={{ color: 'var(--brand-primary, #4f46e5)' }}
            >
              Contact us for assistance
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}






