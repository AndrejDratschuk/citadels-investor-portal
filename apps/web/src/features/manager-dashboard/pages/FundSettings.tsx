import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Building2, Palette, CreditCard, Users, Plug } from 'lucide-react';
import { cn } from '@/lib/utils';
import { fundsApi, Fund, FundBranding, FundAddress } from '@/lib/api/funds';
import {
  FundProfileTab,
  FundBrandingTab,
  FundBankingTab,
  FundTeamTab,
  FundIntegrationsTab,
} from '../components/settings';

type TabType = 'profile' | 'branding' | 'banking' | 'team' | 'integrations';

const TABS: { id: TabType; label: string; icon: React.ElementType }[] = [
  { id: 'profile', label: 'Fund Profile', icon: Building2 },
  { id: 'branding', label: 'Branding', icon: Palette },
  { id: 'banking', label: 'Banking', icon: CreditCard },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'integrations', label: 'Integrations', icon: Plug },
];

interface ProfileFormState {
  name: string;
  legalName: string;
  address: FundAddress;
}

export function FundSettings(): JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [fund, setFund] = useState<Fund | null>(null);
  const [emailMessage, setEmailMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profile form state
  const [profileData, setProfileData] = useState<ProfileFormState>({
    name: '',
    legalName: '',
    address: { street: '', city: '', state: '', zip: '' },
  });

  // Branding form state
  const [brandingData, setBrandingData] = useState<FundBranding>({
    logoUrl: '',
    primaryColor: '#4f46e5',
    secondaryColor: '#7c3aed',
  });

  // Fetch fund data
  const fetchFund = async (): Promise<void> => {
    try {
      const fundData = await fundsApi.getCurrent();
      setFund(fundData);
      setProfileData({
        name: fundData.name || '',
        legalName: fundData.legalName || '',
        address: {
          street: fundData.address?.street || '',
          city: fundData.address?.city || '',
          state: fundData.address?.state || '',
          zip: fundData.address?.zip || '',
        },
      });
      setBrandingData({
        logoUrl: fundData.branding?.logoUrl || '',
        primaryColor: fundData.branding?.primaryColor || '#4f46e5',
        secondaryColor: fundData.branding?.secondaryColor || '#7c3aed',
      });
    } catch (err) {
      console.error('Failed to fetch fund:', err);
    }
  };

  useEffect(() => {
    fetchFund();
  }, []);

  // Check for OAuth callback params and tab query parameter
  useEffect(() => {
    const emailConnected = searchParams.get('email_connected');
    const emailError = searchParams.get('email_error');
    const connectedEmail = searchParams.get('email');
    const tabParam = searchParams.get('tab');

    if (emailConnected) {
      setActiveTab('integrations');
      setEmailMessage({ type: 'success', text: `Successfully connected ${connectedEmail || 'your email'}!` });
      searchParams.delete('email_connected');
      searchParams.delete('email');
      setSearchParams(searchParams);
    } else if (emailError) {
      setActiveTab('integrations');
      setEmailMessage({ type: 'error', text: `Failed to connect: ${emailError}` });
      searchParams.delete('email_error');
      setSearchParams(searchParams);
    }
    
    if (tabParam === 'integrations') {
      setActiveTab('integrations');
    } else if (tabParam === 'team') {
      setActiveTab('team');
    }
  }, [searchParams, setSearchParams]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Fund Settings</h1>
        <p className="mt-1 text-muted-foreground">
          Manage your fund profile, branding, and team
        </p>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
              activeTab === tab.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted hover:bg-muted/80'
            )}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {activeTab === 'profile' && (
        <FundProfileTab 
          initialData={profileData} 
          onRefresh={fetchFund}
                />
      )}

      {activeTab === 'branding' && (
        <FundBrandingTab 
          initialData={brandingData} 
          onRefresh={fetchFund}
        />
      )}

      {activeTab === 'banking' && (
        <FundBankingTab 
          wireInstructions={fund?.wireInstructions || 'Bank: First National Bank\nRouting: ****1234\nAccount: ****5678'} 
        />
      )}

      {activeTab === 'team' && <FundTeamTab />}

      {activeTab === 'integrations' && (
        <FundIntegrationsTab emailMessage={emailMessage} />
      )}
    </div>
  );
}
