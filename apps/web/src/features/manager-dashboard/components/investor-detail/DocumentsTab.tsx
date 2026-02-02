import { FileText, CheckCircle2, Clock, MoreHorizontal } from 'lucide-react';
import { formatDate } from '@altsui/shared';
import { Button } from '@/components/ui/button';
import type { MockDocument } from './investorDetailMockData';

interface DocumentsTabProps {
  documents: MockDocument[];
}

export function DocumentsTab({ documents }: DocumentsTabProps): JSX.Element {
  return (
    <div className="rounded-xl border bg-card">
      <div className="divide-y">
        {documents.map((doc) => (
          <div
            key={doc.id}
            className="flex items-center justify-between p-4 hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{doc.name}</p>
                <p className="text-sm text-muted-foreground">
                  {formatDate(doc.createdAt)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {doc.signingStatus === 'signed' ? (
                <span className="flex items-center gap-1 text-sm text-green-600">
                  <CheckCircle2 className="h-4 w-4" />
                  Signed
                </span>
              ) : (
                <span className="flex items-center gap-1 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  Not required
                </span>
              )}
              <Button variant="ghost" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
