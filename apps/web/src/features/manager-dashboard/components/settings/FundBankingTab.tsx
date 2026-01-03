import { useState } from 'react';
import { Eye, EyeOff, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface FundBankingTabProps {
  wireInstructions: string;
}

export function FundBankingTab({ wireInstructions }: FundBankingTabProps): JSX.Element {
  const [showWireDetails, setShowWireDetails] = useState(false);
  const [localWireInstructions, setLocalWireInstructions] = useState(wireInstructions);

  const handleSave = (): void => {
    // TODO: Implement wire instructions save
    console.log('Saving wire instructions:', localWireInstructions);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border bg-card p-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Wire Instructions</h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowWireDetails(!showWireDetails)}
          >
            {showWireDetails ? (
              <>
                <EyeOff className="mr-2 h-4 w-4" /> Hide
              </>
            ) : (
              <>
                <Eye className="mr-2 h-4 w-4" /> Show
              </>
            )}
          </Button>
        </div>
        <div className="mt-4">
          {showWireDetails ? (
            <textarea
              className="w-full rounded-lg border bg-background p-4 font-mono text-sm"
              rows={4}
              value={localWireInstructions}
              onChange={(e) => setLocalWireInstructions(e.target.value)}
            />
          ) : (
            <div className="rounded-lg bg-muted p-4 text-center text-muted-foreground">
              Wire details are hidden for security. Click "Show" to view.
            </div>
          )}
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          These instructions will be shown to investors during capital calls.
        </p>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave}>
          <Save className="mr-2 h-4 w-4" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}

