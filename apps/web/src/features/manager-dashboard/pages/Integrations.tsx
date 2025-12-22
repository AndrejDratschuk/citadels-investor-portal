import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Mail,
  FileSignature,
  CheckCircle2,
  XCircle,
  Loader2,
  ExternalLink,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { emailApi, EmailConnectionStatus } from '@/lib/api/email';
import { docuSignApi } from '@/lib/api/docusign';

type TabType = 'email' | 'docusign';

interface SmtpForm {
  email: string;
  host: string;
  port: number;
  username: string;
  password: string;
  secure: boolean;
}

export function Integrations() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get('tab') as TabType | null;
  const [activeTab, setActiveTab] = useState<TabType>(tabFromUrl === 'docusign' ? 'docusign' : 'email');

  // Update URL when tab changes
  const handleTabChange = (tab: TabType) => {
    setActiveTab(tab);
    setSearchParams({ tab });
  };

  // Email state
  const [emailStatus, setEmailStatus] = useState<EmailConnectionStatus | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMessage, setEmailMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showSmtpModal, setShowSmtpModal] = useState(false);
  const [smtpLoading, setSmtpLoading] = useState(false);
  const [smtpForm, setSmtpForm] = useState<SmtpForm>({
    email: '',
    host: '',
    port: 587,
    username: '',
    password: '',
    secure: true,
  });

  // DocuSign state
  const [docuSignStatus, setDocuSignStatus] = useState<{ configured: boolean } | null>(null);
  const [docuSignLoading, setDocuSignLoading] = useState(false);

  // Load email status on mount
  useEffect(() => {
    fetchEmailStatus();
    fetchDocuSignStatus();
  }, []);

  const fetchEmailStatus = async () => {
    try {
      const status = await emailApi.getStatus();
      setEmailStatus(status);
    } catch (error) {
      console.error('Failed to fetch email status:', error);
      setEmailStatus({ connected: false, provider: null, email: null });
    }
  };

  const fetchDocuSignStatus = async () => {
    setDocuSignLoading(true);
    try {
      const status = await docuSignApi.getStatus();
      setDocuSignStatus(status);
    } catch (error) {
      console.error('Failed to fetch DocuSign status:', error);
      setDocuSignStatus({ configured: false });
    } finally {
      setDocuSignLoading(false);
    }
  };

  const handleConnectGmail = async () => {
    setEmailLoading(true);
    setEmailMessage(null);
    try {
      const { authUrl } = await emailApi.connectGmail();
      window.location.href = authUrl;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to connect Gmail';
      setEmailMessage({ type: 'error', text: message });
      setEmailLoading(false);
    }
  };

  const handleConnectOutlook = async () => {
    setEmailLoading(true);
    setEmailMessage(null);
    try {
      const { authUrl } = await emailApi.connectOutlook();
      window.location.href = authUrl;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to connect Outlook';
      setEmailMessage({ type: 'error', text: message });
      setEmailLoading(false);
    }
  };

  const handleConnectSmtp = async () => {
    setSmtpLoading(true);
    setEmailMessage(null);
    try {
      await emailApi.connectSmtp(smtpForm);
      setEmailMessage({ type: 'success', text: 'SMTP connected successfully!' });
      setShowSmtpModal(false);
      await fetchEmailStatus();
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to connect SMTP';
      setEmailMessage({ type: 'error', text: message });
    } finally {
      setSmtpLoading(false);
    }
  };

  const handleDisconnectEmail = async () => {
    setEmailLoading(true);
    try {
      await emailApi.disconnect();
      setEmailStatus({ connected: false, provider: null, email: null });
      setEmailMessage({ type: 'success', text: 'Email disconnected successfully' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to disconnect email';
      setEmailMessage({ type: 'error', text: message });
    } finally {
      setEmailLoading(false);
    }
  };

  const tabs: { id: TabType; label: string; icon: React.ElementType }[] = [
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'docusign', label: 'DocuSign', icon: FileSignature },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Integrations</h1>
        <p className="mt-1 text-muted-foreground">
          Connect external services to enhance your fund management
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b">
        <div className="flex gap-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={cn(
                'flex items-center gap-2 border-b-2 px-1 pb-3 text-sm font-medium transition-colors',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Email Tab */}
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
                        {emailStatus.provider === 'gmail' ? 'Gmail' : emailStatus.provider === 'outlook' ? 'Outlook' : 'SMTP'} Connected
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
                    {emailLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Disconnect
                  </Button>
                </div>

                <div className="rounded-lg border bg-muted/50 p-4">
                  <h4 className="font-medium mb-2">How it works</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Emails are sent directly from your {emailStatus.email} account</li>
                    <li>• Sent emails appear in your email client's "Sent" folder</li>
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
                    {emailLoading && <Loader2 className="ml-auto h-5 w-5 animate-spin" />}
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
                    {emailLoading && <Loader2 className="ml-auto h-5 w-5 animate-spin" />}
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

      {/* DocuSign Tab */}
      {activeTab === 'docusign' && (
        <div className="space-y-6">
          <div className="rounded-xl border bg-card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <FileSignature className="h-5 w-5 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold">DocuSign Integration</h3>
                <p className="text-sm text-muted-foreground">
                  Send documents for electronic signature via DocuSign
                </p>
              </div>
            </div>

            {docuSignLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : docuSignStatus?.configured ? (
              <div className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-green-900">DocuSign Connected</p>
                      <p className="text-sm text-green-700">Ready to send documents for signature</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/50 p-4">
                  <h4 className="font-medium mb-2">How to use</h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Go to any investor's profile page</li>
                    <li>• Click "Send Document" button</li>
                    <li>• Select a template and send for signature</li>
                    <li>• Track signing status in the Documents tab</li>
                  </ul>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 p-4">
                  <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                  <div>
                    <p className="font-medium text-amber-900">DocuSign Not Configured</p>
                    <p className="text-sm text-amber-700">
                      Environment variables are required to enable DocuSign integration
                    </p>
                  </div>
                </div>

                <div className="rounded-lg border bg-muted/50 p-4">
                  <h4 className="font-medium mb-3">Setup Instructions</h4>
                  <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                    <li>Create a DocuSign developer account at{' '}
                      <a
                        href="https://developers.docusign.com/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline inline-flex items-center gap-1"
                      >
                        developers.docusign.com
                        <ExternalLink className="h-3 w-3" />
                      </a>
                    </li>
                    <li>Create an integration (app) and note the Integration Key</li>
                    <li>Generate a Secret Key for JWT authentication</li>
                    <li>Find your Account ID in the admin settings</li>
                    <li>Add the following environment variables to your deployment:</li>
                  </ol>

                  <div className="mt-4 rounded-lg bg-background border p-4 font-mono text-sm">
                    <div className="text-muted-foreground"># Required DocuSign environment variables</div>
                    <div className="mt-2 space-y-1">
                      <div><span className="text-blue-600">DOCUSIGN_INTEGRATION_KEY</span>=your_integration_key</div>
                      <div><span className="text-blue-600">DOCUSIGN_SECRET_KEY</span>=your_secret_key</div>
                      <div><span className="text-blue-600">DOCUSIGN_ACCOUNT_ID</span>=your_account_id</div>
                      <div><span className="text-blue-600">DOCUSIGN_BASE_URL</span>=https://demo.docusign.net</div>
                    </div>
                    <div className="mt-3 text-muted-foreground text-xs">
                      # For production, use: https://na2.docusign.net (or your region)
                    </div>
                  </div>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" asChild>
                    <a
                      href="https://developers.docusign.com/docs/esign-rest-api/esign101/auth/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="mr-2 h-4 w-4" />
                      DocuSign Auth Guide
                    </a>
                  </Button>
                  <Button onClick={fetchDocuSignStatus}>
                    <Loader2 className={cn('mr-2 h-4 w-4', docuSignLoading && 'animate-spin')} />
                    Check Connection
                  </Button>
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

