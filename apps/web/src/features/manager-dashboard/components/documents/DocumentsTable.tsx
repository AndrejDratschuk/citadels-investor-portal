import { FileText, Download, MoreHorizontal, CheckCircle2, Clock } from 'lucide-react';
import { formatDate } from '@altsui/shared';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { typeLabels, departmentLabels, documentStatusLabels } from '@/lib/api/documents';
import { Document, signingStatusStyles } from './types';

type ColumnConfig = 'all' | 'fund' | 'deal-detail' | 'investor-detail';

interface DocumentsTableProps {
  documents: Document[];
  isLoading: boolean;
  columnConfig: ColumnConfig;
  emptyMessage?: string;
  emptySubMessage?: string;
}

export function DocumentsTable({
  documents,
  isLoading,
  columnConfig,
  emptyMessage = 'No documents found',
  emptySubMessage,
}: DocumentsTableProps) {
  const showDepartment = columnConfig === 'fund';
  const showStatus = columnConfig === 'fund';
  const showSigningStatus = columnConfig !== 'fund';

  const getRelationColumn = (): string => {
    switch (columnConfig) {
      case 'deal-detail':
        return 'Investor';
      case 'investor-detail':
        return 'Deal';
      case 'all':
        return 'Deal/Investor';
      default:
        return '';
    }
  };

  const getRelationValue = (doc: Document): string => {
    switch (columnConfig) {
      case 'deal-detail':
        return doc.investorName || '—';
      case 'investor-detail':
        return doc.dealName || '—';
      case 'all':
        return doc.dealName || doc.investorName || '—';
      default:
        return '—';
    }
  };

  return (
    <div className="rounded-xl border bg-card">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="p-4 text-left text-sm font-medium">Document</th>
              <th className="p-4 text-left text-sm font-medium">Type</th>
              {showDepartment && (
                <th className="p-4 text-left text-sm font-medium">Department</th>
              )}
              {showStatus && (
                <th className="p-4 text-left text-sm font-medium">Status</th>
              )}
              {columnConfig !== 'fund' && (
                <th className="p-4 text-left text-sm font-medium">{getRelationColumn()}</th>
              )}
              {showSigningStatus && (
                <th className="p-4 text-left text-sm font-medium">Signature Status</th>
              )}
              <th className="p-4 text-left text-sm font-medium">Created</th>
              <th className="w-24 p-4"></th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-muted-foreground">
                  Loading documents...
                </td>
              </tr>
            ) : documents.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-muted-foreground">
                  <FileText className="mx-auto h-12 w-12 text-muted-foreground/30" />
                  <p className="mt-4">{emptyMessage}</p>
                  {emptySubMessage && <p className="text-sm">{emptySubMessage}</p>}
                </td>
              </tr>
            ) : (
              documents.map((doc) => (
                <tr key={doc.id} className="border-b last:border-b-0 hover:bg-muted/30">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <FileText className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <span className="font-medium">{doc.name}</span>
                        {doc.tags && doc.tags.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {doc.tags.slice(0, 3).map((tag) => (
                              <span key={tag} className="text-xs bg-muted px-1.5 py-0.5 rounded">
                                {tag}
                              </span>
                            ))}
                            {doc.tags.length > 3 && (
                              <span className="text-xs text-muted-foreground">
                                +{doc.tags.length - 3}
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-xs font-medium">
                      {typeLabels[doc.type]}
                    </span>
                  </td>
                  {showDepartment && (
                    <td className="p-4 text-muted-foreground text-sm">
                      {doc.department ? departmentLabels[doc.department] : '—'}
                    </td>
                  )}
                  {showStatus && (
                    <td className="p-4">
                      {doc.status && (
                        <span
                          className={cn(
                            'rounded-full px-2.5 py-0.5 text-xs font-medium',
                            doc.status === 'final' && 'bg-green-100 text-green-700',
                            doc.status === 'review' && 'bg-yellow-100 text-yellow-700',
                            doc.status === 'draft' && 'bg-gray-100 text-gray-700'
                          )}
                        >
                          {documentStatusLabels[doc.status]}
                        </span>
                      )}
                    </td>
                  )}
                  {columnConfig !== 'fund' && (
                    <td className="p-4 text-muted-foreground">{getRelationValue(doc)}</td>
                  )}
                  {showSigningStatus && (
                    <td className="p-4">
                      {doc.requiresSignature && doc.signingStatus ? (
                        <span
                          className={cn(
                            'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium capitalize',
                            signingStatusStyles[doc.signingStatus]?.bg,
                            signingStatusStyles[doc.signingStatus]?.text
                          )}
                        >
                          {doc.signingStatus === 'signed' ? (
                            <CheckCircle2 className="h-3 w-3" />
                          ) : (
                            <Clock className="h-3 w-3" />
                          )}
                          {doc.signingStatus.replace('_', ' ')}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                  )}
                  <td className="p-4 text-muted-foreground">{formatDate(doc.createdAt)}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      {doc.filePath && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          onClick={() => window.open(doc.filePath!, '_blank')}
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

