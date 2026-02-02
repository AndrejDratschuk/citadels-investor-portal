/**
 * LiveDataSyncingTab Component
 * Tab content showing integration cards for live data syncing
 */

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sheet, FileSpreadsheet, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { IntegrationCard } from './IntegrationCard';
import { GoogleSheetsWizard } from './GoogleSheetsWizard';
import { googlesheetsApi } from '@/lib/api/googlesheets';
import type { DataConnection } from '@altsui/shared';

// ============================================
// Toast Helper (simple implementation)
// ============================================
function showToast(message: string, type: 'success' | 'error' = 'success'): void {
  // Simple console log fallback - in production, integrate with your toast system
  if (type === 'error') {
    console.error('[Toast]', message);
  } else {
    console.log('[Toast]', message);
  }
}

// ============================================
// Component
// ============================================
export function LiveDataSyncingTab(): JSX.Element {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryClient = useQueryClient();

  // State for wizard dialog
  const [wizardOpen, setWizardOpen] = useState(false);
  const [connectionData, setConnectionData] = useState<string | null>(null);
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);

  // State for disconnect confirmation
  const [disconnectConnection, setDisconnectConnection] = useState<DataConnection | null>(null);

  // Handle OAuth callback parameters
  useEffect(() => {
    const connected = searchParams.get('google_sheets_connected');
    const error = searchParams.get('google_sheets_error');
    const data = searchParams.get('connection_data');
    const email = searchParams.get('google_email');

    if (connected === 'true' && data) {
      setConnectionData(data);
      setGoogleEmail(email);
      setWizardOpen(true);

      // Clean up URL params
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('google_sheets_connected');
      newParams.delete('google_sheets_error');
      newParams.delete('connection_data');
      newParams.delete('google_email');
      setSearchParams(newParams, { replace: true });
    } else if (error) {
      showToast(`Google Sheets connection failed: ${error}`, 'error');

      // Clean up URL params
      const newParams = new URLSearchParams(searchParams);
      newParams.delete('google_sheets_error');
      setSearchParams(newParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Fetch Google Sheets status
  const { data: googleSheetsStatus } = useQuery({
    queryKey: ['googlesheets', 'status'],
    queryFn: googlesheetsApi.getStatus,
  });

  // Sync mutation
  const syncMutation = useMutation({
    mutationFn: (connectionId: string) => googlesheetsApi.syncNow(connectionId),
    onSuccess: () => {
      showToast('Sync completed successfully');
      queryClient.invalidateQueries({ queryKey: ['googlesheets'] });
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Sync failed';
      showToast(message, 'error');
    },
  });

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: (connectionId: string) => googlesheetsApi.disconnect(connectionId),
    onSuccess: () => {
      showToast('Connection removed');
      queryClient.invalidateQueries({ queryKey: ['googlesheets'] });
      setDisconnectConnection(null);
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Failed to disconnect';
      showToast(message, 'error');
    },
  });

  // Handle Google Sheets connect
  async function handleGoogleSheetsConnect(): Promise<void> {
    try {
      const { authUrl } = await googlesheetsApi.connect();
      // Redirect to Google OAuth
      window.location.href = authUrl;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to start connection';
      showToast(message, 'error');
    }
  }

  // Handle sync
  function handleSync(connection: DataConnection): void {
    syncMutation.mutate(connection.id);
  }

  // Handle disconnect confirmation
  function handleDisconnectConfirm(): void {
    if (disconnectConnection) {
      disconnectMutation.mutate(disconnectConnection.id);
    }
  }

  // Handle wizard close
  function handleWizardClose(): void {
    setWizardOpen(false);
    setConnectionData(null);
    setGoogleEmail(null);
  }

  // Handle wizard complete
  function handleWizardComplete(): void {
    handleWizardClose();
    queryClient.invalidateQueries({ queryKey: ['googlesheets'] });
    showToast('Google Sheets connection created successfully');
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold text-slate-900">Live Data Syncing</h2>
        <p className="text-slate-500">
          Connect external data sources to automatically sync your KPI data
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Google Sheets Card */}
        <IntegrationCard
          title="Google Sheets"
          description="Sync data from Google Sheets spreadsheets"
          icon={<Sheet className="h-6 w-6 text-green-600" />}
          connected={googleSheetsStatus?.connected ?? false}
          connections={googleSheetsStatus?.connections ?? []}
          onConnect={handleGoogleSheetsConnect}
          onSync={handleSync}
          onDisconnect={setDisconnectConnection}
        />

        {/* Excel Card - Coming Soon */}
        <IntegrationCard
          title="Microsoft Excel"
          description="Sync data from Excel files in OneDrive"
          icon={<FileSpreadsheet className="h-6 w-6 text-green-600" />}
          connected={false}
          connections={[]}
          comingSoon
          onConnect={() => {}}
        />
      </div>

      {/* Google Sheets Wizard */}
      {connectionData && (
        <GoogleSheetsWizard
          open={wizardOpen}
          onClose={handleWizardClose}
          onComplete={handleWizardComplete}
          connectionData={connectionData}
          googleEmail={googleEmail}
        />
      )}

      {/* Disconnect Confirmation Modal */}
      {disconnectConnection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/50"
            onClick={() => setDisconnectConnection(null)}
          />
          <div className="relative z-10 bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-slate-900">Remove Connection</h3>
              <button
                onClick={() => setDisconnectConnection(null)}
                className="p-1 rounded hover:bg-slate-100"
              >
                <X className="h-5 w-5 text-slate-500" />
              </button>
            </div>
            <p className="text-slate-600 mb-6">
              Are you sure you want to remove the connection "{disconnectConnection.name}"? This
              will stop automatic syncing but won't delete any previously synced data.
            </p>
            <div className="flex items-center justify-end gap-3">
              <Button variant="outline" onClick={() => setDisconnectConnection(null)}>
                Cancel
              </Button>
              <Button
                onClick={handleDisconnectConfirm}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
