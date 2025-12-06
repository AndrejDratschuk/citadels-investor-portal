import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
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
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { emailApi, EmailConnectionStatus } from '@/lib/api/email';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'manager' | 'accountant' | 'attorney';
}

// Mock data
const mockFund = {
  name: 'FlowVeda Growth Fund I',
  legalName: 'FlowVeda Growth Fund I, LP',
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
  { id: '1', name: 'Jane Manager', email: 'jane@flowveda.com', role: 'manager' },
  { id: '2', name: 'Bob Accountant', email: 'bob@flowveda.com', role: 'accountant' },
  { id: '3', name: 'Alice Attorney', email: 'alice@lawfirm.com', role: 'attorney' },
];

type TabType = 'profile' | 'branding' | 'banking' | 'team' | 'email';

export function FundSettings() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState<TabType>('profile');
  const [showWireDetails, setShowWireDetails] = useState(false);
  
  // Email connection state
  const [emailStatus, setEmailStatus] = useState<EmailConnectionStatus | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMessage, setEmailMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Check for OAuth callback params
  useEffect(() => {
    const emailConnected = searchParams.get('email_connected');
    const emailError = searchParams.get('email_error');
    const connectedEmail = searchParams.get('email');

    if (emailConnected) {
      setActiveTab('email');
      setEmailMessage({ type: 'success', text: `Successfully connected ${connectedEmail || 'your email'}!` });
      // Clear params
      searchParams.delete('email_connected');
      searchParams.delete('email');
      setSearchParams(searchParams);
      // Refresh status
      fetchEmailStatus();
    } else if (emailError) {
      setActiveTab('email');
      setEmailMessage({ type: 'error', text: `Failed to connect: ${emailError}` });
      searchParams.delete('email_error');
      setSearchParams(searchParams);
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
    { id: 'email', label: 'Email', icon: Mail },
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
          <div className="rounded-xl border bg-card p-6">
            <h3 className="text-lg font-semibold">Fund Information</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="fundName">Fund Name</Label>
                <Input id="fundName" defaultValue={mockFund.name} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="legalName">Legal Name</Label>
                <Input id="legalName" defaultValue={mockFund.legalName} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="ein">EIN</Label>
                <Input id="ein" defaultValue={mockFund.ein} disabled />
                <p className="text-xs text-muted-foreground">
                  Contact support to update tax ID
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-xl border bg-card p-6">
            <h3 className="text-lg font-semibold">Address</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2 space-y-2">
                <Label htmlFor="street">Street Address</Label>
                <Input id="street" defaultValue={mockFund.address.street} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">City</Label>
                <Input id="city" defaultValue={mockFund.address.city} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="state">State</Label>
                <Input id="state" defaultValue={mockFund.address.state} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="zip">ZIP Code</Label>
                <Input id="zip" defaultValue={mockFund.address.zip} />
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </div>
        </div>
      )}

      {activeTab === 'branding' && (
        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-6">
            <h3 className="text-lg font-semibold">Logo</h3>
            <div className="mt-4 flex items-center gap-6">
              <div className="flex h-24 w-24 items-center justify-center rounded-xl bg-muted">
                <Building2 className="h-12 w-12 text-muted-foreground" />
              </div>
              <div>
                <Button variant="outline">
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Logo
                </Button>
                <p className="mt-2 text-xs text-muted-foreground">
                  Recommended: 200x200px, PNG or SVG
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
                    defaultValue={mockFund.branding.primaryColor}
                    className="h-10 w-10 cursor-pointer rounded border"
                  />
                  <Input
                    defaultValue={mockFund.branding.primaryColor}
                    className="flex-1"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Secondary Color</Label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    defaultValue={mockFund.branding.secondaryColor}
                    className="h-10 w-10 cursor-pointer rounded border"
                  />
                  <Input
                    defaultValue={mockFund.branding.secondaryColor}
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
                  background: `linear-gradient(to right, ${mockFund.branding.primaryColor}, ${mockFund.branding.secondaryColor})`,
                }}
              />
              <div className="mt-4 flex items-center gap-4">
                <Button style={{ backgroundColor: mockFund.branding.primaryColor }}>
                  Primary Button
                </Button>
                <Button
                  variant="outline"
                  style={{ borderColor: mockFund.branding.primaryColor, color: mockFund.branding.primaryColor }}
                >
                  Secondary Button
                </Button>
              </div>
            </div>
          </div>

          <div className="flex justify-end">
            <Button>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
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

      {activeTab === 'email' && (
        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Mail className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">Email Integration</h3>
                <p className="text-sm text-muted-foreground">
                  Connect your email account to send emails directly from the app
                </p>
              </div>
            </div>

            {/* Status Messages */}
            {emailMessage && (
              <div className={cn(
                'mb-6 flex items-center gap-3 rounded-lg border p-4',
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

            {/* Connected State */}
            {emailStatus?.connected ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-green-900">
                        {emailStatus.provider === 'gmail' ? 'Gmail' : 'Outlook'} Connected
                      </p>
                      <p className="text-sm text-green-700">{emailStatus.email}</p>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    onClick={handleDisconnectEmail}
                    disabled={emailLoading}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    {emailLoading ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : null}
                    Disconnect
                  </Button>
                </div>

                <div className="rounded-lg border bg-muted/50 p-4">
                  <h4 className="font-medium mb-2">How it works</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Emails are sent directly from your {emailStatus.email} account</li>
                    <li>• Sent emails appear in your Gmail/Outlook "Sent" folder</li>
                    <li>• Investors will reply directly to you</li>
                  </ul>
                </div>
              </div>
            ) : (
              /* Not Connected State */
              <div className="space-y-4">
                <p className="text-muted-foreground">
                  Connect your email account to send investor communications directly from FlowVeda. 
                  Emails will be sent from your own email address for a professional touch.
                </p>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {/* Gmail */}
                  <button
                    onClick={handleConnectGmail}
                    disabled={emailLoading}
                    className={cn(
                      'flex items-center gap-4 rounded-xl border-2 p-6 text-left transition-all',
                      'hover:border-primary hover:bg-primary/5',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100">
                      <svg viewBox="0 0 24 24" className="h-7 w-7">
                        <path fill="#EA4335" d="M24 5.457v13.909c0 .904-.732 1.636-1.636 1.636h-3.819V11.73L12 16.64l-6.545-4.91v9.273H1.636A1.636 1.636 0 0 1 0 19.366V5.457c0-2.023 2.309-3.178 3.927-1.964L5.455 4.64 12 9.548l6.545-4.91 1.528-1.145C21.69 2.28 24 3.434 24 5.457z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold">Connect Gmail</p>
                      <p className="text-sm text-muted-foreground">Google Workspace or personal Gmail</p>
                    </div>
                    {emailLoading && (
                      <Loader2 className="ml-auto h-5 w-5 animate-spin" />
                    )}
                  </button>

                  {/* Outlook */}
                  <button
                    onClick={handleConnectOutlook}
                    disabled={emailLoading}
                    className={cn(
                      'flex items-center gap-4 rounded-xl border-2 p-6 text-left transition-all',
                      'hover:border-primary hover:bg-primary/5',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                      <svg viewBox="0 0 24 24" className="h-7 w-7">
                        <path fill="#0078D4" d="M24 7.387v10.478c0 .23-.08.424-.238.576-.16.154-.352.23-.578.23h-8.547v-6.959l1.203.86c.118.09.262.135.43.135.168 0 .312-.045.43-.135L24 7.387zm-.238-1.33c.079.063.142.14.188.227l-7.168 5.133-7.163-5.133c.045-.088.109-.164.188-.227.158-.152.35-.228.577-.228h12.8c.226 0 .418.076.578.228zM9.047 8.882v9.789H.816c-.226 0-.418-.076-.578-.23-.158-.152-.238-.345-.238-.575V4.613l4.297 3.36-4.297 3.468v3.187l4.805-3.883 4.242 3.883v-5.746zm-4.5 8.789h3.93v-2.836l-3.93 3.18v-.344z"/>
                      </svg>
                    </div>
                    <div>
                      <p className="font-semibold">Connect Outlook</p>
                      <p className="text-sm text-muted-foreground">Microsoft 365 or personal Outlook</p>
                    </div>
                    {emailLoading && (
                      <Loader2 className="ml-auto h-5 w-5 animate-spin" />
                    )}
                  </button>

                  {/* SMTP / Other Email */}
                  <button
                    onClick={() => setShowSmtpModal(true)}
                    disabled={emailLoading}
                    className={cn(
                      'flex items-center gap-4 rounded-xl border-2 p-6 text-left transition-all',
                      'hover:border-primary hover:bg-primary/5',
                      'disabled:opacity-50 disabled:cursor-not-allowed'
                    )}
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gray-100">
                      <Mail className="h-7 w-7 text-gray-600" />
                    </div>
                    <div>
                      <p className="font-semibold">Other Email (SMTP)</p>
                      <p className="text-sm text-muted-foreground">Zoho, ProtonMail, custom domain</p>
                    </div>
                  </button>
                </div>

                <div className="rounded-lg border bg-muted/50 p-4 mt-6">
                  <h4 className="font-medium mb-2">Why connect your email?</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Send emails directly from your own email address</li>
                    <li>• Build trust with investors who see emails from you</li>
                    <li>• Keep all sent emails in your regular inbox</li>
                    <li>• No complex setup - just click and authorize</li>
                  </ul>
                </div>
              </div>
            )}
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


