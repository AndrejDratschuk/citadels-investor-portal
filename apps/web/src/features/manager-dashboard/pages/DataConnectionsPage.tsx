/**
 * DataConnectionsPage
 * Manage data connections - list, add, edit, sync, delete
 */

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { createPortal } from 'react-dom';
import {
  Database,
  Plus,
  RefreshCw,
  Trash2,
  AlertCircle,
  CheckCircle,
  Clock,
  Loader2,
  FileSpreadsheet,
  X,
  Building2,
  Link2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { dataImportApi } from '@/lib/api/dataImport';
import { useAuth } from '@/hooks/useAuth';
import { DealSelector } from '@/components/common/DealSelector';
import {
  FileUploadStep,
  ColumnMappingStep,
  ImportSuccessModal,
} from '@/features/onboarding/components/data-import';
import { LiveDataSyncingTab } from '@/features/manager-dashboard/components/data-sync';
import type { 
  DataConnection, 
  ParsedFileData,
  SuggestedMapping,
  KpiDefinition,
  ImportResult,
} from '@altsui/shared';
import type { MappingState } from '@/features/onboarding/components/data-import/ColumnMappingStep';
import type { Deal } from '@/lib/api/deals';

type AddFlowStep = 'closed' | 'upload' | 'mapping' | 'success';

interface AddConnectionState {
  step: AddFlowStep;
  connectionName: string;
  selectedDealId: string | null;
  selectedFile: File | null;
  parsedFile: ParsedFileData | null;
  suggestions: SuggestedMapping[];
  mappings: MappingState[];
  kpiDefinitions: KpiDefinition[];
  importResult: ImportResult | null;
  isLoading: boolean;
  error: string | null;
  isSampleData: boolean;
}

const INITIAL_ADD_STATE: AddConnectionState = {
  step: 'closed',
  connectionName: '',
  selectedDealId: null,
  selectedFile: null,
  parsedFile: null,
  suggestions: [],
  mappings: [],
  kpiDefinitions: [],
  importResult: null,
  isLoading: false,
  error: null,
  isSampleData: false,
};

// Lock body scroll when modal is open
function useBodyScrollLock(isLocked: boolean): void {
  useEffect(() => {
    if (isLocked) {
      const originalOverflow = document.body.style.overflow;
      const originalPaddingRight = document.body.style.paddingRight;
      const scrollBarWidth = window.innerWidth - document.documentElement.clientWidth;
      
      document.body.style.overflow = 'hidden';
      if (scrollBarWidth > 0) {
        document.body.style.paddingRight = `${scrollBarWidth}px`;
      }
      
      return () => {
        document.body.style.overflow = originalOverflow;
        document.body.style.paddingRight = originalPaddingRight;
      };
    }
  }, [isLocked]);
}

function getSyncStatusBadge(status: DataConnection['syncStatus']): JSX.Element {
  switch (status) {
    case 'success':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
          <CheckCircle className="h-3 w-3" />
          Synced
        </span>
      );
    case 'syncing':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
          <Loader2 className="h-3 w-3 animate-spin" />
          Syncing
        </span>
      );
    case 'error':
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
          <AlertCircle className="h-3 w-3" />
          Error
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
          <Clock className="h-3 w-3" />
          Pending
        </span>
      );
  }
}

function formatDate(dateString: string | null): string {
  if (!dateString) return 'Never';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function DataConnectionsPage(): JSX.Element {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const [connections, setConnections] = useState<DataConnection[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [addState, setAddState] = useState<AddConnectionState>(INITIAL_ADD_STATE);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [changingDealConnection, setChangingDealConnection] = useState<DataConnection | null>(null);
  const [newDealId, setNewDealId] = useState<string | null>(null);
  const [isChangingDeal, setIsChangingDeal] = useState(false);

  // Determine default tab based on URL params (for OAuth callback)
  const hasGoogleSheetsParams =
    searchParams.has('google_sheets_connected') ||
    searchParams.has('google_sheets_error') ||
    searchParams.has('connection_data');
  const [activeTab, setActiveTab] = useState<string>(
    hasGoogleSheetsParams ? 'live-sync' : 'connections'
  );

  // Lock body scroll when modal is open
  useBodyScrollLock(addState.step !== 'closed' || changingDealConnection !== null);

  // Fetch connections
  const fetchConnections = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await dataImportApi.getConnections();
      setConnections(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load connections');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  // Delete connection
  const handleDelete = async (connectionId: string): Promise<void> => {
    if (!confirm('Are you sure you want to delete this data connection?')) return;
    
    try {
      setDeletingId(connectionId);
      await dataImportApi.deleteConnection(connectionId);
      setConnections(prev => prev.filter(c => c.id !== connectionId));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete connection');
    } finally {
      setDeletingId(null);
    }
  };

  // Sync connection
  const handleSync = async (connectionId: string): Promise<void> => {
    try {
      setSyncingId(connectionId);
      
      // Call the sync API endpoint
      const response = await fetch(`/api/googlesheets/connections/${connectionId}/sync`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });
      
      const result = await response.json();
      
      if (!response.ok || !result.success) {
        throw new Error(result.error || 'Sync failed');
      }
      
      // Refresh connections list to show updated status
      await fetchConnections();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync connection');
    } finally {
      setSyncingId(null);
    }
  };

  // Add connection flow handlers
  const openAddFlow = (): void => {
    setAddState({ ...INITIAL_ADD_STATE, step: 'upload', connectionName: 'New Data Source' });
  };

  const closeAddFlow = (): void => {
    setAddState(INITIAL_ADD_STATE);
    fetchConnections();
  };

  const handleConnectionNameChange = (name: string): void => {
    setAddState(prev => ({ ...prev, connectionName: name }));
  };

  const handleDealChange = (dealId: string | null, _deal: Deal | null): void => {
    setAddState(prev => ({ ...prev, selectedDealId: dealId }));
  };

  // Change deal for existing connection
  const openChangeDealModal = (connection: DataConnection): void => {
    setChangingDealConnection(connection);
    setNewDealId(connection.dealId);
  };

  const closeChangeDealModal = (): void => {
    setChangingDealConnection(null);
    setNewDealId(null);
    setIsChangingDeal(false);
  };

  const handleChangeDealSubmit = async (): Promise<void> => {
    if (!changingDealConnection) return;

    try {
      setIsChangingDeal(true);
      await dataImportApi.updateConnectionDeal(changingDealConnection.id, newDealId);
      await fetchConnections();
      closeChangeDealModal();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update deal');
    } finally {
      setIsChangingDeal(false);
    }
  };

  const handleFileSelect = async (file: File | null): Promise<void> => {
    if (!file) {
      setAddState(prev => ({
        ...prev,
        selectedFile: null,
        parsedFile: null,
        suggestions: [],
        mappings: [],
      }));
      return;
    }

    try {
      setAddState(prev => ({ ...prev, isLoading: true, error: null }));

      const parsedFile = await dataImportApi.parseFile(file);

      const sampleValues: Record<string, unknown[]> = {};
      parsedFile.columns.forEach(col => {
        sampleValues[col] = parsedFile.previewRows.map(row => row[col]);
      });

      const { suggestions, definitions } = await dataImportApi.suggestMappings(
        [...parsedFile.columns],
        sampleValues
      );

      const mappings: MappingState[] = suggestions.map(s => ({
        columnName: s.columnName,
        kpiCode: s.suggestedKpiCode,
        kpiId: s.suggestedKpiCode
          ? definitions.find(d => d.code === s.suggestedKpiCode)?.id ?? null
          : null,
        dataType: s.dataType,
        include: s.include,
        confidence: s.confidence,
      }));

      setAddState(prev => ({
        ...prev,
        selectedFile: file,
        parsedFile,
        suggestions,
        mappings,
        kpiDefinitions: definitions,
        step: 'mapping',
        isLoading: false,
      }));
    } catch (err) {
      setAddState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to parse file',
      }));
    }
  };

  const handleUseSampleData = async (): Promise<void> => {
    try {
      setAddState(prev => ({ ...prev, isLoading: true, error: null }));

      const sampleData = await dataImportApi.getSampleData();
      const { suggestions, definitions } = await dataImportApi.suggestMappings([...sampleData.columns]);

      const parsedFile: ParsedFileData = {
        columns: sampleData.columns,
        rows: sampleData.rows,
        rowCount: sampleData.rows.length,
        previewRows: sampleData.rows.slice(0, 5),
        fileType: 'csv',
        fileName: 'sample-data.csv',
      };

      const mappings: MappingState[] = suggestions.map(s => ({
        columnName: s.columnName,
        kpiCode: s.suggestedKpiCode,
        kpiId: s.suggestedKpiCode
          ? definitions.find(d => d.code === s.suggestedKpiCode)?.id ?? null
          : null,
        dataType: s.dataType,
        include: s.include,
        confidence: s.confidence,
      }));

      setAddState(prev => ({
        ...prev,
        connectionName: sampleData.name,
        parsedFile,
        suggestions,
        mappings,
        kpiDefinitions: definitions,
        step: 'mapping',
        isLoading: false,
        isSampleData: true,
      }));
    } catch (err) {
      setAddState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to load sample data',
      }));
    }
  };

  const handleMappingsChange = (mappings: MappingState[]): void => {
    setAddState(prev => ({ ...prev, mappings }));
  };

  const handleImport = async (): Promise<void> => {
    if (!user?.fundId) return;

    try {
      setAddState(prev => ({ ...prev, isLoading: true, error: null }));

      let result: ImportResult;

      // Use special import endpoint for sample data (imports all 3 dimensions)
      if (addState.isSampleData) {
        result = await dataImportApi.importSampleData({
          fundId: user.fundId,
          dealId: addState.selectedDealId,
        });
      } else {
        // Regular import for user-uploaded files
        if (!addState.parsedFile) return;

        const mappingsToSend = addState.mappings
          .filter(m => m.include && m.kpiCode && m.kpiId)
          .map(m => ({
            columnName: m.columnName,
            kpiCode: m.kpiCode!,
            kpiId: m.kpiId!,
            dataType: m.dataType,
            include: m.include,
          }));

        result = await dataImportApi.importData({
          fundId: user.fundId,
          dealId: addState.selectedDealId,
          connectionName: addState.connectionName,
          mappings: mappingsToSend,
          data: addState.parsedFile.rows as Array<Record<string, unknown>>,
        });
      }

      setAddState(prev => ({
        ...prev,
        importResult: result,
        step: 'success',
        isLoading: false,
      }));
    } catch (err) {
      setAddState(prev => ({
        ...prev,
        isLoading: false,
        error: err instanceof Error ? err.message : 'Failed to import data',
      }));
    }
  };

  // Render empty state
  const renderEmptyState = (): JSX.Element => (
    <div className="text-center py-16">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-100 mb-4">
        <Database className="h-8 w-8 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 mb-2">No data connections yet</h3>
      <p className="text-slate-600 mb-6 max-w-md mx-auto">
        Connect your financial data from spreadsheets to start tracking KPIs and generating insights.
      </p>
      <Button onClick={openAddFlow}>
        <Plus className="h-4 w-4 mr-2" />
        Add Your First Data Source
      </Button>
    </div>
  );

  // Render connections list
  const renderConnectionsList = (): JSX.Element => (
    <div className="space-y-4">
      {connections.map(connection => (
        <div
          key={connection.id}
          className="bg-white rounded-xl border border-slate-200 p-5 hover:border-slate-300 transition-colors"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-slate-100 flex items-center justify-center flex-shrink-0">
                <FileSpreadsheet className="h-6 w-6 text-slate-600" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{connection.name}</h3>
                <p className="text-sm text-slate-500 mt-0.5">
                  {connection.provider === 'google_sheets' ? 'Google Sheets' : 'Excel'} •{' '}
                  {connection.columnMapping.length} columns mapped
                </p>
                
                {/* Deal association */}
                <div className="flex items-center gap-2 mt-2">
                  <Building2 className="h-3.5 w-3.5 text-slate-400" />
                  {connection.dealId ? (
                    <span className="text-sm text-slate-600">
                      {connection.dealName || 'Linked deal'}
                    </span>
                  ) : (
                    <span className="text-sm text-slate-400 italic">No deal linked</span>
                  )}
                  <button
                    onClick={() => openChangeDealModal(connection)}
                    className="text-xs text-primary hover:text-primary/80 font-medium ml-1"
                  >
                    Change
                  </button>
                </div>

                <div className="flex items-center gap-3 mt-2">
                  {getSyncStatusBadge(connection.syncStatus)}
                  <span className="text-xs text-slate-400">
                    Last synced: {formatDate(connection.lastSyncedAt)}
                  </span>
                </div>
                {connection.syncError && (
                  <p className="text-xs text-red-600 mt-1">{connection.syncError}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSync(connection.id)}
                disabled={syncingId === connection.id}
              >
                {syncingId === connection.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleDelete(connection.id)}
                disabled={deletingId === connection.id}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                {deletingId === connection.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Trash2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );

  // Render add connection modal
  const renderAddModal = (): JSX.Element | null => {
    if (addState.step === 'closed') return null;

    return (
      <div 
        className="fixed inset-0 z-[99999] flex items-center justify-center overflow-hidden"
      >
        <div 
          className="fixed inset-0 bg-slate-900/60" 
          onClick={closeAddFlow} 
          aria-hidden="true"
        />
        
        <div className="relative w-full max-w-2xl max-h-[90vh] mx-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-slate-900">Add Data Source</h2>
              <button
                onClick={closeAddFlow}
                className="p-2 rounded-full hover:bg-slate-100 transition-colors"
              >
                <X className="h-5 w-5 text-slate-400" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6">
              {addState.step === 'upload' && (
                <FileUploadStep
                  connectionName={addState.connectionName}
                  onConnectionNameChange={handleConnectionNameChange}
                  selectedDealId={addState.selectedDealId}
                  onDealChange={handleDealChange}
                  onFileSelect={handleFileSelect}
                  onUseSampleData={handleUseSampleData}
                  onBack={closeAddFlow}
                  isLoading={addState.isLoading}
                  error={addState.error}
                  selectedFile={addState.selectedFile}
                  showDealSelector={true}
                />
              )}

              {addState.step === 'mapping' && addState.parsedFile && (
                <ColumnMappingStep
                  parsedData={addState.parsedFile}
                  suggestions={addState.suggestions}
                  kpiDefinitions={addState.kpiDefinitions}
                  onMappingsChange={handleMappingsChange}
                  onContinue={handleImport}
                  onBack={() => setAddState(prev => ({ ...prev, step: 'upload' }))}
                  isLoading={addState.isLoading}
                  error={addState.error}
                  isSampleData={addState.isSampleData}
                />
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Data</h1>
          <p className="mt-1 text-slate-600">
            Manage your data sources and live data syncing
          </p>
        </div>
        {activeTab === 'connections' && connections.length > 0 && (
          <Button onClick={openAddFlow}>
            <Plus className="h-4 w-4 mr-2" />
            Add Data Source
          </Button>
        )}
      </div>

      {/* Error Banner */}
      {error && (
        <div className="flex items-start gap-2 p-4 rounded-lg bg-red-50 text-red-700 border border-red-200">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Error</p>
            <p className="text-sm">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="ml-auto p-1 hover:bg-red-100 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Tab Navigation */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('connections')}
          className={cn(
            'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            activeTab === 'connections'
              ? 'bg-primary text-white'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          )}
        >
          <Database className="h-4 w-4" />
          Data Connections
        </button>
        <button
          onClick={() => setActiveTab('live-sync')}
          className={cn(
            'flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors',
            activeTab === 'live-sync'
              ? 'bg-primary text-white'
              : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
          )}
        >
          <Link2 className="h-4 w-4" />
          Live Data Syncing
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'connections' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
          ) : connections.length === 0 ? (
            renderEmptyState()
          ) : (
            renderConnectionsList()
          )}
        </div>
      )}

      {activeTab === 'live-sync' && (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <LiveDataSyncingTab />
        </div>
      )}

      {/* Add Connection Modal - rendered via portal to escape stacking context */}
      {addState.step !== 'closed' && addState.step !== 'success' && createPortal(renderAddModal(), document.body)}

      {/* Success Modal */}
      {addState.importResult && createPortal(
        <ImportSuccessModal
          result={addState.importResult}
          connectionName={addState.connectionName}
          onClose={closeAddFlow}
          isOpen={addState.step === 'success'}
        />,
        document.body
      )}

      {/* Change Deal Modal */}
      {changingDealConnection && createPortal(
        <div className="fixed inset-0 z-[99999] flex items-center justify-center">
          <div 
            className="fixed inset-0 bg-slate-900/60" 
            onClick={closeChangeDealModal} 
            aria-hidden="true"
          />
          <div className="relative w-full max-w-md mx-4">
            <div className="bg-white rounded-2xl shadow-2xl">
              <div className="flex items-center justify-between px-6 py-4 border-b">
                <h2 className="text-lg font-semibold text-slate-900">Change Deal</h2>
                <button
                  onClick={closeChangeDealModal}
                  className="p-2 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X className="h-5 w-5 text-slate-400" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div className="min-h-[200px]">
                  <p className="text-sm text-slate-600 mb-3">
                    Select which deal the data connection "<span className="font-medium">{changingDealConnection.name}</span>" should be linked to:
                  </p>
                  <DealSelector
                    value={newDealId}
                    onChange={(id: string | null) => setNewDealId(id)}
                    placeholder="Select a deal..."
                    allowNull={true}
                    nullLabel="No specific deal (fund-level)"
                  />
                </div>
                <div className="flex items-center justify-end gap-3 pt-2">
                  <Button variant="outline" onClick={closeChangeDealModal}>
                    Cancel
                  </Button>
                  <Button onClick={handleChangeDealSubmit} disabled={isChangingDeal}>
                    {isChangingDeal ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin mr-2" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}

