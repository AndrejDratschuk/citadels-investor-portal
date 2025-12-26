/**
 * KPI Settings Page
 * Allows fund managers to customize which KPIs are featured and enabled
 */

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Settings,
  Star,
  StarOff,
  Eye,
  EyeOff,
  GripVertical,
  Search,
  X,
  Save,
  RefreshCw,
  DollarSign,
  Home,
  TrendingUp,
  BarChart3,
  CreditCard,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { kpiDefinitionsApi, kpiPreferencesApi } from '@/lib/api/kpis';
import { cn } from '@/lib/utils';
import type { KpiCategory, KpiDefinition, KpiPreference } from '@flowveda/shared';

// ============================================
// Category Config
// ============================================
const CATEGORY_CONFIG: Record<KpiCategory, { name: string; icon: typeof DollarSign; color: string }> = {
  rent_revenue: { name: 'Rent/Revenue', icon: DollarSign, color: 'text-emerald-600' },
  occupancy: { name: 'Occupancy', icon: Home, color: 'text-blue-600' },
  property_performance: { name: 'Performance', icon: TrendingUp, color: 'text-purple-600' },
  financial: { name: 'Financial', icon: BarChart3, color: 'text-indigo-600' },
  debt_service: { name: 'Debt Service', icon: CreditCard, color: 'text-orange-600' },
};

// ============================================
// Types
// ============================================
interface KpiWithPreference extends KpiDefinition {
  isFeatured: boolean;
  isEnabled: boolean;
}

// ============================================
// Component
// ============================================
export function KPISettings(): JSX.Element {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<KpiCategory | 'all'>('all');
  const [pendingChanges, setPendingChanges] = useState<Map<string, Partial<KpiPreference>>>(new Map());

  // Fetch KPI definitions
  const { data: definitions, isLoading: isDefsLoading } = useQuery({
    queryKey: ['kpi-definitions'],
    queryFn: kpiDefinitionsApi.getAll,
  });

  // Fetch current preferences
  const { data: preferences, isLoading: isPrefsLoading } = useQuery({
    queryKey: ['kpi-preferences'],
    queryFn: kpiPreferencesApi.get,
  });

  // Save preferences mutation
  const saveMutation = useMutation({
    mutationFn: (updates: Array<{ kpiId: string; isFeatured?: boolean; isEnabled?: boolean }>) =>
      kpiPreferencesApi.update(updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kpi-preferences'] });
      setPendingChanges(new Map());
    },
  });

  const isLoading = isDefsLoading || isPrefsLoading;

  // Build combined KPI list with preferences
  const prefsMap = new Map(preferences?.map((p) => [p.kpiId, p]) || []);
  const kpisWithPrefs: KpiWithPreference[] = (definitions || []).map((def) => {
    const pref = prefsMap.get(def.id);
    const pending = pendingChanges.get(def.id);
    return {
      ...def,
      isFeatured: pending?.isFeatured ?? pref?.isFeatured ?? false,
      isEnabled: pending?.isEnabled ?? pref?.isEnabled ?? true,
    };
  });

  // Filter KPIs
  const filteredKpis = kpisWithPrefs.filter((kpi) => {
    const matchesSearch =
      !searchQuery ||
      kpi.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      kpi.code.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || kpi.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group by category
  const groupedKpis = filteredKpis.reduce(
    (acc, kpi) => {
      if (!acc[kpi.category]) {
        acc[kpi.category] = [];
      }
      acc[kpi.category].push(kpi);
      return acc;
    },
    {} as Record<KpiCategory, KpiWithPreference[]>
  );

  // Count featured KPIs
  const featuredCount = kpisWithPrefs.filter((k) => k.isFeatured).length;

  // Handle toggle
  const handleToggle = (kpiId: string, field: 'isFeatured' | 'isEnabled', value: boolean) => {
    setPendingChanges((prev) => {
      const newMap = new Map(prev);
      const existing = newMap.get(kpiId) || {};
      newMap.set(kpiId, { ...existing, [field]: value });
      return newMap;
    });
  };

  // Handle save
  const handleSave = () => {
    const updates = Array.from(pendingChanges.entries()).map(([kpiId, changes]) => ({
      kpiId,
      ...changes,
    }));
    saveMutation.mutate(updates);
  };

  // Handle reset
  const handleReset = () => {
    setPendingChanges(new Map());
  };

  const hasChanges = pendingChanges.size > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100">
            <Settings className="h-5 w-5 text-slate-600" />
          </div>
          <div>
            <h1 className="text-xl font-semibold">KPI Settings</h1>
            <p className="text-sm text-muted-foreground">
              Customize which KPIs appear in your dashboard
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {hasChanges && (
            <>
              <Button variant="outline" size="sm" onClick={handleReset}>
                <X className="h-4 w-4 mr-1" /> Cancel
              </Button>
              <Button size="sm" onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? (
                  <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-1" />
                )}
                Save Changes
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Featured KPIs Summary */}
      <div className="rounded-xl border bg-card p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
            <span className="font-medium">Featured KPIs</span>
          </div>
          <span className="text-sm text-muted-foreground">
            {featuredCount} of {kpisWithPrefs.length} KPIs selected
          </span>
        </div>
        <p className="text-sm text-muted-foreground mt-2">
          Featured KPIs appear on the Financials Landing page. We recommend selecting 4-8 KPIs.
        </p>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search KPIs..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-1">
          <Button
            variant={selectedCategory === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedCategory('all')}
          >
            All
          </Button>
          {Object.entries(CATEGORY_CONFIG).map(([code, config]) => {
            const Icon = config.icon;
            return (
              <Button
                key={code}
                variant={selectedCategory === code ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedCategory(code as KpiCategory)}
                className="gap-1"
              >
                <Icon className={cn('h-3 w-3', selectedCategory !== code && config.color)} />
                <span className="hidden lg:inline">{config.name}</span>
              </Button>
            );
          })}
        </div>
      </div>

      {/* KPI List */}
      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card p-4">
              <Skeleton className="h-5 w-32 mb-3" />
              {Array.from({ length: 3 }).map((_, j) => (
                <div key={j} className="flex items-center justify-between py-2">
                  <Skeleton className="h-4 w-48" />
                  <div className="flex gap-2">
                    <Skeleton className="h-8 w-20" />
                    <Skeleton className="h-8 w-20" />
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(groupedKpis).map(([category, kpis]) => {
            const config = CATEGORY_CONFIG[category as KpiCategory];
            const Icon = config.icon;

            return (
              <div key={category} className="rounded-xl border bg-card shadow-sm overflow-hidden">
                <div className="flex items-center gap-2 px-4 py-3 bg-muted/50 border-b">
                  <Icon className={cn('h-4 w-4', config.color)} />
                  <span className="font-medium">{config.name}</span>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {kpis.length} KPIs
                  </span>
                </div>
                <div className="divide-y">
                  {kpis.map((kpi) => (
                    <div
                      key={kpi.id}
                      className={cn(
                        'flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors',
                        !kpi.isEnabled && 'opacity-50'
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                        <div>
                          <p className="font-medium text-sm">{kpi.name}</p>
                          <p className="text-xs text-muted-foreground">
                            {kpi.description || kpi.code}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Featured Toggle */}
                        <Button
                          variant={kpi.isFeatured ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => handleToggle(kpi.id, 'isFeatured', !kpi.isFeatured)}
                          className={cn(
                            'gap-1',
                            kpi.isFeatured && 'bg-yellow-500 hover:bg-yellow-600'
                          )}
                        >
                          {kpi.isFeatured ? (
                            <Star className="h-3 w-3 fill-current" />
                          ) : (
                            <StarOff className="h-3 w-3" />
                          )}
                          Featured
                        </Button>
                        {/* Enabled Toggle */}
                        <Button
                          variant={kpi.isEnabled ? 'outline' : 'ghost'}
                          size="sm"
                          onClick={() => handleToggle(kpi.id, 'isEnabled', !kpi.isEnabled)}
                          className="gap-1"
                        >
                          {kpi.isEnabled ? (
                            <Eye className="h-3 w-3" />
                          ) : (
                            <EyeOff className="h-3 w-3" />
                          )}
                          {kpi.isEnabled ? 'Visible' : 'Hidden'}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && filteredKpis.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No KPIs found matching your criteria.</p>
        </div>
      )}
    </div>
  );
}

