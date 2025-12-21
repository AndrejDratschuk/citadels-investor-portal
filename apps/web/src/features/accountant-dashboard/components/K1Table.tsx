import { useState } from 'react';
import { cn } from '@/lib/utils';
import { K1StatusBadge, K1Status } from './K1StatusBadge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Download, Eye, Send, Search, CheckSquare, Square } from 'lucide-react';
import { formatCurrency } from '@flowveda/shared';

export interface K1Record {
  id: string;
  investorId: string;
  investorName: string;
  entityType: string;
  taxIdType: string;
  totalInvested: number;
  ownershipPercentage: number;
  k1Status: K1Status;
  generatedAt?: string;
  sentAt?: string;
}

interface K1TableProps {
  records: K1Record[];
  onGenerate?: (ids: string[]) => void;
  onSend?: (ids: string[]) => void;
  onPreview?: (id: string) => void;
  onDownload?: (id: string) => void;
  className?: string;
}

export function K1Table({
  records,
  onGenerate,
  onSend,
  onPreview,
  onDownload,
  className,
}: K1TableProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredRecords = records.filter((record) =>
    record.investorName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelect = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedIds(newSelected);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredRecords.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredRecords.map((r) => r.id)));
    }
  };

  const selectedRecords = filteredRecords.filter((r) => selectedIds.has(r.id));
  const canGenerate = selectedRecords.some((r) => r.k1Status === 'pending');
  const canSend = selectedRecords.some((r) => r.k1Status === 'generated');

  return (
    <div className={cn('rounded-xl border bg-card', className)}>
      {/* Header */}
      <div className="flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search investors..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 w-64"
          />
        </div>
        <div className="flex items-center gap-2">
          {selectedIds.size > 0 && (
            <span className="text-sm text-muted-foreground">
              {selectedIds.size} selected
            </span>
          )}
          <Button
            variant="outline"
            size="sm"
            disabled={!canGenerate}
            onClick={() => onGenerate?.(Array.from(selectedIds))}
          >
            Generate Selected
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!canSend}
            onClick={() => onSend?.(Array.from(selectedIds))}
          >
            <Send className="mr-2 h-4 w-4" />
            Send Selected
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left">
                <button
                  onClick={toggleSelectAll}
                  className="flex items-center text-muted-foreground hover:text-foreground"
                >
                  {selectedIds.size === filteredRecords.length && filteredRecords.length > 0 ? (
                    <CheckSquare className="h-4 w-4" />
                  ) : (
                    <Square className="h-4 w-4" />
                  )}
                </button>
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Investor
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Entity Type
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                Tax ID
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                Total Invested
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                Ownership %
              </th>
              <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">
                K-1 Status
              </th>
              <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {filteredRecords.map((record) => (
              <tr
                key={record.id}
                className={cn(
                  'border-b transition-colors hover:bg-muted/50',
                  selectedIds.has(record.id) && 'bg-muted/30'
                )}
              >
                <td className="px-4 py-3">
                  <button
                    onClick={() => toggleSelect(record.id)}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    {selectedIds.has(record.id) ? (
                      <CheckSquare className="h-4 w-4 text-primary" />
                    ) : (
                      <Square className="h-4 w-4" />
                    )}
                  </button>
                </td>
                <td className="px-4 py-3">
                  <p className="font-medium">{record.investorName}</p>
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground capitalize">
                  {record.entityType.replace('_', ' ')}
                </td>
                <td className="px-4 py-3 text-sm text-muted-foreground uppercase">
                  {record.taxIdType}
                </td>
                <td className="px-4 py-3 text-right text-sm">
                  {formatCurrency(record.totalInvested)}
                </td>
                <td className="px-4 py-3 text-right text-sm">
                  {record.ownershipPercentage.toFixed(2)}%
                </td>
                <td className="px-4 py-3">
                  <K1StatusBadge status={record.k1Status} />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    {(record.k1Status === 'generated' || record.k1Status === 'sent') && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onPreview?.(record.id)}
                          title="Preview"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onDownload?.(record.id)}
                          title="Download"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      </>
                    )}
                    {record.k1Status === 'generated' && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onSend?.([record.id])}
                        title="Send"
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredRecords.length === 0 && (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <p className="text-muted-foreground">No K-1 records found</p>
        </div>
      )}
    </div>
  );
}























