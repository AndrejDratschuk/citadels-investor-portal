/**
 * GoogleSheetsWizard Component
 * Multi-step wizard for connecting Google Sheets data source
 */

import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Loader2,
  Search,
  Sheet,
  Check,
  ChevronRight,
  ChevronDown,
  FileSpreadsheet,
  Clock,
  ArrowLeft,
  RefreshCw,
  X,
} from 'lucide-react';
import { googlesheetsApi, type SpreadsheetInfo, type SheetInfo, type SheetSection } from '@/lib/api/googlesheets';
import type { ColumnMapping, SyncFrequency } from '@altsui/shared';
import { useKpiDefinitions } from '@/features/manager-dashboard/hooks/useKpiDefinitions';
import { api } from '@/lib/api/client';

// ============================================
// Types
// ============================================
interface GoogleSheetsWizardProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
  connectionData: string;
  googleEmail: string | null;
}

type WizardStep = 'spreadsheet' | 'sheet' | 'dealMapping' | 'mapping' | 'sync';

type DealMappingMode = 'fund' | 'single-deal' | 'multi-deal';

interface DealOption {
  id: string;
  name: string;
}

interface RowToDealMapping {
  rowIdentifier: string; // Value from the identifier column
  dealId: string | null; // Matched deal ID
  dealName?: string; // For display
}

interface MappingRow {
  columnName: string;
  sampleValue: string;
  kpiCode: string;
  customKpiName: string;
  include: boolean;
  rowIndex?: number;
  columnIndex?: number; // For tabular sections
  sectionName?: string; // Which section this metric belongs to
  metricType?: 'summary' | 'detail'; // summary = fund-level, detail = property/asset level
}

// ============================================
// Constants
// ============================================
const SYNC_FREQUENCY_OPTIONS: { value: SyncFrequency; label: string }[] = [
  { value: '5m', label: 'Every 5 minutes' },
  { value: '15m', label: 'Every 15 minutes' },
  { value: '30m', label: 'Every 30 minutes' },
  { value: '1h', label: 'Every hour' },
  { value: '6h', label: 'Every 6 hours' },
  { value: '24h', label: 'Daily' },
  { value: 'manual', label: 'Manual only' },
];

// ============================================
// Toast Helper
// ============================================
function showToast(message: string, type: 'success' | 'error' = 'success'): void {
  if (type === 'error') {
    console.error('[Toast]', message);
  } else {
    console.log('[Toast]', message);
  }
}

// ============================================
// Component
// ============================================
export function GoogleSheetsWizard({
  open,
  onClose,
  onComplete,
  connectionData,
  googleEmail,
}: GoogleSheetsWizardProps): JSX.Element | null {
  // Wizard state
  const [step, setStep] = useState<WizardStep>('spreadsheet');
  const [searchQuery, setSearchQuery] = useState('');

  // Selection state
  const [selectedSpreadsheet, setSelectedSpreadsheet] = useState<SpreadsheetInfo | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<SheetInfo | null>(null);
  const [connectionName, setConnectionName] = useState('');
  const [mappings, setMappings] = useState<MappingRow[]>([]);
  const [syncFrequency, setSyncFrequency] = useState<SyncFrequency>('15m');
  const [syncEnabled, setSyncEnabled] = useState(true);
  const [frequencyDropdownOpen, setFrequencyDropdownOpen] = useState(false);

  // Deal mapping state
  const [dealMappingMode, setDealMappingMode] = useState<DealMappingMode>('fund');
  const [selectedDealId, setSelectedDealId] = useState<string | null>(null);
  const [dealIdentifierColumn, setDealIdentifierColumn] = useState<string>('');
  const [rowToDealMappings, setRowToDealMappings] = useState<RowToDealMapping[]>([]);

  // Fetch KPI definitions
  const { data: kpiDefinitions = [] } = useKpiDefinitions();

  // Fetch deals for mapping
  const { data: dealsData } = useQuery({
    queryKey: ['deals'],
    queryFn: () => api.get<{ id: string; name: string }[]>('/deals'),
    enabled: open,
  });
  const deals: DealOption[] = dealsData || [];

  // Fetch spreadsheets
  const {
    data: spreadsheetsData,
    isLoading: spreadsheetsLoading,
    refetch: refetchSpreadsheets,
  } = useQuery({
    queryKey: ['googlesheets', 'spreadsheets', connectionData],
    queryFn: () => googlesheetsApi.listSpreadsheets(connectionData),
    enabled: open && !!connectionData,
  });

  // Fetch sheets for selected spreadsheet
  const { data: sheetsData, isLoading: sheetsLoading } = useQuery({
    queryKey: ['googlesheets', 'sheets', selectedSpreadsheet?.id, connectionData],
    queryFn: () =>
      selectedSpreadsheet
        ? googlesheetsApi.getSheets(selectedSpreadsheet.id, connectionData)
        : Promise.resolve({ sheets: [] }),
    enabled: !!selectedSpreadsheet && step === 'sheet',
  });

  // Fetch preview for selected sheet
  const { data: previewData, isLoading: previewLoading } = useQuery({
    queryKey: [
      'googlesheets',
      'preview',
      selectedSpreadsheet?.id,
      selectedSheet?.title,
      connectionData,
    ],
    queryFn: () =>
      selectedSpreadsheet && selectedSheet
        ? googlesheetsApi.previewData(selectedSpreadsheet.id, selectedSheet.title, connectionData)
        : Promise.resolve({ preview: { headers: [], rows: [], totalRows: 0 } }),
    enabled: !!selectedSpreadsheet && !!selectedSheet && step === 'mapping',
  });

  // Initialize mappings when preview loads
  useEffect(() => {
    if (!previewData?.preview) return;

    const preview = previewData.preview;
    
    // Handle sections (mixed or single section format)
    if (preview.sections && preview.sections.length > 0) {
      const allMetrics: MappingRow[] = [];
      
      for (const section of preview.sections) {
        for (const metric of section.metrics) {
          const normalizedKey = metric.key.toLowerCase().trim();
          const suggestedKpi = kpiDefinitions.find(
            (kpi) =>
              kpi.code.toLowerCase() === normalizedKey ||
              kpi.name.toLowerCase().includes(normalizedKey) ||
              normalizedKey.includes(kpi.code.toLowerCase()) ||
              normalizedKey.includes(kpi.name.toLowerCase())
          );

          allMetrics.push({
            columnName: metric.key,
            sampleValue: metric.value,
            kpiCode: suggestedKpi?.code || '',
            customKpiName: '',
            include: false,
            rowIndex: metric.rowIndex,
            sectionName: metric.sectionName,
            metricType: metric.metricType,
            columnIndex: metric.columnIndex,
          });
        }
      }
      
      setMappings(allMetrics);
    }
    // Legacy: handle simple tabular format
    else if (preview.headers) {
      const initialMappings = preview.headers.map((header, index) => {
        const normalizedHeader = header.toLowerCase().trim();
        const suggestedKpi = kpiDefinitions.find(
          (kpi) =>
            kpi.code.toLowerCase() === normalizedHeader ||
            kpi.name.toLowerCase().includes(normalizedHeader) ||
            normalizedHeader.includes(kpi.code.toLowerCase())
        );

        return {
          columnName: header,
          sampleValue: preview.rows[0]?.[index] || '',
          kpiCode: suggestedKpi?.code || '',
          customKpiName: '',
          include: !!suggestedKpi,
        };
      });
      setMappings(initialMappings);
    }
  }, [previewData, kpiDefinitions]);

  // Save connection mutation
  const saveMutation = useMutation({
    mutationFn: () => {
      if (!selectedSpreadsheet || !selectedSheet) {
        throw new Error('Please select a spreadsheet and sheet');
      }

      const columnMapping: ColumnMapping[] = mappings
        .filter((m) => m.include && (m.kpiCode || m.customKpiName))
        .map((m) => ({
          columnName: m.columnName,
          kpiCode: m.kpiCode || `custom_${m.customKpiName.toLowerCase().replace(/\s+/g, '_')}`,
          dataType: 'actual' as const,
          // Pass row index for key-value format
          ...(m.rowIndex !== undefined && { rowIndex: m.rowIndex }),
          // Pass column index for tabular format
          ...(m.columnIndex !== undefined && { columnIndex: m.columnIndex }),
          // Pass custom name if using custom metric
          ...(m.customKpiName && { customKpiName: m.customKpiName }),
          // Pass section info
          ...(m.sectionName && { sectionName: m.sectionName }),
          ...(m.metricType && { metricType: m.metricType }),
        }));

      // Determine deal ID based on mapping mode
      let dealId: string | null = null;
      if (dealMappingMode === 'single-deal') {
        dealId = selectedDealId;
      }

      return googlesheetsApi.saveConnection(
        {
          name: connectionName || `${selectedSpreadsheet.name} - ${selectedSheet.title}`,
          spreadsheetId: selectedSpreadsheet.id,
          sheetName: selectedSheet.title,
          columnMapping,
          syncFrequency,
          syncEnabled,
          dealId,
          // Pass multi-deal mapping info
          ...(dealMappingMode === 'multi-deal' && {
            dealMappingMode: 'multi-deal',
            dealIdentifierColumn,
            rowToDealMappings: rowToDealMappings.filter((m) => m.dealId),
          }),
        },
        connectionData
      );
    },
    onSuccess: () => {
      onComplete();
    },
    onError: (err: unknown) => {
      const message = err instanceof Error ? err.message : 'Failed to save connection';
      showToast(message, 'error');
    },
  });

  // Filter spreadsheets by search
  const filteredSpreadsheets =
    spreadsheetsData?.spreadsheets.filter(
      (s) => !searchQuery || s.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) ?? [];

  // Navigation handlers
  function handleBack(): void {
    switch (step) {
      case 'sheet':
        setStep('spreadsheet');
        setSelectedSheet(null);
        break;
      case 'dealMapping':
        setStep('sheet');
        break;
      case 'mapping':
        setStep('dealMapping');
        break;
      case 'sync':
        setStep('mapping');
        break;
    }
  }

  function handleNext(): void {
    switch (step) {
      case 'spreadsheet':
        if (selectedSpreadsheet) {
          setStep('sheet');
        }
        break;
      case 'sheet':
        if (selectedSheet) {
          setStep('dealMapping');
        }
        break;
      case 'dealMapping':
        setStep('mapping');
        break;
      case 'mapping':
        setStep('sync');
        break;
      case 'sync':
        saveMutation.mutate();
        break;
    }
  }

  function handleMappingChange(index: number, kpiCode: string): void {
    setMappings((prev) =>
      prev.map((m, i) => {
        if (i !== index) return m;
        // If selecting custom, clear kpiCode and keep include true
        if (kpiCode === '__custom__') {
          return { ...m, kpiCode: '', customKpiName: m.customKpiName || m.columnName, include: true };
        }
        // Otherwise, set kpiCode and clear customKpiName
        return { ...m, kpiCode, customKpiName: '', include: !!kpiCode };
      })
    );
  }

  function handleCustomKpiChange(index: number, customKpiName: string): void {
    setMappings((prev) =>
      prev.map((m, i) => (i === index ? { ...m, customKpiName, kpiCode: '', include: !!customKpiName } : m))
    );
  }

  function handleIncludeChange(index: number, include: boolean): void {
    setMappings((prev) => prev.map((m, i) => (i === index ? { ...m, include } : m)));
  }

  // Get step title and description
  function getStepInfo(): { title: string; description: string } {
    switch (step) {
      case 'spreadsheet':
        return {
          title: 'Select Spreadsheet',
          description: 'Choose a Google Sheets spreadsheet to sync',
        };
      case 'sheet':
        return {
          title: 'Select Sheet',
          description: 'Choose which sheet within the spreadsheet to sync',
        };
      case 'dealMapping':
        return {
          title: 'Deal Assignment',
          description: 'Choose how to assign data to deals',
        };
      case 'mapping':
        return {
          title: 'Map Metrics',
          description: 'Map spreadsheet columns to your KPIs',
        };
      case 'sync':
        return {
          title: 'Configure Sync',
          description: 'Set up automatic syncing schedule',
        };
    }
  }

  if (!open) return null;

  const { title, description } = getStepInfo();
  const canProceedDealMapping = 
    dealMappingMode === 'fund' ||
    (dealMappingMode === 'single-deal' && selectedDealId) ||
    (dealMappingMode === 'multi-deal' && dealIdentifierColumn && rowToDealMappings.some((m) => m.dealId));

  const canProceed =
    (step === 'spreadsheet' && selectedSpreadsheet) ||
    (step === 'sheet' && selectedSheet) ||
    (step === 'dealMapping' && canProceedDealMapping) ||
    (step === 'mapping' && mappings.some((m) => m.include && (m.kpiCode || m.customKpiName))) ||
    step === 'sync';

  const allSteps: WizardStep[] = ['spreadsheet', 'sheet', 'dealMapping', 'mapping', 'sync'];
  const stepIndex = allSteps.indexOf(step);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sheet className="h-5 w-5 text-green-600" />
              <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
            </div>
            <button onClick={onClose} className="p-1 rounded hover:bg-slate-100">
              <X className="h-5 w-5 text-slate-500" />
            </button>
          </div>
          <p className="text-sm text-slate-500 mt-1">{description}</p>
          {googleEmail && (
            <span className="inline-block mt-2 rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600">
              Connected as {googleEmail}
            </span>
          )}

          {/* Step Progress */}
          <div className="flex items-center gap-1 mt-4">
            {allSteps.map((s, i) => (
              <div key={s} className="flex items-center">
                {i > 0 && <ChevronRight className="h-3 w-3 text-slate-300 mx-0.5" />}
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                    step === s
                      ? 'bg-primary text-white'
                      : stepIndex > i
                        ? 'bg-green-100 text-green-600'
                        : 'bg-slate-100 text-slate-400'
                  }`}
                >
                  {stepIndex > i ? <Check className="h-3 w-3" /> : i + 1}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1 p-6 overflow-auto">
          {/* Step 1: Select Spreadsheet */}
          {step === 'spreadsheet' && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Search spreadsheets..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={() => refetchSpreadsheets()}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>

              {spreadsheetsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : filteredSpreadsheets.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No spreadsheets found</div>
              ) : (
                <div className="space-y-2">
                  {filteredSpreadsheets.map((spreadsheet) => (
                    <button
                      key={spreadsheet.id}
                      onClick={() => setSelectedSpreadsheet(spreadsheet)}
                      className={`flex items-center gap-3 w-full p-3 rounded-lg border text-left transition-colors ${
                        selectedSpreadsheet?.id === spreadsheet.id
                          ? 'border-primary bg-primary/5'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedSpreadsheet?.id === spreadsheet.id
                            ? 'border-primary bg-primary'
                            : 'border-slate-300'
                        }`}
                      >
                        {selectedSpreadsheet?.id === spreadsheet.id && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <FileSpreadsheet className="h-5 w-5 text-green-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900 truncate">{spreadsheet.name}</div>
                        <div className="text-sm text-slate-500 truncate">
                          {spreadsheet.owner} • Modified{' '}
                          {new Date(spreadsheet.modifiedTime).toLocaleDateString()}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select Sheet */}
          {step === 'sheet' && (
            <div className="space-y-4">
              {sheetsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : sheetsData?.sheets.length === 0 ? (
                <div className="text-center py-8 text-slate-500">No sheets found</div>
              ) : (
                <div className="space-y-2">
                  {sheetsData?.sheets.map((sheet) => (
                    <button
                      key={sheet.sheetId}
                      onClick={() => setSelectedSheet(sheet)}
                      className={`flex items-center gap-3 w-full p-3 rounded-lg border text-left transition-colors ${
                        selectedSheet?.title === sheet.title
                          ? 'border-primary bg-primary/5'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedSheet?.title === sheet.title
                            ? 'border-primary bg-primary'
                            : 'border-slate-300'
                        }`}
                      >
                        {selectedSheet?.title === sheet.title && (
                          <Check className="h-3 w-3 text-white" />
                        )}
                      </div>
                      <Sheet className="h-5 w-5 text-blue-600 flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-slate-900">{sheet.title}</div>
                        <div className="text-sm text-slate-500">
                          {sheet.rowCount.toLocaleString()} rows • {sheet.columnCount} columns
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Deal Assignment */}
          {step === 'dealMapping' && (
            <div className="space-y-6">
              <div className="text-sm text-slate-600">
                Choose how you want to assign data from this sheet. This determines whether metrics go to the fund level, a single deal, or multiple deals.
              </div>

              {/* Option 1: Fund Level */}
              <button
                onClick={() => {
                  setDealMappingMode('fund');
                  setSelectedDealId(null);
                  setDealIdentifierColumn('');
                }}
                className={`w-full p-4 rounded-lg border text-left transition-colors ${
                  dealMappingMode === 'fund'
                    ? 'border-primary bg-primary/5'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      dealMappingMode === 'fund' ? 'border-primary bg-primary' : 'border-slate-300'
                    }`}
                  >
                    {dealMappingMode === 'fund' && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">Fund-Level Data</div>
                    <div className="text-sm text-slate-500 mt-1">
                      Import fund overview metrics (IRR, NAV, Total Properties, etc.) that apply to the entire fund.
                    </div>
                  </div>
                </div>
              </button>

              {/* Option 2: Single Deal */}
              <button
                onClick={() => {
                  setDealMappingMode('single-deal');
                  setDealIdentifierColumn('');
                }}
                className={`w-full p-4 rounded-lg border text-left transition-colors ${
                  dealMappingMode === 'single-deal'
                    ? 'border-primary bg-primary/5'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      dealMappingMode === 'single-deal' ? 'border-primary bg-primary' : 'border-slate-300'
                    }`}
                  >
                    {dealMappingMode === 'single-deal' && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-slate-900">Single Deal/Property</div>
                    <div className="text-sm text-slate-500 mt-1">
                      All metrics in this sheet belong to one specific deal or property.
                    </div>
                  </div>
                </div>
              </button>

              {/* Single Deal Selector */}
              {dealMappingMode === 'single-deal' && (
                <div className="ml-8 p-4 bg-slate-50 rounded-lg space-y-3">
                  <Label>Select Deal</Label>
                  <select
                    value={selectedDealId || ''}
                    onChange={(e) => setSelectedDealId(e.target.value || null)}
                    className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm bg-white"
                  >
                    <option value="">Choose a deal...</option>
                    {deals.map((deal) => (
                      <option key={deal.id} value={deal.id}>
                        {deal.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Option 3: Multiple Deals */}
              <button
                onClick={() => {
                  setDealMappingMode('multi-deal');
                  setSelectedDealId(null);
                }}
                className={`w-full p-4 rounded-lg border text-left transition-colors ${
                  dealMappingMode === 'multi-deal'
                    ? 'border-primary bg-primary/5'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 ${
                      dealMappingMode === 'multi-deal' ? 'border-primary bg-primary' : 'border-slate-300'
                    }`}
                  >
                    {dealMappingMode === 'multi-deal' && <Check className="h-3 w-3 text-white" />}
                  </div>
                  <div>
                    <div className="font-medium text-slate-900">Multiple Deals (Portfolio Table)</div>
                    <div className="text-sm text-slate-500 mt-1">
                      Each row represents a different deal/property. You'll map rows to deals.
                    </div>
                  </div>
                </div>
              </button>

              {/* Multi-Deal Configuration */}
              {dealMappingMode === 'multi-deal' && previewData?.preview.sections && (
                <div className="ml-8 p-4 bg-slate-50 rounded-lg space-y-4">
                  {/* Select identifier column */}
                  <div className="space-y-2">
                    <Label>Which column identifies the deal/property?</Label>
                    <select
                      value={dealIdentifierColumn}
                      onChange={(e) => {
                        setDealIdentifierColumn(e.target.value);
                        // Auto-populate row mappings based on selected column
                        if (e.target.value && previewData?.preview.sections) {
                          const tabularSection = previewData.preview.sections.find((s) => s.type === 'tabular');
                          if (tabularSection) {
                            // Get unique values from that column
                            // For now, we'll use the metric names from the tabular section as identifiers
                            const uniqueIdentifiers = new Set<string>();
                            for (const metric of tabularSection.metrics) {
                              if (metric.value && !metric.value.startsWith('Sample:')) {
                                uniqueIdentifiers.add(metric.value);
                              }
                            }
                            
                            // Try to auto-match to existing deals
                            const newMappings: RowToDealMapping[] = [];
                            // If we have preview rows, use those
                            if (previewData.preview.rows.length > 0) {
                              const colIndex = previewData.preview.headers.indexOf(e.target.value);
                              if (colIndex >= 0) {
                                for (const row of previewData.preview.rows) {
                                  const identifier = row[colIndex];
                                  if (identifier) {
                                    const matchedDeal = deals.find(
                                      (d) => d.name.toLowerCase().includes(identifier.toLowerCase()) ||
                                             identifier.toLowerCase().includes(d.name.toLowerCase())
                                    );
                                    newMappings.push({
                                      rowIdentifier: identifier,
                                      dealId: matchedDeal?.id || null,
                                      dealName: matchedDeal?.name,
                                    });
                                  }
                                }
                              }
                            }
                            setRowToDealMappings(newMappings);
                          }
                        }
                      }}
                      className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm bg-white"
                    >
                      <option value="">Select column...</option>
                      {/* Show columns from tabular sections */}
                      {previewData.preview.sections
                        .filter((s) => s.type === 'tabular')
                        .flatMap((s) => s.metrics)
                        .map((m) => m.key)
                        .filter((key, i, arr) => arr.indexOf(key) === i) // unique
                        .map((columnName) => (
                          <option key={columnName} value={columnName}>
                            {columnName}
                          </option>
                        ))}
                    </select>
                    <p className="text-xs text-slate-500">
                      Usually "Property Name", "Asset Name", or "Deal Name"
                    </p>
                  </div>

                  {/* Row to Deal mappings */}
                  {dealIdentifierColumn && rowToDealMappings.length > 0 && (
                    <div className="space-y-2">
                      <Label>Map rows to deals</Label>
                      <div className="max-h-[200px] overflow-y-auto space-y-2">
                        {rowToDealMappings.map((mapping, idx) => (
                          <div key={mapping.rowIdentifier} className="flex items-center gap-2 text-sm">
                            <span className="flex-1 truncate font-medium">{mapping.rowIdentifier}</span>
                            <ChevronRight className="h-4 w-4 text-slate-300 flex-shrink-0" />
                            <select
                              value={mapping.dealId || ''}
                              onChange={(e) => {
                                setRowToDealMappings((prev) =>
                                  prev.map((m, i) =>
                                    i === idx
                                      ? {
                                          ...m,
                                          dealId: e.target.value || null,
                                          dealName: deals.find((d) => d.id === e.target.value)?.name,
                                        }
                                      : m
                                  )
                                );
                              }}
                              className={`w-[180px] rounded-md border px-2 py-1 text-sm ${
                                mapping.dealId ? 'border-green-200 bg-green-50' : 'border-slate-200 bg-white'
                              }`}
                            >
                              <option value="">Skip / No match</option>
                              {deals.map((deal) => (
                                <option key={deal.id} value={deal.id}>
                                  {deal.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs text-slate-500">
                        {rowToDealMappings.filter((m) => m.dealId).length} of {rowToDealMappings.length} rows matched
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Step 4: Map Metrics */}
          {step === 'mapping' && (
            <div className="space-y-4">
              {previewLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                </div>
              ) : (
                <>
                  <div className="text-sm text-slate-500">
                    Found {previewData?.preview.totalRows.toLocaleString() || 0} metrics
                    {previewData?.preview.sections && previewData.preview.sections.length > 1 && (
                      <> in {previewData.preview.sections.length} sections</>
                    )}
                    . Select which metrics to sync to your KPIs.
                  </div>

                  {/* Search/filter */}
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search metrics..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-9"
                    />
                  </div>

                  <div className="space-y-4 max-h-[400px] overflow-y-auto">
                    {/* Group mappings by section */}
                    {(() => {
                      const sections = new Map<string, MappingRow[]>();
                      const filtered = mappings.filter(
                        (m) => !searchQuery || m.columnName.toLowerCase().includes(searchQuery.toLowerCase())
                      );
                      
                      for (const mapping of filtered) {
                        const sectionName = mapping.sectionName || 'Sheet Data';
                        if (!sections.has(sectionName)) {
                          sections.set(sectionName, []);
                        }
                        sections.get(sectionName)!.push(mapping);
                      }
                      
                      return Array.from(sections.entries()).map(([sectionName, sectionMappings]) => (
                        <div key={sectionName} className="space-y-2">
                          {/* Section header */}
                          <div className="flex items-center gap-2 sticky top-0 bg-white py-2 border-b">
                            <div className="flex-1">
                              <h4 className="font-medium text-sm text-slate-900">{sectionName}</h4>
                              <p className="text-xs text-slate-500">
                                {sectionMappings[0]?.metricType === 'summary' 
                                  ? 'Fund-level metrics' 
                                  : 'Property/Asset details'
                                }
                                {' • '}{sectionMappings.length} metrics
                              </p>
                            </div>
                            <button
                              onClick={() => {
                                const sectionKeys = new Set(sectionMappings.map((m) => m.columnName));
                                setMappings((prev) =>
                                  prev.map((m) =>
                                    sectionKeys.has(m.columnName) ? { ...m, include: true } : m
                                  )
                                );
                              }}
                              className="text-xs text-primary hover:underline"
                            >
                              Select Section
                            </button>
                          </div>
                          
                          {/* Section metrics */}
                          {sectionMappings.map((mapping) => {
                            const originalIndex = mappings.findIndex(
                              (m) => m.columnName === mapping.columnName && m.sectionName === mapping.sectionName
                            );
                            return (
                              <div
                                key={`${mapping.sectionName}-${mapping.columnName}`}
                                className={`p-3 rounded-lg border transition-colors ${
                                  mapping.include
                                    ? 'border-primary/50 bg-primary/5'
                                    : 'border-slate-200 hover:border-slate-300'
                                }`}
                              >
                                <div className="flex items-start gap-3">
                                  <button
                                    onClick={() => handleIncludeChange(originalIndex, !mapping.include)}
                                    className={`mt-0.5 w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 ${
                                      mapping.include
                                        ? 'border-primary bg-primary'
                                        : 'border-slate-300 bg-white'
                                    }`}
                                  >
                                    {mapping.include && <Check className="h-3 w-3 text-white" />}
                                  </button>
                                  <div className="flex-1 min-w-0">
                                    <div className="font-medium text-sm text-slate-900">
                                      {mapping.columnName}
                                    </div>
                                    <div className="text-xs text-slate-500 mt-0.5">
                                      {mapping.sampleValue?.startsWith('Sample:') ? (
                                        <span>{mapping.sampleValue}</span>
                                      ) : (
                                        <>Value: <span className="font-mono bg-slate-100 px-1 rounded">{mapping.sampleValue || 'N/A'}</span></>
                                      )}
                                    </div>

                                    {mapping.include && (
                                      <div className="mt-2 flex items-center gap-2">
                                        <span className="text-xs text-slate-500">Map to:</span>
                                        <select
                                          value={mapping.kpiCode || (mapping.customKpiName ? '__custom__' : '')}
                                          onChange={(e) => handleMappingChange(originalIndex, e.target.value)}
                                          className="flex-1 rounded-md border border-slate-200 px-2 py-1 text-sm bg-white"
                                        >
                                          <option value="">Select KPI...</option>
                                          <optgroup label="Existing KPIs">
                                            {kpiDefinitions.map((kpi) => (
                                              <option key={kpi.code} value={kpi.code}>
                                                {kpi.name}
                                              </option>
                                            ))}
                                          </optgroup>
                                          <option value="__custom__">+ Custom Metric</option>
                                        </select>
                                      </div>
                                    )}

                                    {mapping.include && (mapping.kpiCode === '__custom__' || mapping.customKpiName) && (
                                      <div className="mt-2">
                                        <Input
                                          placeholder="Enter custom metric name..."
                                          value={mapping.customKpiName}
                                          onChange={(e) => handleCustomKpiChange(originalIndex, e.target.value)}
                                          className="text-sm"
                                        />
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ));
                    })()}
                  </div>

                  <div className="flex items-center justify-between text-sm text-slate-500 pt-2 border-t">
                    <span>
                      {mappings.filter((m) => m.include && (m.kpiCode || m.customKpiName)).length} metrics selected
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setMappings((prev) => prev.map((m) => ({ ...m, include: true })))}
                        className="text-primary hover:underline text-xs"
                      >
                        Select All
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        onClick={() => setMappings((prev) => prev.map((m) => ({ ...m, include: false })))}
                        className="text-primary hover:underline text-xs"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* Step 4: Configure Sync */}
          {step === 'sync' && (
            <div className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="connection-name">Connection Name</Label>
                <Input
                  id="connection-name"
                  placeholder={
                    selectedSpreadsheet && selectedSheet
                      ? `${selectedSpreadsheet.name} - ${selectedSheet.title}`
                      : 'My Google Sheets Connection'
                  }
                  value={connectionName}
                  onChange={(e) => setConnectionName(e.target.value)}
                />
                <p className="text-sm text-slate-500">
                  A name to identify this connection in your dashboard
                </p>
              </div>

              <div className="border-t border-slate-200 pt-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <Label>Automatic Sync</Label>
                    <p className="text-sm text-slate-500">
                      Automatically sync data on a schedule
                    </p>
                  </div>
                  <button
                    onClick={() => setSyncEnabled(!syncEnabled)}
                    className={`w-11 h-6 rounded-full transition-colors ${
                      syncEnabled ? 'bg-primary' : 'bg-slate-200'
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${
                        syncEnabled ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>

                {syncEnabled && (
                  <div className="space-y-2">
                    <Label htmlFor="sync-frequency">Sync Frequency</Label>
                    <div className="relative">
                      <button
                        onClick={() => setFrequencyDropdownOpen(!frequencyDropdownOpen)}
                        className="flex items-center justify-between w-full rounded-md border border-slate-200 px-3 py-2 text-sm bg-white"
                      >
                        <div className="flex items-center gap-2">
                          <Clock className="h-4 w-4 text-slate-500" />
                          {SYNC_FREQUENCY_OPTIONS.find((o) => o.value === syncFrequency)?.label}
                        </div>
                        <ChevronDown className="h-4 w-4 text-slate-500" />
                      </button>
                      {frequencyDropdownOpen && (
                        <div className="absolute z-10 w-full mt-1 bg-white border border-slate-200 rounded-md shadow-lg">
                          {SYNC_FREQUENCY_OPTIONS.map((option) => (
                            <button
                              key={option.value}
                              onClick={() => {
                                setSyncFrequency(option.value);
                                setFrequencyDropdownOpen(false);
                              }}
                              className={`flex items-center gap-2 w-full px-3 py-2 text-sm text-left hover:bg-slate-50 ${
                                syncFrequency === option.value ? 'bg-primary/5 text-primary' : ''
                              }`}
                            >
                              <Clock className="h-4 w-4" />
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="border-t border-slate-200 pt-6">
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                  <h4 className="font-medium text-slate-900 mb-2">Summary</h4>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>
                      <span className="font-medium text-slate-900">Spreadsheet:</span>{' '}
                      {selectedSpreadsheet?.name}
                    </li>
                    <li>
                      <span className="font-medium text-slate-900">Sheet:</span>{' '}
                      {selectedSheet?.title}
                    </li>
                    <li>
                      <span className="font-medium text-slate-900">Data Assignment:</span>{' '}
                      {dealMappingMode === 'fund' && 'Fund-level data'}
                      {dealMappingMode === 'single-deal' && (
                        <>Single deal: {deals.find((d) => d.id === selectedDealId)?.name || 'Not selected'}</>
                      )}
                      {dealMappingMode === 'multi-deal' && (
                        <>{rowToDealMappings.filter((m) => m.dealId).length} deals mapped</>
                      )}
                    </li>
                    <li>
                      <span className="font-medium text-slate-900">Mapped Metrics:</span>{' '}
                      {mappings.filter((m) => m.include && (m.kpiCode || m.customKpiName)).length}
                    </li>
                    <li>
                      <span className="font-medium text-slate-900">Sync:</span>{' '}
                      {syncEnabled
                        ? SYNC_FREQUENCY_OPTIONS.find((o) => o.value === syncFrequency)?.label
                        : 'Manual only'}
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-slate-200 flex items-center justify-end gap-3">
          {step !== 'spreadsheet' && (
            <Button variant="outline" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleNext} disabled={!canProceed || saveMutation.isPending}>
            {saveMutation.isPending ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : step === 'sync' ? (
              'Save Connection'
            ) : (
              <>
                Next
                <ChevronRight className="h-4 w-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
