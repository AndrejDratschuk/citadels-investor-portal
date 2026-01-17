/**
 * ColumnMappingStep Component
 * Column mapping interface with data preview and auto-suggestions
 */

import { useState } from 'react';
import { 
  Check, 
  AlertCircle, 
  ChevronDown,
  Sparkles,
  Info,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { 
  SuggestedMapping, 
  ParsedFileData,
  KpiDefinition,
  KpiDataType,
  MappingConfidence,
} from '@altsui/shared';

interface ColumnMappingStepProps {
  parsedData: ParsedFileData;
  suggestions: SuggestedMapping[];
  kpiDefinitions: KpiDefinition[];
  onMappingsChange: (mappings: MappingState[]) => void;
  onContinue: () => void;
  onBack: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export interface MappingState {
  columnName: string;
  kpiCode: string | null;
  kpiId: string | null;
  dataType: KpiDataType;
  include: boolean;
  confidence: MappingConfidence;
}

const DATA_TYPES: { value: KpiDataType; label: string; description: string }[] = [
  { value: 'actual', label: 'Actual', description: 'Real results that occurred' },
  { value: 'forecast', label: 'Forecast', description: 'Predicted/planned values' },
  { value: 'budget', label: 'Budget', description: 'Approved targets' },
];

type BulkDataTypeOption = KpiDataType | 'mixed';

function getConfidenceBadge(confidence: MappingConfidence): JSX.Element | null {
  switch (confidence) {
    case 'high':
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-emerald-100 text-emerald-700">
          <Sparkles className="h-3 w-3" />
          Auto-detected
        </span>
      );
    case 'medium':
      return (
        <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-700">
          Suggested
        </span>
      );
    default:
      return null;
  }
}

export function ColumnMappingStep({
  parsedData,
  suggestions,
  kpiDefinitions,
  onMappingsChange,
  onContinue,
  onBack,
  isLoading = false,
  error = null,
}: ColumnMappingStepProps): JSX.Element {
  // Initialize mappings from suggestions
  const [mappings, setMappings] = useState<MappingState[]>(() => 
    suggestions.map(s => ({
      columnName: s.columnName,
      kpiCode: s.suggestedKpiCode,
      kpiId: s.suggestedKpiCode 
        ? kpiDefinitions.find(d => d.code === s.suggestedKpiCode)?.id ?? null
        : null,
      dataType: s.dataType,
      include: s.include,
      confidence: s.confidence,
    }))
  );

  // Bulk data type selection
  const [bulkDataType, setBulkDataType] = useState<BulkDataTypeOption>('mixed');

  // Apply bulk data type to all mapped columns
  const applyBulkDataType = (dataType: BulkDataTypeOption): void => {
    setBulkDataType(dataType);
    if (dataType === 'mixed') return;

    const newMappings = mappings.map(m => {
      // Skip date columns
      if (['date', 'period', 'month', 'year'].includes(m.columnName.toLowerCase())) {
        return m;
      }
      // Only update mapped columns
      if (m.kpiCode) {
        return { ...m, dataType: dataType as KpiDataType };
      }
      return m;
    });
    setMappings(newMappings);
    onMappingsChange(newMappings);
  };

  const updateMapping = (columnName: string, updates: Partial<MappingState>): void => {
    const newMappings = mappings.map(m => {
      if (m.columnName !== columnName) return m;
      return { ...m, ...updates };
    });
    setMappings(newMappings);
    onMappingsChange(newMappings);
  };

  const toggleInclude = (columnName: string): void => {
    const mapping = mappings.find(m => m.columnName === columnName);
    if (mapping) {
      updateMapping(columnName, { include: !mapping.include });
    }
  };

  const setKpiMapping = (columnName: string, kpiCode: string | null): void => {
    const kpiDef = kpiCode ? kpiDefinitions.find(d => d.code === kpiCode) : null;
    updateMapping(columnName, { 
      kpiCode, 
      kpiId: kpiDef?.id ?? null,
      include: kpiCode !== null,
    });
  };

  const setDataType = (columnName: string, dataType: KpiDataType): void => {
    updateMapping(columnName, { dataType });
  };

  // Group definitions by category
  const groupedDefinitions = kpiDefinitions.reduce((acc, def) => {
    if (!acc[def.category]) {
      acc[def.category] = [];
    }
    acc[def.category].push(def);
    return acc;
  }, {} as Record<string, KpiDefinition[]>);

  const includedMappings = mappings.filter(m => m.include && m.kpiCode);
  const hasDateColumn = parsedData.columns.some(c => 
    ['date', 'period', 'month', 'year'].includes(c.toLowerCase())
  );

  const canContinue = includedMappings.length > 0 && hasDateColumn;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-sm text-slate-600 mb-3">
          Step 2 of 2
        </div>
        <h2 className="text-2xl font-bold text-slate-900">Map Your Columns</h2>
        <p className="mt-2 text-slate-600">
          Match your spreadsheet columns to our KPI metrics
        </p>
      </div>

      {/* Date Column Warning */}
      {!hasDateColumn && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-50 text-amber-700 text-sm border border-amber-200">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium">Date column required</p>
            <p>Your data must include a Date or Period column for time-series tracking.</p>
          </div>
        </div>
      )}

      {/* Data Preview */}
      <div className="border rounded-xl overflow-hidden">
        <div className="bg-slate-50 px-4 py-3 border-b">
          <div className="flex items-center justify-between">
            <h3 className="font-medium text-slate-900">Data Preview</h3>
            <span className="text-sm text-slate-500">
              {parsedData.rowCount} rows • {parsedData.columns.length} columns
            </span>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                {parsedData.columns.slice(0, 6).map(col => (
                  <th key={col} className="px-4 py-2 text-left font-medium text-slate-600">
                    {col}
                  </th>
                ))}
                {parsedData.columns.length > 6 && (
                  <th className="px-4 py-2 text-left font-medium text-slate-400">
                    +{parsedData.columns.length - 6} more
                  </th>
                )}
              </tr>
            </thead>
            <tbody>
              {parsedData.previewRows.slice(0, 3).map((row, idx) => (
                <tr key={idx} className="border-b last:border-0">
                  {parsedData.columns.slice(0, 6).map(col => (
                    <td key={col} className="px-4 py-2 text-slate-600">
                      {String(row[col] ?? '-')}
                    </td>
                  ))}
                  {parsedData.columns.length > 6 && (
                    <td className="px-4 py-2 text-slate-400">...</td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bulk Data Type Selector */}
      <div className="border rounded-xl p-4 bg-slate-50">
        <h3 className="font-medium text-slate-900 mb-2">What type of data is this file?</h3>
        <p className="text-sm text-slate-500 mb-3">
          Select a data type to apply to all columns, or choose "Mixed" to set each column individually.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => applyBulkDataType('mixed')}
            className={cn(
              'px-3 py-2 text-sm rounded-lg border transition-colors',
              bulkDataType === 'mixed'
                ? 'bg-primary text-white border-primary'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
            )}
          >
            Mixed (set per column)
          </button>
          {DATA_TYPES.map(dt => (
            <button
              key={dt.value}
              onClick={() => applyBulkDataType(dt.value)}
              className={cn(
                'px-3 py-2 text-sm rounded-lg border transition-colors',
                bulkDataType === dt.value
                  ? 'bg-primary text-white border-primary'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300'
              )}
            >
              <span className="font-medium">{dt.label}</span>
              <span className="text-xs opacity-75 ml-1">({dt.description})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Column Mappings */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-medium text-slate-900">Column Mappings</h3>
          <div className="flex items-center gap-1 text-sm text-slate-500">
            <Info className="h-4 w-4" />
            <span>{includedMappings.length} columns mapped</span>
          </div>
        </div>

        <div className="border rounded-xl divide-y">
          {mappings.map(mapping => {
            const isDateColumn = ['date', 'period', 'month', 'year'].includes(
              mapping.columnName.toLowerCase()
            );

            return (
              <div key={mapping.columnName} className={cn(
                'p-4 transition-colors',
                !mapping.include && 'bg-slate-50 opacity-60'
              )}>
                <div className="flex items-center gap-4">
                  {/* Include Checkbox */}
                  <button
                    onClick={() => !isDateColumn && toggleInclude(mapping.columnName)}
                    disabled={isDateColumn}
                    className={cn(
                      'w-6 h-6 rounded border-2 flex items-center justify-center transition-colors flex-shrink-0',
                      mapping.include || isDateColumn
                        ? 'bg-primary border-primary'
                        : 'border-slate-300 hover:border-slate-400',
                      isDateColumn && 'cursor-not-allowed'
                    )}
                  >
                    {(mapping.include || isDateColumn) && (
                      <Check className="h-4 w-4 text-white" />
                    )}
                  </button>

                  {/* Column Name */}
                  <div className="flex-1 min-w-[140px]">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-slate-900">
                        {mapping.columnName}
                      </span>
                      {isDateColumn && (
                        <span className="text-xs px-1.5 py-0.5 rounded bg-blue-100 text-blue-700">
                          Date Column
                        </span>
                      )}
                    </div>
                    {getConfidenceBadge(mapping.confidence)}
                  </div>

                  {/* KPI Dropdown */}
                  {!isDateColumn && (
                    <div className="flex-1 max-w-[240px]">
                      <div className="relative">
                        <select
                          value={mapping.kpiCode ?? ''}
                          onChange={(e) => setKpiMapping(
                            mapping.columnName, 
                            e.target.value || null
                          )}
                          className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 pr-8 text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none"
                        >
                          <option value="">Skip this column</option>
                          {Object.entries(groupedDefinitions).map(([category, defs]) => (
                            <optgroup key={category} label={category.replace('_', ' ').toUpperCase()}>
                              {defs.map(def => (
                                <option key={def.code} value={def.code}>
                                  {def.name}
                                </option>
                              ))}
                            </optgroup>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none" />
                      </div>
                    </div>
                  )}

                  {/* Data Type */}
                  {!isDateColumn && mapping.include && mapping.kpiCode && (
                    <div className="flex gap-1">
                      {DATA_TYPES.map(dt => (
                        <button
                          key={dt.value}
                          onClick={() => setDataType(mapping.columnName, dt.value)}
                          className={cn(
                            'px-2 py-1 text-xs rounded transition-colors',
                            mapping.dataType === dt.value
                              ? 'bg-primary text-white'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          )}
                        >
                          {dt.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-red-50 text-red-700 text-sm">
          <AlertCircle className="h-5 w-5 flex-shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Mapping Info */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-blue-50 text-blue-700 text-sm">
        <Info className="h-5 w-5 flex-shrink-0" />
        <p>
          We'll save this mapping configuration for future uploads from this source.
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        <button
          onClick={onBack}
          className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
        >
          Back
        </button>
        
        <Button 
          onClick={onContinue}
          disabled={!canContinue || isLoading}
        >
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            'Import Data'
          )}
        </Button>
      </div>
    </div>
  );
}




