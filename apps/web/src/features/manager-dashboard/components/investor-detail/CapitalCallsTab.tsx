import { Building2, CheckCircle2, AlertCircle } from 'lucide-react';
import { formatCurrency, formatDate } from '@altsui/shared';
import type { MockCapitalCall } from './investorDetailMockData';

interface CapitalCallsTabProps {
  capitalCalls: MockCapitalCall[];
}

function calculateReceivedPercentage(
  amountReceived: number,
  amountDue: number
): string {
  return ((amountReceived / amountDue) * 100).toFixed(0);
}

export function CapitalCallsTab({
  capitalCalls,
}: CapitalCallsTabProps): JSX.Element {
  return (
    <div className="rounded-xl border bg-card">
      <div className="divide-y">
        {capitalCalls.map((call) => (
          <div
            key={call.id}
            className="flex items-center justify-between p-4 hover:bg-muted/50"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-medium">{call.dealName}</p>
                <p className="text-sm text-muted-foreground">
                  Due: {formatDate(call.deadline)}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="font-medium">
                  {formatCurrency(call.amountReceived)} /{' '}
                  {formatCurrency(call.amountDue)}
                </p>
                <p className="text-sm text-muted-foreground">
                  {calculateReceivedPercentage(
                    call.amountReceived,
                    call.amountDue
                  )}
                  % received
                </p>
              </div>
              {call.status === 'complete' ? (
                <CheckCircle2 className="h-5 w-5 text-green-500" />
              ) : (
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
