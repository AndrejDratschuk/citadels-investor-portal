import { useState } from 'react';
import { X, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { StakeholderRole } from '@altsui/shared';

interface CopyRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (sourceRoleId: string) => Promise<void>;
  targetRole: StakeholderRole | null;
  availableRoles: StakeholderRole[];
  isLoading?: boolean;
}

export function CopyRoleModal({
  isOpen,
  onClose,
  onSubmit,
  targetRole,
  availableRoles,
  isLoading = false,
}: CopyRoleModalProps): JSX.Element | null {
  const [sourceRoleId, setSourceRoleId] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !targetRole) return null;

  // Filter out the target role from available sources
  const sourceRoles = availableRoles.filter((r) => r.id !== targetRole.id);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);

    if (!sourceRoleId) {
      setError('Please select a role to copy from');
      return;
    }

    try {
      await onSubmit(sourceRoleId);
      setSourceRoleId('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to copy permissions');
    }
  };

  const handleClose = (): void => {
    setSourceRoleId('');
    setError(null);
    onClose();
  };

  const selectedSourceRole = sourceRoles.find((r) => r.id === sourceRoleId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative z-10 bg-card border rounded-lg shadow-lg w-full max-w-md">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Copy Permissions</h2>
          <button
            onClick={handleClose}
            className="p-1 rounded hover:bg-muted transition-colors"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          {/* Source role selection */}
          <div className="space-y-2">
            <label htmlFor="sourceRole" className="text-sm font-medium">
              Copy permissions from:
            </label>
            <select
              id="sourceRole"
              value={sourceRoleId}
              onChange={(e) => setSourceRoleId(e.target.value)}
              disabled={isLoading}
              className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="">Select a role...</option>
              {sourceRoles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.roleName}
                  {role.roleType === 'system' ? ' (System)' : ' (Custom)'}
                </option>
              ))}
            </select>
          </div>

          {/* Target info */}
          <div className="space-y-2">
            <label className="text-sm font-medium">To:</label>
            <div className="px-3 py-2 border rounded-md bg-muted/50 text-sm">
              {targetRole.roleName}
            </div>
          </div>

          {/* Warning */}
          <div className="flex items-start gap-2 p-3 rounded-md bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <AlertTriangle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 dark:text-amber-200">
              <p className="font-medium">This will overwrite current permissions</p>
              <p className="text-amber-700 dark:text-amber-300 mt-1">
                All existing permissions for "{targetRole.roleName}" will be replaced with
                permissions from {selectedSourceRole ? `"${selectedSourceRole.roleName}"` : 'the selected role'}.
              </p>
            </div>
          </div>

          {/* Error message */}
          {error && (
            <div className="text-sm text-red-600 dark:text-red-400">{error}</div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading || !sourceRoleId}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Copying...
                </>
              ) : (
                'Copy Permissions'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

