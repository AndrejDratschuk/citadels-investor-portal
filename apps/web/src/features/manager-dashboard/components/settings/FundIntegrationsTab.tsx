import { useState, useEffect } from 'react';
import {
  Mail,
  CheckCircle2,
  XCircle,
  Loader2,
  FileSignature,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { emailApi, EmailConnectionStatus } from '@/lib/api/email';
import { docuSignApi, DocuSignStatus } from '@/lib/api/docusign';

interface FundIntegrationsTabProps {
  onEmailConnected?: () => void;
  emailMessage?: { type: 'success' | 'error'; text: string } | null;
}

function DocuSignCard(): JSX.Element {
  const [status, setStatus] = useState<DocuSignStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  
  const [integrationKey, setIntegrationKey] = useState('');
  const [accountId, setAccountId] = useState('');
  const [userId, setUserId] = useState('');
  const [rsaPrivateKey, setRsaPrivateKey] = useState('');

  useEffect(() => {
    fetchStatus();
  }, []);

  const fetchStatus = async (): Promise<void> => {
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

  const handleConnect = async (): Promise<void> => {
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
      setMessage({ type: 'success', text: 'DocuSign credentials saved.' });
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

  const handleDisconnect = async (): Promise<void> => {
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
          <p className="text-sm text-muted-foreground">Send documents for e-signature</p>
        </div>
      </div>

      {message && (
        <div className={cn(
          'mb-4 flex items-center gap-2 rounded-lg border p-3 text-sm',
          message.type === 'success' 
            ? 'border-green-200 bg-green-50 text-green-700' 
            : 'border-red-200 bg-red-50 text-red-700'
        )}>
          {message.type === 'success' ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
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
              <Label htmlFor="ds-user-id" className="text-sm">User ID</Label>
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
                placeholder="-----BEGIN RSA PRIVATE KEY-----"
                rows={4}
                className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-xs font-mono"
              />
            </div>
          </div>
          <Button
            onClick={handleConnect}
            disabled={connecting || !integrationKey.trim() || !accountId.trim()}
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

export function FundIntegrationsTab({ emailMessage: initialEmailMessage }: FundIntegrationsTabProps): JSX.Element {
  const [emailStatus, setEmailStatus] = useState<EmailConnectionStatus | null>(null);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailMessage, setEmailMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(initialEmailMessage || null);
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

  useEffect(() => {
    fetchEmailStatus();
  }, []);

  const fetchEmailStatus = async (): Promise<void> => {
    try {
      const status = await emailApi.getStatus();
      setEmailStatus(status);
    } catch (err) {
      console.error('Failed to fetch email status:', err);
    }
  };

  const handleConnectGmail = async (): Promise<void> => {
    setEmailLoading(true);
    setEmailMessage(null);
    try {
      const { authUrl } = await emailApi.connectGmail();
      window.location.href = authUrl;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start connection';
      setEmailMessage({ type: 'error', text: errorMessage });
      setEmailLoading(false);
    }
  };

  const handleConnectOutlook = async (): Promise<void> => {
    setEmailLoading(true);
    setEmailMessage(null);
    try {
      const { authUrl } = await emailApi.connectOutlook();
      window.location.href = authUrl;
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to start connection';
      setEmailMessage({ type: 'error', text: errorMessage });
      setEmailLoading(false);
    }
  };

  const handleConnectSmtp = async (): Promise<void> => {
    setSmtpLoading(true);
    setEmailMessage(null);
    try {
      await emailApi.connectSmtp(smtpForm);
      setShowSmtpModal(false);
      setEmailMessage({ type: 'success', text: `Successfully connected ${smtpForm.email}!` });
      fetchEmailStatus();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect SMTP';
      setEmailMessage({ type: 'error', text: errorMessage });
    } finally {
      setSmtpLoading(false);
    }
  };

  const handleDisconnectEmail = async (): Promise<void> => {
    if (!confirm('Are you sure you want to disconnect your email account?')) return;
    
    setEmailLoading(true);
    setEmailMessage(null);
    try {
      await emailApi.disconnect(emailStatus?.provider || 'gmail');
      setEmailStatus({ connected: false, provider: null, email: null });
      setEmailMessage({ type: 'success', text: 'Email disconnected successfully' });
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to disconnect';
      setEmailMessage({ type: 'error', text: errorMessage });
    } finally {
      setEmailLoading(false);
    }
  };

  return (
    <div className="space-y-6">
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
              <p className="text-sm text-muted-foreground">Send emails from your own account</p>
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
                <Button variant="outline" size="sm" onClick={handleConnectGmail} disabled={emailLoading}>
                  Gmail
                </Button>
                <Button variant="outline" size="sm" onClick={handleConnectOutlook} disabled={emailLoading}>
                  Outlook
                </Button>
                <Button variant="outline" size="sm" onClick={() => setShowSmtpModal(true)} disabled={emailLoading}>
                  <Mail className="mr-2 h-4 w-4" />
                  SMTP
                </Button>
              </div>
            </div>
          )}
        </div>

        <DocuSignCard />
      </div>

      {/* SMTP Modal */}
      {showSmtpModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50" onClick={() => setShowSmtpModal(false)} />
          <div className="relative z-10 bg-background rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold">Connect SMTP Email</h2>
              <button onClick={() => setShowSmtpModal(false)} className="text-muted-foreground hover:text-foreground">
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
                <Label htmlFor="smtp-password">Password</Label>
                <Input
                  id="smtp-password"
                  type="password"
                  placeholder="••••••••"
                  value={smtpForm.password}
                  onChange={(e) => setSmtpForm({ ...smtpForm, password: e.target.value })}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <Button variant="outline" onClick={() => setShowSmtpModal(false)} className="flex-1" disabled={smtpLoading}>
                  Cancel
                </Button>
                <Button
                  onClick={handleConnectSmtp}
                  className="flex-1"
                  disabled={smtpLoading || !smtpForm.email || !smtpForm.host}
                >
                  {smtpLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Connect
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

