/**
 * Column Mapper Component
 * Maps spreadsheet columns to KPI definitions
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowRight,
  Check,
  ChevronDown,
  X,
  AlertCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { kpiDefinitionsApi } from '@/lib/api/kpis';
import { cn } from '@/lib/utils';
import type { KpiDefinition, ColumnMapping, KpiDataType } from '@flowveda/shared';

// ============================================
// Types
// ============================================
interface ColumnMapperProps {
  columns: string[];
  initialMappings?: ColumnMapping[];
  onMappingsChange: (mappings: ColumnMapping[]) => void;
  className?: string;
}

// ============================================
// Component
// ============================================
export function ColumnMapper({
  columns,
  initialMappings = [],
  onMappingsChange,
  className,
}: ColumnMapperProps): JSX.Element {
  const [mappings, setMappings] = useState<ColumnMapping[]>(initialMappings);
  const [expandedColumn, setExpandedColumn] = useState<string | null>(null);

  // Fetch KPI definitions
  const { data: definitions, isLoading } = useQuery({
    queryKey: ['kpi-definitions'],
    queryFn: kpiDefinitionsApi.getAll,
  });

  // Update parent when mappings change
  useEffect(() => {
    onMappingsChange(mappings);
  }, [mappings, onMappingsChange]);

  // Get mapping for a column
  const getMappingForColumn = (columnName: string): ColumnMapping | undefined => {
    return mappings.find((m) => m.columnName === columnName);
  };

  // Get KPI name for a code
  const getKpiName = (code: string): string => {
    const def = definitions?.find((d) => d.code === code);
    return def?.name || code;
  };

  // Handle mapping selection
  const handleMapColumn = (columnName: string, kpiCode: string, dataType: KpiDataType) => {
    setMappings((prev) => {
      // Remove any existing mapping for this column
      const filtered = prev.filter((m) => m.columnName !== columnName);
      // Add new mapping
      return [...filtered, { columnName, kpiCode, dataType }];
    });
    setExpandedColumn(null);
  };

  // Handle unmapping
  const handleUnmapColumn = (columnName: string) => {
    setMappings((prev) => prev.filter((m) => m.columnName !== columnName));
  };

  // Group KPIs by category
  const groupedKpis = definitions?.reduce(
    (acc, kpi) => {
      if (!acc[kpi.category]) {
        acc[kpi.category] = [];
      }
      acc[kpi.category].push(kpi);
      return acc;
    },
    {} as Record<string, KpiDefinition[]>
  );

  // Filter out date columns
  const dataColumns = columns.filter(
    (col) => !['date', 'Date', 'period', 'Period', 'Month', 'Year'].includes(col)
  );

  if (isLoading) {
    return (
      <div className={cn('p-4 text-center text-muted-foreground', className)}>
        Loading KPI definitions...
      </div>
    );
  }

  return (
    <div className={className}>
      <div className="space-y-3">
        {dataColumns.map((column) => {
          const mapping = getMappingForColumn(column);
          const isExpanded = expandedColumn === column;

          return (
            <div key={column} className="rounded-lg border bg-card">
              {/* Column Header */}
              <div
                className={cn(
                  'flex items-center justify-between px-4 py-3',
                  isExpanded && 'border-b'
                )}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm bg-muted px-2 py-1 rounded">
                    {column}
                  </span>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  {mapping ? (
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-primary">
                        {getKpiName(mapping.kpiCode)}
                      </span>
                      <span className="text-xs bg-muted px-1.5 py-0.5 rounded capitalize">
                        {mapping.dataType}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleUnmapColumn(column)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <span className="text-muted-foreground">Not mapped</span>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setExpandedColumn(isExpanded ? null : column)}
                >
                  <ChevronDown
                    className={cn('h-4 w-4 transition-transform', isExpanded && 'rotate-180')}
                  />
                </Button>
              </div>

              {/* Expanded KPI Selection */}
              {isExpanded && (
                <div className="p-4 max-h-64 overflow-y-auto">
                  {groupedKpis &&
                    Object.entries(groupedKpis).map(([category, kpis]) => (
                      <div key={category} className="mb-4 last:mb-0">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                          {category.replace(/_/g, ' ')}
                        </h4>
                        <div className="space-y-1">
                          {kpis.map((kpi) => (
                            <div key={kpi.id} className="flex items-center gap-2">
                              <button
                                onClick={() => handleMapColumn(column, kpi.code, 'actual')}
                                className="flex-1 flex items-center justify-between px-3 py-2 rounded-md hover:bg-muted text-left text-sm"
                              >
                                <span>{kpi.name}</span>
                                {mapping?.kpiCode === kpi.code && (
                                  <Check className="h-4 w-4 text-primary" />
                                )}
                              </button>
                              {/* Data Type Pills */}
                              <div className="flex gap-1">
                                {(['actual', 'forecast', 'budget'] as const).map((type) => (
                                  <button
                                    key={type}
                                    onClick={() => handleMapColumn(column, kpi.code, type)}
                                    className={cn(
                                      'text-xs px-2 py-1 rounded capitalize transition-colors',
                                      mapping?.kpiCode === kpi.code && mapping?.dataType === type
                                        ? 'bg-primary text-primary-foreground'
                                        : 'bg-muted hover:bg-muted/80'
                                    )}
                                  >
                                    {type[0].toUpperCase()}
                                  </button>
                                ))}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary */}
      <div className="mt-4 flex items-center justify-between text-sm">
        <span className="text-muted-foreground">
          {mappings.length} of {dataColumns.length} columns mapped
        </span>
        {mappings.length < dataColumns.length && (
          <div className="flex items-center gap-1 text-amber-600">
            <AlertCircle className="h-4 w-4" />
            <span>Unmapped columns will be ignored</span>
          </div>
        )}
      </div>
    </div>
  );
}

