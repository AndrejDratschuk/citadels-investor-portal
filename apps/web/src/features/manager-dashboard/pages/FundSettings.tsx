import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  Building2,
  Palette,
  CreditCard,
  Users,
  Save,
  Upload,
  Plus,
  Trash2,
  Eye,
  EyeOff,
  Mail,
  CheckCircle2,
  XCircle,
  Loader2,
  Plug,
  FileSignature,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { emailApi, EmailConnectionStatus } from '@/lib/api/email';
import { fundsApi, Fund, FundBranding, FundAddress } from '@/lib/api/funds';
import { docuSignApi, DocuSignStatus } from '@/lib/api/docusign';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'manager' | 'accountant' | 'attorney';
}

// Mock data
const mockFund = {
  name: 'Altsui Growth Fund I',
  legalName: 'Altsui Growth Fund I, LP',
  ein: '**-***1234',
  address: {
    street: '123 Investment Blvd',
    city: 'Austin',
    state: 'TX',
    zip: '78701',
  },
  wireInstructions: 'Bank: First National Bank\nRouting: ****1234\nAccount: ****5678',
  branding: {
    primaryColor: '#4f46e5',
    secondaryColor: '#7c3aed',
  },
};

const mockTeam: TeamMember[] = [
  { id: '1', name: 'Jane Manager', email: 'jane@altsui.com', role: 'manager' },
  { id: '2', name: 'Bob Accountant', email: 'bob@altsui.com', role: 'accountant' },
  { id: '3', name: 'Alice Attorney', email: 'alice@lawfirm.com', role: 'attorney' },
];

type TabType = 'profile' | 'branding' | 'banking' | 'team' | 'integrations';

// DocuSign Integration Card Component
function DocuSignCard() {
  const [status, setStatus] = useState<DocuSignStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  // Form state for connecting
  const [integrationKey, setIntegrationKey] = useState('');
  const [accountId, setAccountId] = useState('');
  const [userId, setUserId] = useState('');
  const [rsaPrivateKey, setRsaPrivateKey] = useState('');

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const result = await docuSignApi.getStatus();
      setStatus(result);
    } catch (err) {
      console.error('Failed to fetch DocuSign status:', err);
      setStatus({ configured: false });
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    if (!integrationKey.trim() || !accountId.trim() || !userId.trim() || !rsaPrivateKey.trim()) {
      setMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    setConnecting(true);
    setMessage(null);

    try {
      await docuSignApi.connect({
        integrationKey: integrationKey.trim(),
        accountId: accountId.trim(),
        userId: userId.trim(),
        rsaPrivateKey: rsaPrivateKey.trim(),
      });
      setMessage({ type: 'success', text: 'DocuSign credentials saved. They will be verified when you send a document.' });
      setIntegrationKey('');
      setAccountId('');
      setUserId('');
      setRsaPrivateKey('');
      await fetchStatus();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect DocuSign';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = async () => {
    if (!confirm('Are you sure you want to disconnect DocuSign?')) return;

    setConnecting(true);
    setMessage(null);

    try {
      await docuSignApi.disconnect();
      setMessage({ type: 'success', text: 'DocuSign disconnected' });
      await fetchStatus();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect DocuSign';
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setConnecting(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
            <FileSignature className="h-6 w-6 text-amber-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">DocuSign</h3>
            <p className="text-sm text-muted-foreground">Loading...</p>
          </div>
        </div>
        <div className="flex justify-center py-4">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="flex items-center gap-3 mb-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
          <FileSignature className="h-6 w-6 text-amber-600" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">DocuSign</h3>
          <p className="text-sm text-muted-foreground">
            Send documents for e-signature
          </p>
        </div>
      </div>

      {message && (
        <div className={cn(
          'mb-4 flex items-center gap-2 rounded-lg border p-3 text-sm',
          message.type === 'success' 
            ? 'border-green-200 bg-green-50 text-green-700' 
            : 'border-red-200 bg-red-50 text-red-700'
        )}>
          {message.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4" />
          ) : (
            <XCircle className="h-4 w-4" />
          )}
          {message.text}
        </div>
      )}

      {status?.configured ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <span className="text-sm font-medium text-green-900">Credentials Saved</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Send documents from investor profiles. Connection verified on first use.
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={handleDisconnect}
            disabled={connecting}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            {connecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Disconnect
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Enter your DocuSign API credentials to enable document signing.
          </p>
          
          <div className="space-y-3">
            <div>
              <Label htmlFor="ds-integration-key" className="text-sm">Integration Key</Label>
              <Input
                id="ds-integration-key"
                value={integrationKey}
                onChange={(e) => setIntegrationKey(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="ds-account-id" className="text-sm">Account ID</Label>
              <Input
                id="ds-account-id"
                value={accountId}
                onChange={(e) => setAccountId(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="ds-user-id" className="text-sm">User ID (API Username)</Label>
              <Input
                id="ds-user-id"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="ds-private-key" className="text-sm">RSA Private Key</Label>
              <textarea
                id="ds-private-key"
                value={rsaPrivateKey}
                onChange={(e) => setRsaPrivateKey(e.target.value)}
                placeholder="-----BEGIN RSA PRIVATE KEY-----&#10;...&#10;-----END RSA PRIVATE KEY-----"
                rows={4}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring resize-none"
              />
            </div>
          </div>

          <div className="rounded-lg border bg-muted/50 p-3 text-xs text-muted-foreground">
            <p className="font-medium mb-1">Where to find these:</p>
            <ol className="list-decimal list-inside space-y-0.5">
              <li>Go to DocuSign Admin → Settings → Apps and Keys</li>
              <li>Create or select your integration</li>
              <li>Copy the Integration Key, Account ID, and User ID</li>
              <li>Generate RSA keypair and download the private key</li>
              <li>Grant consent: visit the consent URL once to authorize JWT</li>
            </ol>
          </div>

          <Button
            onClick={handleConnect}
            disabled={connecting || !integrationKey.trim() || !accountId.trim() || !userId.trim() || !rsaPrivateKey.trim()}
            size="sm"
          >
            {connecting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Connect DocuSign
          </Button>
        </div>
      )}
    </div>
  );
}

export function FundSettings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [showWireDetails, setShowWireDetails] = useState(false);
  
  // Email connection state
  const [emailStatus, setEmailStatus] = useState<EmailConnectionStatus | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMessage, setEmailMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fund profile state
  const [profileForm, setProfileForm] = useState({
    name: '',
    legalName: '',
    address: {
      street: '',
      city: '',
      state: '',
      zip: '',
    } as FundAddress,
  });
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fund branding state
  const [, setFund] = useState<Fund | null>(null);
  const [brandingForm, setBrandingForm] = useState<FundBranding>({
    logoUrl: '',
    primaryColor: '#4f46e5',
    secondaryColor: '#7c3aed',
  });
  const [logoUploading, setLogoUploading] = useState(false);
  const [brandingSaving, setBrandingSaving] = useState(false);
  const [brandingMessage, setBrandingMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Fetch fund data
  const fetchFund = async () => {
    try {
      const fundData = await fundsApi.getCurrent();
      setFund(fundData);
      // Populate profile form
      setProfileForm({
        name: fundData.name || '',
        legalName: fundData.legalName || '',
        address: {
          street: fundData.address?.street || '',
          city: fundData.address?.city || '',
          state: fundData.address?.state || '',
          zip: fundData.address?.zip || '',
        },
      });
      // Populate branding form
      setBrandingForm({
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

  // Handle logo upload
  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLogoUploading(true);
    setBrandingMessage(null);
    try {
      const { logoUrl } = await fundsApi.uploadLogo(file);
      setBrandingForm(prev => ({ ...prev, logoUrl }));
      setBrandingMessage({ type: 'success', text: 'Logo uploaded successfully!' });
      fetchFund(); // Refresh local fund data
      // Invalidate the fund query so Sidebar refreshes
      queryClient.invalidateQueries({ queryKey: ['fund', 'current'] });
    } catch (err: any) {
      setBrandingMessage({ type: 'error', text: err.message || 'Failed to upload logo' });
    } finally {
      setLogoUploading(false);
    }
  };

  // Handle logo delete
  const handleLogoDelete = async () => {
    setLogoUploading(true);
    setBrandingMessage(null);
    try {
      await fundsApi.deleteLogo();
      setBrandingForm(prev => ({ ...prev, logoUrl: '' }));
      setBrandingMessage({ type: 'success', text: 'Logo removed successfully!' });
      fetchFund();
      // Invalidate the fund query so Sidebar refreshes
      queryClient.invalidateQueries({ queryKey: ['fund', 'current'] });
    } catch (err: any) {
      setBrandingMessage({ type: 'error', text: err.message || 'Failed to delete logo' });
    } finally {
      setLogoUploading(false);
    }
  };

  // Save branding colors
  const handleSaveBranding = async () => {
    setBrandingSaving(true);
    setBrandingMessage(null);
    try {
      await fundsApi.updateBranding({
        primaryColor: brandingForm.primaryColor,
        secondaryColor: brandingForm.secondaryColor,
      });
      setBrandingMessage({ type: 'success', text: 'Branding saved successfully!' });
      fetchFund();
    } catch (err: any) {
      setBrandingMessage({ type: 'error', text: err.message || 'Failed to save branding' });
    } finally {
      setBrandingSaving(false);
    }
  };

  // Save fund profile
  const handleSaveProfile = async () => {
    setProfileSaving(true);
    setProfileMessage(null);
    try {
      await fundsApi.updateProfile({
        name: profileForm.name,
        legalName: profileForm.legalName,
        address: profileForm.address,
      });
      setProfileMessage({ type: 'success', text: 'Profile saved successfully!' });
      // Invalidate fund query so sidebar updates if name changed
      queryClient.invalidateQueries({ queryKey: ['fund', 'current'] });
      fetchFund();
    } catch (err: any) {
      setProfileMessage({ type: 'error', text: err.message || 'Failed to save profile' });
    } finally {
      setProfileSaving(false);
    }
  };

  // Check for OAuth callback params
  useEffect(() => {
    const emailConnected = searchParams.get('email_connected');
    const emailError = searchParams.get('email_error');
    const connectedEmail = searchParams.get('email');

    if (emailConnected) {
      setActiveTab('integrations');
      setEmailMessage({ type: 'success', text: `Successfully connected ${connectedEmail || 'your email'}!` });
      // Clear params
      searchParams.delete('email_connected');
      searchParams.delete('email');
      setSearchParams(searchParams);
      // Refresh status
      fetchEmailStatus();
    } else if (emailError) {
      setActiveTab('integrations');
      setEmailMessage({ type: 'error', text: `Failed to connect: ${emailError}` });
      searchParams.delete('email_error');
      setSearchParams(searchParams);
    }
    
    // Handle tab query parameter
    const tabParam = searchParams.get('tab');
    if (tabParam === 'integrations') {
      setActiveTab('integrations');
    }
  }, [searchParams, setSearchParams]);

  // Fetch email connection status
  const fetchEmailStatus = async () => {
    try {
      const status = await emailApi.getStatus();
      setEmailStatus(status);
    } catch (err) {
      console.error('Failed to fetch email status:', err);
    }
  };

  useEffect(() => {
    fetchEmailStatus();
  }, []);

  // Connect Gmail
  const handleConnectGmail = async () => {
    setEmailLoading(true);
    setEmailMessage(null);
    try {
      const { authUrl } = await emailApi.connectGmail();
      // Redirect to Google OAuth
      window.location.href = authUrl;
    } catch (err: any) {
      setEmailMessage({ type: 'error', text: err.message || 'Failed to start connection' });
      setEmailLoading(false);
    }
  };

  // Connect Outlook
  const handleConnectOutlook = async () => {
    setEmailLoading(true);
    setEmailMessage(null);
    try {
      const { authUrl } = await emailApi.connectOutlook();
      // Redirect to Microsoft OAuth
      window.location.href = authUrl;
    } catch (err: any) {
      setEmailMessage({ type: 'error', text: err.message || 'Failed to start connection' });
      setEmailLoading(false);
    }
  };

  // SMTP Modal State
  const [showSmtpModal, setShowSmtpModal] = useState(false);
  const [smtpForm, setSmtpForm] = useState({
    email: '',
    host: '',
    port: 587,
    secure: true,
    username: '',
    password: '',
  });
  const [smtpLoading, setSmtpLoading] = useState(false);

  // Connect SMTP
  const handleConnectSmtp = async () => {
    setSmtpLoading(true);
    setEmailMessage(null);
    try {
      await emailApi.connectSmtp(smtpForm);
      setShowSmtpModal(false);
      setEmailMessage({ type: 'success', text: `Successfully connected ${smtpForm.email}!` });
      fetchEmailStatus();
    } catch (err: any) {
      setEmailMessage({ type: 'error', text: err.message || 'Failed to connect SMTP' });
    } finally {
      setSmtpLoading(false);
    }
  };

  // Disconnect email
  const handleDisconnectEmail = async () => {
    if (!confirm('Are you sure you want to disconnect your email account?')) return;
    
    setEmailLoading(true);
    setEmailMessage(null);
    try {
      await emailApi.disconnect(emailStatus?.provider || 'gmail');
      setEmailStatus({ connected: false, provider: null, email: null });
      setEmailMessage({ type: 'success', text: 'Email disconnected successfully' });
    } catch (err: any) {
      setEmailMessage({ type: 'error', text: err.message || 'Failed to disconnect' });
    } finally {
      setEmailLoading(false);
    }
  };

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'profile', label: 'Fund Profile', icon: Building2 },
    { id: 'branding', label: 'Branding', icon: Palette },
    { id: 'banking', label: 'Banking', icon: CreditCard },
    { id: 'team', label: 'Team', icon: Users },
    { id: 'integrations', label: 'Integrations', icon: Plug },
  ];

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
        {tabs.map((tab) => (
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
        <div className="space-y-6">
          {profileMessage && (
            <div className={cn(
              'p-4 rounded-lg',
              profileMessage.type === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            )}>
              {profileMessage.text}
            </div>
          )}

          <div className="rounded-xl border bg-card p-6">
            <h3 className="text-lg font-semibold">Fund Information</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fundName">Fund Name</Label>
                <Input 
                  id="fundName" 
                  value={profileForm.name}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, name: e.target.value }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="legalName">Legal Name</Label>
                <Input 
                  id="legalName" 
                  value={profileForm.legalName}
                  onChange={(e) => setProfileForm(prev => ({ ...prev, legalName: e.target.value }))}
                />
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6">
            <h3 className="text-lg font-semibold">Address</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="street">Street Address</Label>
                <Input 
                  id="street" 
                  value={profileForm.address.street}
                  onChange={(e) => setProfileForm(prev => ({ 
                    ...prev, 
                    address: { ...prev.address, street: e.target.value }
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input 
                  id="city" 
                  value={profileForm.address.city}
                  onChange={(e) => setProfileForm(prev => ({ 
                    ...prev, 
                    address: { ...prev.address, city: e.target.value }
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input 
                  id="state" 
                  value={profileForm.address.state}
                  onChange={(e) => setProfileForm(prev => ({ 
                    ...prev, 
                    address: { ...prev.address, state: e.target.value }
                  }))}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip">ZIP Code</Label>
                <Input 
                  id="zip" 
                  value={profileForm.address.zip}
                  onChange={(e) => setProfileForm(prev => ({ 
                    ...prev, 
                    address: { ...prev.address, zip: e.target.value }
                  }))}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveProfile} disabled={profileSaving}>
              {profileSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Changes
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'branding' && (
        <div className="space-y-6">
          {brandingMessage && (
            <div className={cn(
              'p-4 rounded-lg',
              brandingMessage.type === 'success' 
                ? 'bg-green-50 text-green-700 border border-green-200'
                : 'bg-red-50 text-red-700 border border-red-200'
            )}>
              {brandingMessage.text}
            </div>
          )}

          <div className="rounded-xl border bg-card p-6">
            <h3 className="text-lg font-semibold">Logo</h3>
            <div className="mt-4 flex items-center gap-6">
              <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-muted overflow-hidden">
                {brandingForm.logoUrl ? (
                  <img 
                    src={brandingForm.logoUrl} 
                    alt="Fund logo" 
                    className="h-full w-full object-contain"
                  />
                ) : (
                  <Building2 className="h-12 w-12 text-muted-foreground" />
                )}
              </div>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <label>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      onChange={handleLogoUpload}
                      className="hidden"
                      disabled={logoUploading}
                    />
                    <Button variant="outline" asChild disabled={logoUploading}>
                      <span className="cursor-pointer">
                        {logoUploading ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="mr-2 h-4 w-4" />
                        )}
                        {brandingForm.logoUrl ? 'Change Logo' : 'Upload Logo'}
                      </span>
                    </Button>
                  </label>
                  {brandingForm.logoUrl && (
                    <Button 
                      variant="outline" 
                      onClick={handleLogoDelete}
                      disabled={logoUploading}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  Recommended: 200x200px, PNG or SVG. Max 2MB.
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6">
            <h3 className="text-lg font-semibold">Colors</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Primary Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={brandingForm.primaryColor}
                    onChange={(e) => setBrandingForm(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="h-10 w-10 cursor-pointer rounded border"
                  />
                  <Input
                    value={brandingForm.primaryColor}
                    onChange={(e) => setBrandingForm(prev => ({ ...prev, primaryColor: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Secondary Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={brandingForm.secondaryColor}
                    onChange={(e) => setBrandingForm(prev => ({ ...prev, secondaryColor: e.target.value }))}
                    className="h-10 w-10 cursor-pointer rounded border"
                  />
                  <Input
                    value={brandingForm.secondaryColor}
                    onChange={(e) => setBrandingForm(prev => ({ ...prev, secondaryColor: e.target.value }))}
                    className="flex-1"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6">
            <h3 className="text-lg font-semibold">Preview</h3>
            <div className="mt-4 rounded-lg border p-6">
              <div
                className="h-24 rounded-lg"
                style={{
                  background: `linear-gradient(to right, ${brandingForm.primaryColor}, ${brandingForm.secondaryColor})`,
                }}
              />
              <div className="mt-4 flex items-center gap-4">
                <Button style={{ backgroundColor: brandingForm.primaryColor }}>
                  Primary Button
                </Button>
                <Button
                  variant="outline"
                  style={{ borderColor: brandingForm.primaryColor, color: brandingForm.primaryColor }}
                >
                  Secondary Button
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button onClick={handleSaveBranding} disabled={brandingSaving}>
              {brandingSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Branding
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'banking' && (
        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Wire Instructions</h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowWireDetails(!showWireDetails)}
              >
                {showWireDetails ? (
                  <>
                    <EyeOff className="mr-2 h-4 w-4" /> Hide
                  </>
                ) : (
                  <>
                    <Eye className="mr-2 h-4 w-4" /> Show
                  </>
                )}
              </Button>
            </div>
            <div className="mt-4">
              {showWireDetails ? (
                <textarea
                  className="w-full rounded-lg border bg-background p-4 font-mono text-sm"
                  rows={4}
                  defaultValue={mockFund.wireInstructions}
                />
              ) : (
                <div className="rounded-lg bg-muted p-4 text-center text-muted-foreground">
                  Wire details are hidden for security. Click "Show" to view.
                </div>
              )}
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              These instructions will be shown to investors during capital calls.
            </p>
          </div>

          <div className="flex justify-end">
            <Button>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'team' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">Team Members</h3>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Invite Member
            </Button>
          </div>

          <div className="rounded-xl border bg-card divide-y">
            {mockTeam.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-medium text-primary">
                    {member.name.split(' ').map((n) => n[0]).join('')}
                  </div>
                  <div>
                    <p className="font-medium">{member.name}</p>
                    <p className="text-sm text-muted-foreground">{member.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium capitalize">
                    {member.role}
                  </span>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-red-600">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-xl border bg-muted/50 p-6 text-center">
            <Users className="mx-auto h-8 w-8 text-muted-foreground" />
            <h4 className="mt-2 font-medium">Role Permissions</h4>
            <p className="mt-1 text-sm text-muted-foreground">
              Manager: Full access • Accountant: View + K-1s • Attorney: Documents only
            </p>
          </div>
        </div>
      )}

      {activeTab === 'integrations' && (
        <div className="space-y-6">
          {/* Status Messages */}
          {emailMessage && (
            <div className={cn(
              'flex items-center gap-3 rounded-lg border p-4',
              emailMessage.type === 'success' 
                ? 'border-green-200 bg-green-50' 
                : 'border-red-200 bg-red-50'
            )}>
              {emailMessage.type === 'success' ? (
                <CheckCircle2 className="h-5 w-5 text-green-600" />
              ) : (
                <XCircle className="h-5 w-5 text-red-600" />
              )}
              <p className={cn(
                'text-sm',
                emailMessage.type === 'success' ? 'text-green-700' : 'text-red-700'
              )}>
                {emailMessage.text}
              </p>
            </div>
          )}

          <div className="grid gap-6 lg:grid-cols-2">
            {/* Email Integration Card */}
            <div className="rounded-xl border bg-card p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
                  <Mail className="h-6 w-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold">Email</h3>
                  <p className="text-sm text-muted-foreground">
                    Send emails from your own account
                  </p>
                </div>
              </div>

              {emailStatus?.connected ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-3">
                    <div className="flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <span className="text-sm font-medium text-green-900">
                        {emailStatus.provider === 'gmail' ? 'Gmail' : emailStatus.provider === 'outlook' ? 'Outlook' : 'SMTP'} Connected
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-muted-foreground">{emailStatus.email}</p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleDisconnectEmail}
                    disabled={emailLoading}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {emailLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Disconnect
                  </Button>
                </div>
              ) : (
                <div className="space-y-3">
                  <p className="text-sm text-muted-foreground">
                    Connect to send investor communications from your email.
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleConnectGmail}
                      disabled={emailLoading}
                    >
                      {emailLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (
                        <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4">
                          <path fill="#EA4335" d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
                        </svg>
                      )}
                      Gmail
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleConnectOutlook}
                      disabled={emailLoading}
                    >
                      {emailLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : (
                        <svg viewBox="0 0 24 24" className="mr-2 h-4 w-4">
                          <path fill="#0078D4" d="M24 7.387v10.478c0 .23-.08.424-.238.576-.16.154-.352.23-.578.23h-8.547v-6.959l1.203.86c.118.09.262.135.43.135.168 0 .312-.045.43-.135L24 7.387zm-.238-1.33c.079.063.142.14.188.227l-7.168 5.133-7.163-5.133c.045-.088.109-.164.188-.227.158-.152.35-.228.577-.228h12.8c.226 0 .418.076.578.228zM9.047 8.882v9.789H.816c-.226 0-.418-.076-.578-.23-.158-.152-.238-.345-.238-.575V4.613l4.297 3.36-4.297 3.468v3.187l4.805-3.883 4.242 3.883v-5.746zm-4.5 8.789h3.93v-2.836l-3.93 3.18v-.344z"/>
                        </svg>
                      )}
                      Outlook
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowSmtpModal(true)}
                      disabled={emailLoading}
                    >
                      <Mail className="mr-2 h-4 w-4" />
                      SMTP
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {/* DocuSign Integration Card */}
            <DocuSignCard />
          </div>
        </div>
      )}

      {/* SMTP Configuration Modal */}
      {showSmtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-xl shadow-xl w-full max-w-md p-6 m-4">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Connect SMTP Email</h2>
              <button
                onClick={() => setShowSmtpModal(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <Label htmlFor="smtp-email">Email Address</Label>
                <Input
                  id="smtp-email"
                  type="email"
                  placeholder="you@yourdomain.com"
                  value={smtpForm.email}
                  onChange={(e) => setSmtpForm({ ...smtpForm, email: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="smtp-host">SMTP Host</Label>
                  <Input
                    id="smtp-host"
                    placeholder="smtp.example.com"
                    value={smtpForm.host}
                    onChange={(e) => setSmtpForm({ ...smtpForm, host: e.target.value })}
                  />
                </div>
                <div>
                  <Label htmlFor="smtp-port">Port</Label>
                  <Input
                    id="smtp-port"
                    type="number"
                    placeholder="587"
                    value={smtpForm.port}
                    onChange={(e) => setSmtpForm({ ...smtpForm, port: parseInt(e.target.value) || 587 })}
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="smtp-username">Username</Label>
                <Input
                  id="smtp-username"
                  placeholder="Usually your email address"
                  value={smtpForm.username}
                  onChange={(e) => setSmtpForm({ ...smtpForm, username: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="smtp-password">Password / App Password</Label>
                <Input
                  id="smtp-password"
                  type="password"
                  placeholder="••••••••"
                  value={smtpForm.password}
                  onChange={(e) => setSmtpForm({ ...smtpForm, password: e.target.value })}
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="smtp-secure"
                  checked={smtpForm.secure}
                  onChange={(e) => setSmtpForm({ ...smtpForm, secure: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300"
                />
                <Label htmlFor="smtp-secure" className="text-sm font-normal">
                  Use TLS/SSL (recommended)
                </Label>
              </div>

              <div className="rounded-lg border bg-muted/50 p-3 text-sm text-muted-foreground">
                <p className="font-medium mb-1">Common Settings:</p>
                <ul className="space-y-1 text-xs">
                  <li>• <strong>Zoho:</strong> smtp.zoho.com, port 465</li>
                  <li>• <strong>Yahoo:</strong> smtp.mail.yahoo.com, port 465 (app password)</li>
                  <li>• <strong>ProtonMail:</strong> 127.0.0.1, port 1025 (Bridge required)</li>
                </ul>
              </div>

              {emailMessage && (
                <div className={cn(
                  'p-3 rounded-lg text-sm',
                  emailMessage.type === 'success' 
                    ? 'bg-green-50 text-green-700 border border-green-200'
                    : 'bg-red-50 text-red-700 border border-red-200'
                )}>
                  {emailMessage.text}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <Button
                  variant="outline"
                  onClick={() => setShowSmtpModal(false)}
                  className="flex-1"
                  disabled={smtpLoading}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConnectSmtp}
                  className="flex-1"
                  disabled={smtpLoading || !smtpForm.email || !smtpForm.host || !smtpForm.username || !smtpForm.password}
                >
                  {smtpLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    'Connect'
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}


