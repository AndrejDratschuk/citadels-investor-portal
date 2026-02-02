import { MessageSquare, Plus } from 'lucide-react';
import type { Communication } from '@altsui/shared';
import { Button } from '@/components/ui/button';
import { CommunicationsList } from '../CommunicationsList';

interface CommunicationsTabProps {
  communications: Communication[];
  isLoading: boolean;
  investorEmail?: string;
  onLogCommunication: () => void;
}

export function CommunicationsTab({
  communications,
  isLoading,
  investorEmail,
  onLogCommunication,
}: CommunicationsTabProps): JSX.Element {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            Track all communications with this investor
          </span>
        </div>
        <Button onClick={onLogCommunication} size="sm">
          <Plus className="mr-2 h-4 w-4" />
          Log Communication
        </Button>
      </div>
      <CommunicationsList
        communications={communications}
        isLoading={isLoading}
        investorEmail={investorEmail}
      />
    </div>
  );
}
