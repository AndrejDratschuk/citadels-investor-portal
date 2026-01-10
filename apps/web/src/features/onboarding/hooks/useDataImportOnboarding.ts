/**
 * useDataImportOnboarding Hook
 * ORCHESTRATOR: Manages flow, handles errors, injects dependencies
 * State machine for data import onboarding experience
 */

import { useState, useCallback } from 'react';
import { dataImportApi } from '@/lib/api/dataImport';
import { fileUploadInputSchema } from '@altsui/shared';
import type {
  DataImportStep,
  DataSourceType,
  ParsedFileData,
  SuggestedMapping,
  ImportResult,
  KpiDefinition,
} from '@altsui/shared';
import type { MappingState } from '../components/data-import/ColumnMappingStep';

// ============================================
// State Types
// ============================================

interface DataImportState {
  currentStep: DataImportStep;
  selectedSource: DataSourceType | null;
  connectionName: string;
  selectedFile: File | null;
  parsedFile: ParsedFileData | null;
  suggestedMappings: SuggestedMapping[];
  confirmedMappings: MappingState[];
  kpiDefinitions: KpiDefinition[];
  importResult: ImportResult | null;
  isLoading: boolean;
  error: string | null;
  useSampleData: boolean;
}

interface UseDataImportOnboardingReturn {
  state: DataImportState;
  // Navigation
  goToStep: (step: DataImportStep) => void;
  goBack: () => void;
  skipOnboarding: () => void;
  // Data source selection
  selectSource: (source: DataSourceType) => void;
  // File handling
  setConnectionName: (name: string) => void;
  handleFileSelect: (file: File | null) => Promise<void>;
  handleUseSampleData: () => Promise<void>;
  // Mapping
  updateMappings: (mappings: MappingState[]) => void;
  // Import
  executeImport: (fundId: string, dealId: string) => Promise<void>;
  // AI Dashboard
  generateDashboard: () => void;
  skipDashboard: () => void;
  // Reset
  reset: () => void;
}

// ============================================
// Initial State
// ============================================

const INITIAL_STATE: DataImportState = {
  currentStep: 'welcome',
  selectedSource: null,
  connectionName: '',
  selectedFile: null,
  parsedFile: null,
  suggestedMappings: [],
  confirmedMappings: [],
  kpiDefinitions: [],
  importResult: null,
  isLoading: false,
  error: null,
  useSampleData: false,
};

// ============================================
// Step Navigation
// ============================================

const STEP_ORDER: DataImportStep[] = [
  'welcome',
  'source-selection',
  'file-upload',
  'column-mapping',
  'import-progress',
  'success',
  'ai-dashboard',
];

function getPreviousStep(currentStep: DataImportStep): DataImportStep | null {
  const currentIndex = STEP_ORDER.indexOf(currentStep);
  if (currentIndex <= 0) return null;
  return STEP_ORDER[currentIndex - 1];
}

// ============================================
// Error Formatting
// ============================================

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return 'An unexpected error occurred';
}

// ============================================
// Hook Implementation
// ============================================

export function useDataImportOnboarding(
  fundName?: string
): UseDataImportOnboardingReturn {
  const [state, setState] = useState<DataImportState>(() => ({
    ...INITIAL_STATE,
    connectionName: fundName ? `${fundName} - Financial Data` : 'Financial Data',
  }));

  // ========== Navigation ==========

  const goToStep = useCallback((step: DataImportStep): void => {
    setState(prev => ({ ...prev, currentStep: step, error: null }));
  }, []);

  const goBack = useCallback((): void => {
    setState(prev => {
      const previousStep = getPreviousStep(prev.currentStep);
      if (!previousStep) return prev;
      return { ...prev, currentStep: previousStep, error: null };
    });
  }, []);

  const skipOnboarding = useCallback((): void => {
    // Mark as skipped in state - parent component handles navigation
    setState(prev => ({ ...prev, currentStep: 'welcome' }));
  }, []);

  // ========== Data Source Selection ==========

  const selectSource = useCallback((source: DataSourceType): void => {
    setState(prev => ({
      ...prev,
      selectedSource: source,
      useSampleData: source === 'sample',
      error: null,
    }));
  }, []);

  // ========== File Handling ==========

  const setConnectionName = useCallback((name: string): void => {
    setState(prev => ({ ...prev, connectionName: name }));
  }, []);

  const handleFileSelect = useCallback(async (file: File | null): Promise<void> => {
    if (!file) {
      setState(prev => ({
        ...prev,
        selectedFile: null,
        parsedFile: null,
        suggestedMappings: [],
        error: null,
      }));
      return;
    }

    // ORCHESTRATOR: try/catch at this level
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Validate at boundary
      const validation = fileUploadInputSchema.safeParse({
        fileName: file.name,
        fileType: file.name.split('.').pop()?.toLowerCase(),
        fileSize: file.size,
      });

      if (!validation.success) {
        const errorMessage = validation.error.errors[0]?.message || 'Invalid file';
        setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
        return;
      }

      // Parse file
      const parsedFile = await dataImportApi.parseFile(file);

      // Get suggestions from API
      const sampleValues: Record<string, unknown[]> = {};
      parsedFile.columns.forEach(col => {
        sampleValues[col] = parsedFile.previewRows.map(row => row[col]);
      });

      const { suggestions, definitions } = await dataImportApi.suggestMappings(
        parsedFile.columns,
        sampleValues
      );

      // Initialize confirmed mappings from suggestions
      const confirmedMappings: MappingState[] = suggestions.map(s => ({
        columnName: s.columnName,
        kpiCode: s.suggestedKpiCode,
        kpiId: s.suggestedKpiCode
          ? definitions.find(d => d.code === s.suggestedKpiCode)?.id ?? null
          : null,
        dataType: s.dataType,
        include: s.include,
        confidence: s.confidence,
      }));

      setState(prev => ({
        ...prev,
        selectedFile: file,
        parsedFile,
        suggestedMappings: suggestions,
        confirmedMappings,
        kpiDefinitions: definitions,
        currentStep: 'column-mapping',
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: formatError(error),
      }));
    }
  }, []);

  const handleUseSampleData = useCallback(async (): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      // Get sample data
      const sampleData = await dataImportApi.getSampleData();

      // Get suggestions
      const { suggestions, definitions } = await dataImportApi.suggestMappings(
        sampleData.columns
      );

      // Build parsed file structure from sample data
      const parsedFile: ParsedFileData = {
        columns: sampleData.columns,
        rows: sampleData.rows,
        rowCount: sampleData.rows.length,
        previewRows: sampleData.rows.slice(0, 5),
        fileType: 'csv',
        fileName: 'sample-data.csv',
      };

      // Initialize confirmed mappings
      const confirmedMappings: MappingState[] = suggestions.map(s => ({
        columnName: s.columnName,
        kpiCode: s.suggestedKpiCode,
        kpiId: s.suggestedKpiCode
          ? definitions.find(d => d.code === s.suggestedKpiCode)?.id ?? null
          : null,
        dataType: s.dataType,
        include: s.include,
        confidence: s.confidence,
      }));

      setState(prev => ({
        ...prev,
        useSampleData: true,
        selectedSource: 'sample',
        connectionName: sampleData.name,
        parsedFile,
        suggestedMappings: suggestions,
        confirmedMappings,
        kpiDefinitions: definitions,
        currentStep: 'column-mapping',
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: formatError(error),
      }));
    }
  }, []);

  // ========== Mapping ==========

  const updateMappings = useCallback((mappings: MappingState[]): void => {
    setState(prev => ({ ...prev, confirmedMappings: mappings }));
  }, []);

  // ========== Import ==========

  const executeImport = useCallback(async (
    fundId: string,
    dealId: string
  ): Promise<void> => {
    try {
      setState(prev => ({ ...prev, isLoading: true, error: null }));

      let result: ImportResult;

      if (state.useSampleData) {
        result = await dataImportApi.importSampleData({ fundId, dealId });
      } else {
        if (!state.parsedFile) {
          throw new Error('No file data available');
        }

        const mappingsToSend = state.confirmedMappings
          .filter(m => m.include && m.kpiCode && m.kpiId)
          .map(m => ({
            columnName: m.columnName,
            kpiCode: m.kpiCode!,
            kpiId: m.kpiId!,
            dataType: m.dataType,
            include: m.include,
          }));

        result = await dataImportApi.importData({
          fundId,
          dealId,
          connectionName: state.connectionName,
          mappings: mappingsToSend,
          data: state.parsedFile.rows as Array<Record<string, unknown>>,
        });
      }

      setState(prev => ({
        ...prev,
        importResult: result,
        currentStep: 'success',
        isLoading: false,
        error: null,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: formatError(error),
      }));
    }
  }, [state.useSampleData, state.parsedFile, state.confirmedMappings, state.connectionName]);

  // ========== AI Dashboard ==========

  const generateDashboard = useCallback((): void => {
    // For now, just proceed to completion
    // In the future, this would call an API to generate dashboard widgets
    setState(prev => ({ ...prev, currentStep: 'ai-dashboard' }));
  }, []);

  const skipDashboard = useCallback((): void => {
    // Mark complete without generating
    setState(prev => ({ ...prev, currentStep: 'ai-dashboard' }));
  }, []);

  // ========== Reset ==========

  const reset = useCallback((): void => {
    setState({
      ...INITIAL_STATE,
      connectionName: fundName ? `${fundName} - Financial Data` : 'Financial Data',
    });
  }, [fundName]);

  return {
    state,
    goToStep,
    goBack,
    skipOnboarding,
    selectSource,
    setConnectionName,
    handleFileSelect,
    handleUseSampleData,
    updateMappings,
    executeImport,
    generateDashboard,
    skipDashboard,
    reset,
  };
}




