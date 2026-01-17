import { useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import type { StakeholderRole, StakeholderType } from '@altsui/shared';
import { STAKEHOLDER_TYPE_LABELS, STAKEHOLDER_TYPE } from '@altsui/shared';

interface CreateRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (roleName: string, copyFromRoleId?: string, baseStakeholderType?: StakeholderType) => Promise<void>;
  existingRoles: StakeholderRole[];
  isLoading?: boolean;
}

type InitMode = 'blank' | 'copy';

export function CreateRoleModal({
  isOpen,
  onClose,
  onSubmit,
  existingRoles,
  isLoading = false,
}: CreateRoleModalProps): JSX.Element | null {
  const [roleName, setRoleName] = useState('');
  const [initMode, setInitMode] = useState<InitMode>('blank');
  const [copyFromRoleId, setCopyFromRoleId] = useState<string>('');
  const [baseType, setBaseType] = useState<StakeholderType | ''>('');
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError(null);

    if (!roleName.trim()) {
      setError('Role name is required');
      return;
    }

    // Check for duplicate name
    if (existingRoles.some((r) => r.roleName.toLowerCase() === roleName.trim().toLowerCase())) {
      setError('A role with this name already exists');
      return;
    }

    try {
      await onSubmit(
        roleName.trim(),
        initMode === 'copy' ? copyFromRoleId || undefined : undefined,
        initMode === 'blank' && baseType ? baseType : undefined
      );
      
      // Reset form
      setRoleName('');
      setInitMode('blank');
      setCopyFromRoleId('');
      setBaseType('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create role');
    }
  };

  const handleClose = (): void => {
    setRoleName('');
    setInitMode('blank');
    setCopyFromRoleId('');
    setBaseType('');
    setError(null);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
        aria-hidden="true"
      />

      {/* Modal */}
      <div className="relative bg-card border rounded-lg shadow-lg w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">Create New Role</h2>
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
          {/* Role name */}
          <div className="space-y-2">
            <label htmlFor="roleName" className="text-sm font-medium">
              Role Name
            </label>
            <input
              id="roleName"
              type="text"
              value={roleName}
              onChange={(e) => setRoleName(e.target.value)}
              placeholder="e.g., Series A Investor"
              className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              disabled={isLoading}
            />
          </div>

          {/* Initialization mode */}
          <div className="space-y-3">
            <label className="text-sm font-medium">Start with permissions from:</label>
            
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="initMode"
                  value="blank"
                  checked={initMode === 'blank'}
                  onChange={() => setInitMode('blank')}
                  disabled={isLoading}
                  className="h-4 w-4 text-primary"
                />
                <span className="text-sm">Blank (all permissions OFF)</span>
              </label>

              {initMode === 'blank' && (
                <div className="ml-6 space-y-2">
                  <label htmlFor="baseType" className="text-xs text-muted-foreground">
                    Or use defaults for a stakeholder type:
                  </label>
                  <select
                    id="baseType"
                    value={baseType}
                    onChange={(e) => setBaseType(e.target.value as StakeholderType | '')}
                    disabled={isLoading}
                    className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">None (blank)</option>
                    {Object.entries(STAKEHOLDER_TYPE).map(([key, value]) => (
                      <option key={value} value={value}>
                        {STAKEHOLDER_TYPE_LABELS[value as StakeholderType]}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="initMode"
                  value="copy"
                  checked={initMode === 'copy'}
                  onChange={() => setInitMode('copy')}
                  disabled={isLoading}
                  className="h-4 w-4 text-primary"
                />
                <span className="text-sm">Copy from existing role</span>
              </label>

              {initMode === 'copy' && (
                <div className="ml-6">
                  <select
                    value={copyFromRoleId}
                    onChange={(e) => setCopyFromRoleId(e.target.value)}
                    disabled={isLoading}
                    className="w-full px-3 py-2 border rounded-md bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                  >
                    <option value="">Select a role...</option>
                    {existingRoles.map((role) => (
                      <option key={role.id} value={role.id}>
                        {role.roleName}
                      </option>
                    ))}
                  </select>
                </div>
              )}
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
            <Button type="submit" disabled={isLoading || !roleName.trim()}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Role'
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

