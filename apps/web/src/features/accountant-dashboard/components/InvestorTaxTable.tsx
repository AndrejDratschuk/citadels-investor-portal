import { useState } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Download, ChevronDown, ChevronRight, Building2, User, Mail, MapPin, Calendar } from 'lucide-react';
import { formatCurrency } from '@altsui/shared';

export interface InvestorTaxRecord {
  id: string;
  name: string;
  email: string;
  entityType: 'individual' | 'joint' | 'trust' | 'llc' | 'corporation';
  taxIdType: 'ssn' | 'ein';
  totalInvested: number;
  ownershipPercentage: number;
  status: 'active' | 'inactive';
  // Additional details for expanded view
  phone?: string;
  address?: string;
  dateJoined?: string;
  lastK1Date?: string;
}

interface InvestorTaxTableProps {
  records: InvestorTaxRecord[];
  onExportCSV?: () => void;
  className?: string;
}

const entityTypeLabels: Record<string, string> = {
  individual: 'Individual',
  joint: 'Joint',
  trust: 'Trust',
  llc: 'LLC',
  corporation: 'Corporation',
};

export function InvestorTaxTable({
  records,
  onExportCSV,
  className,
}: InvestorTaxTableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [entityFilter, setEntityFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filteredRecords = records.filter((record) => {
    const matchesSearch = record.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      record.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesEntity = entityFilter === 'all' || record.entityType === entityFilter;
    return matchesSearch && matchesEntity;
  });

  const totalInvested = filteredRecords.reduce((sum, r) => sum + r.totalInvested, 0);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className={cn('rounded-xl border bg-card', className)}>
      {/* Header */}
      <div className="flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search investors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <select
            value={entityFilter}
            onChange={(e) => setEntityFilter(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">All Entity Types</option>
            <option value="individual">Individual</option>
            <option value="joint">Joint</option>
            <option value="trust">Trust</option>
            <option value="llc">LLC</option>
            <option value="corporation">Corporation</option>
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            {filteredRecords.length} investors · {formatCurrency(totalInvested)} total
          </span>
          <Button variant="outline" size="sm" onClick={onExportCSV}>
            <Download className="mr-2 h-4 w-4" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="w-10 px-4 py-3"></th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Investor
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Entity Type
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Tax ID Type
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                Total Invested
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                Ownership %
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((record) => (
              <>
                <tr
                  key={record.id}
                  className={cn(
                    'border-b transition-colors hover:bg-muted/50 cursor-pointer',
                    expandedId === record.id && 'bg-muted/30'
                  )}
                  onClick={() => toggleExpand(record.id)}
                >
                  <td className="px-4 py-3">
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                      {expandedId === record.id ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                    </Button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        'flex h-10 w-10 items-center justify-center rounded-full',
                        record.entityType === 'individual' || record.entityType === 'joint'
                          ? 'bg-blue-100 text-blue-600'
                          : 'bg-purple-100 text-purple-600'
                      )}>
                        {record.entityType === 'individual' || record.entityType === 'joint' ? (
                          <User className="h-5 w-5" />
                        ) : (
                          <Building2 className="h-5 w-5" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium">{record.name}</p>
                        <p className="text-sm text-muted-foreground">{record.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm">
                    {entityTypeLabels[record.entityType]}
                  </td>
                  <td className="px-4 py-3 text-sm uppercase text-muted-foreground">
                    {record.taxIdType}
                  </td>
                  <td className="px-4 py-3 text-right text-sm font-medium">
                    {formatCurrency(record.totalInvested)}
                  </td>
                  <td className="px-4 py-3 text-right text-sm">
                    {record.ownershipPercentage.toFixed(2)}%
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn(
                      'inline-flex rounded-full px-2 py-1 text-xs font-medium',
                      record.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    )}>
                      {record.status === 'active' ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                </tr>
                {/* Expanded Details Row */}
                {expandedId === record.id && (
                  <tr key={`${record.id}-details`} className="bg-muted/20">
                    <td colSpan={7} className="px-4 py-4">
                      <div className="ml-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Contact</p>
                          <div className="mt-2 space-y-2">
                            <div className="flex items-center gap-2 text-sm">
                              <Mail className="h-4 w-4 text-muted-foreground" />
                              {record.email}
                            </div>
                            {record.phone && (
                              <div className="flex items-center gap-2 text-sm">
                                <span className="h-4 w-4 text-muted-foreground">📞</span>
                                {record.phone}
                              </div>
                            )}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Address</p>
                          <div className="mt-2">
                            <div className="flex items-start gap-2 text-sm">
                              <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                              <span>{record.address || 'Not provided'}</span>
                            </div>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Tax Information</p>
                          <div className="mt-2 space-y-1">
                            <p className="text-sm">
                              <span className="text-muted-foreground">Entity:</span>{' '}
                              {entityTypeLabels[record.entityType]}
                            </p>
                            <p className="text-sm">
                              <span className="text-muted-foreground">Tax ID:</span>{' '}
                              {record.taxIdType.toUpperCase()} (••••••{Math.floor(Math.random() * 9000) + 1000})
                            </p>
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Investment Summary</p>
                          <div className="mt-2 space-y-1">
                            <p className="text-sm">
                              <span className="text-muted-foreground">Invested:</span>{' '}
                              <span className="font-medium">{formatCurrency(record.totalInvested)}</span>
                            </p>
                            <p className="text-sm">
                              <span className="text-muted-foreground">Ownership:</span>{' '}
                              <span className="font-medium">{record.ownershipPercentage.toFixed(2)}%</span>
                            </p>
                            <div className="flex items-center gap-2 text-sm">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-muted-foreground">Last K-1:</span>{' '}
                              {record.lastK1Date || 'Not generated'}
                            </div>
                          </div>
                        </div>
                      </div>
                    </td>
                  </tr>
                )}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {filteredRecords.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">No investors found</p>
        </div>
      )}
    </div>
  );
}
