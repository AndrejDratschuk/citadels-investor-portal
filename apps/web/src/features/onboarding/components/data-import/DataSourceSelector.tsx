/**
 * DataSourceSelector Component
 * Grid of data source options for import onboarding
 */

import { FileSpreadsheet, Sheet, Database, Check, Star } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { DataSourceType } from '@altsui/shared';

interface DataSourceOption {
  type: DataSourceType;
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor: string;
  bgColor: string;
  isRecommended: boolean;
  isAvailable: boolean;
}

const DATA_SOURCES: DataSourceOption[] = [
  {
    type: 'csv',
    title: 'CSV / Excel File',
    description: 'Upload a spreadsheet from your computer',
    icon: FileSpreadsheet,
    iconColor: 'text-emerald-600',
    bgColor: 'bg-emerald-50',
    isRecommended: true,
    isAvailable: true,
  },
  {
    type: 'google_sheets',
    title: 'Google Sheets',
    description: 'Connect and sync from Google Sheets',
    icon: Sheet,
    iconColor: 'text-green-600',
    bgColor: 'bg-green-50',
    isRecommended: false,
    isAvailable: true,
  },
  {
    type: 'sample',
    title: 'Sample Data',
    description: 'Explore with demo property data',
    icon: Database,
    iconColor: 'text-blue-600',
    bgColor: 'bg-blue-50',
    isRecommended: false,
    isAvailable: true,
  },
];

interface DataSourceSelectorProps {
  selectedSource: DataSourceType | null;
  onSelectSource: (source: DataSourceType) => void;
  onContinue: () => void;
  onBack?: () => void;
}

export function DataSourceSelector({
  selectedSource,
  onSelectSource,
  onContinue,
  onBack,
}: DataSourceSelectorProps): JSX.Element {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-900">Choose Your Data Source</h2>
        <p className="mt-2 text-slate-600">
          Select how you'd like to import your financial data
        </p>
      </div>

      {/* Data Source Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {DATA_SOURCES.map((source) => {
          const isSelected = selectedSource === source.type;
          const Icon = source.icon;

          return (
            <button
              key={source.type}
              onClick={() => source.isAvailable && onSelectSource(source.type)}
              disabled={!source.isAvailable}
              className={cn(
                'relative flex flex-col items-center p-6 rounded-xl border-2 transition-all text-center',
                isSelected
                  ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
                  : source.isAvailable
                  ? 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                  : 'border-slate-100 bg-slate-50 opacity-50 cursor-not-allowed'
              )}
            >
              {/* Recommended badge */}
              {source.isRecommended && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary text-white text-xs font-medium">
                    <Star className="h-3 w-3 fill-current" />
                    Recommended
                  </span>
                </div>
              )}

              {/* Selected checkmark */}
              {isSelected && (
                <div className="absolute top-3 right-3">
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-4 w-4 text-white" />
                  </div>
                </div>
              )}

              {/* Icon */}
              <div className={cn(
                'w-14 h-14 rounded-xl flex items-center justify-center mb-4',
                source.bgColor
              )}>
                <Icon className={cn('h-7 w-7', source.iconColor)} />
              </div>

              {/* Title */}
              <h3 className="font-semibold text-slate-900 mb-1">
                {source.title}
              </h3>

              {/* Description */}
              <p className="text-sm text-slate-500">
                {source.description}
              </p>

              {/* Availability badge */}
              {!source.isAvailable && (
                <span className="mt-2 text-xs text-slate-400">Coming soon</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Helper text */}
      <div className="text-center">
        <p className="text-sm text-slate-500">
          Don't have your data ready?{' '}
          <button 
            onClick={() => onSelectSource('sample')}
            className="text-primary hover:underline font-medium"
          >
            Try with sample data
          </button>
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-between pt-4 border-t">
        {onBack ? (
          <button
            onClick={onBack}
            className="text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            Back
          </button>
        ) : (
          <div />
        )}
        
        <button
          onClick={onContinue}
          disabled={!selectedSource}
          className={cn(
            'px-6 py-2.5 rounded-lg font-medium transition-colors',
            selectedSource
              ? 'bg-primary text-white hover:bg-primary/90'
              : 'bg-slate-100 text-slate-400 cursor-not-allowed'
          )}
        >
          Continue
        </button>
      </div>
    </div>
  );
}







