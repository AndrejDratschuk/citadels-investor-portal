import { useState, useMemo } from 'react';
import { ChevronRight, ChevronDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PermissionNode, PermissionType, PermissionTreeState, CheckState } from '@altsui/shared';
import { PERMISSION_TYPE_LABELS } from '@altsui/shared';

interface PermissionTreeNodeProps {
  node: PermissionNode;
  state: PermissionTreeState;
  onChange: (path: string, type: PermissionType, granted: boolean) => void;
  onBulkChange: (paths: string[], type: PermissionType, granted: boolean) => void;
  depth?: number;
  disabled?: boolean;
  expandedPaths: Set<string>;
  onToggleExpand: (path: string) => void;
}

/**
 * Compute check state for a node based on its children
 */
function computeNodeCheckState(
  node: PermissionNode,
  state: PermissionTreeState,
  type: PermissionType
): CheckState {
  // If no children, just return the direct state
  if (!node.children || node.children.length === 0) {
    const value = state[node.path]?.[type];
    return value === true ? 'checked' : 'unchecked';
  }

  // Collect all descendant states
  const descendantStates: boolean[] = [];
  
  function collectStates(n: PermissionNode): void {
    const val = state[n.path]?.[type];
    if (val !== undefined) {
      descendantStates.push(val);
    }
    if (n.children) {
      n.children.forEach(collectStates);
    }
  }
  
  node.children.forEach(collectStates);
  
  // Also include self
  const selfVal = state[node.path]?.[type];
  if (selfVal !== undefined) {
    descendantStates.push(selfVal);
  }

  if (descendantStates.length === 0) {
    return 'unchecked';
  }

  const allChecked = descendantStates.every((v) => v === true);
  const allUnchecked = descendantStates.every((v) => v === false);

  if (allChecked) return 'checked';
  if (allUnchecked) return 'unchecked';
  return 'indeterminate';
}

/**
 * Get all paths from a node and its descendants
 */
function getAllPaths(node: PermissionNode): string[] {
  const paths = [node.path];
  if (node.children) {
    node.children.forEach((child) => {
      paths.push(...getAllPaths(child));
    });
  }
  return paths;
}

/**
 * Tri-state checkbox component
 */
function TriStateCheckbox({
  state,
  onChange,
  disabled,
  label,
}: {
  state: CheckState;
  onChange: (newState: boolean) => void;
  disabled?: boolean;
  label?: string;
}): JSX.Element {
  const handleClick = (): void => {
    if (disabled) return;
    // Clicking cycles: unchecked -> checked, checked -> unchecked, indeterminate -> checked
    const newValue = state !== 'checked';
    onChange(newValue);
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled}
      className={cn(
        'flex h-4 w-4 items-center justify-center rounded border transition-colors',
        state === 'checked' && 'bg-primary border-primary text-primary-foreground',
        state === 'unchecked' && 'border-input bg-background hover:bg-muted',
        state === 'indeterminate' && 'bg-primary/50 border-primary text-primary-foreground',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      aria-label={label}
      aria-checked={state === 'checked' ? true : state === 'indeterminate' ? 'mixed' : false}
    >
      {state === 'checked' && (
        <svg className="h-3 w-3" viewBox="0 0 12 12" fill="none">
          <path
            d="M2 6L5 9L10 3"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      )}
      {state === 'indeterminate' && <Minus className="h-3 w-3" />}
    </button>
  );
}

export function PermissionTreeNode({
  node,
  state,
  onChange,
  onBulkChange,
  depth = 0,
  disabled = false,
  expandedPaths,
  onToggleExpand,
}: PermissionTreeNodeProps): JSX.Element {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedPaths.has(node.path);

  // Compute check states for each permission type
  const checkStates = useMemo(() => {
    const states: Partial<Record<PermissionType, CheckState>> = {};
    for (const type of node.permissionTypes) {
      states[type] = computeNodeCheckState(node, state, type);
    }
    return states;
  }, [node, state]);

  // Handle checkbox change - propagate to all descendants
  const handleCheckChange = (type: PermissionType, granted: boolean): void => {
    const allPaths = getAllPaths(node);
    onBulkChange(allPaths, type, granted);
  };

  // Determine if this node shows partial state
  const hasPartial = Object.values(checkStates).some((s) => s === 'indeterminate');

  return (
    <div className="select-none">
      {/* Node row */}
      <div
        className={cn(
          'flex items-center gap-2 py-1.5 px-2 rounded-md hover:bg-muted/50 transition-colors',
          depth > 0 && 'ml-4'
        )}
        style={{ paddingLeft: `${depth * 16 + 8}px` }}
      >
        {/* Expand/collapse button */}
        {hasChildren ? (
          <button
            type="button"
            onClick={() => onToggleExpand(node.path)}
            className="flex h-5 w-5 items-center justify-center rounded hover:bg-muted"
            aria-label={isExpanded ? 'Collapse' : 'Expand'}
          >
            {isExpanded ? (
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            ) : (
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            )}
          </button>
        ) : (
          <div className="w-5" />
        )}

        {/* Permission checkboxes */}
        <div className="flex items-center gap-3">
          {node.permissionTypes.map((type) => (
            <div key={type} className="flex items-center gap-1.5">
              <TriStateCheckbox
                state={checkStates[type] || 'unchecked'}
                onChange={(granted) => handleCheckChange(type, granted)}
                disabled={disabled}
                label={`${node.label} - ${PERMISSION_TYPE_LABELS[type]}`}
              />
              {node.permissionTypes.length > 1 && (
                <span className="text-[10px] text-muted-foreground uppercase">
                  {type.charAt(0)}
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Label */}
        <span className={cn('text-sm flex-1', hasPartial && 'text-amber-600 dark:text-amber-400')}>
          {node.label}
        </span>

        {/* Partial indicator */}
        {hasPartial && (
          <span className="text-[10px] font-medium text-amber-600 dark:text-amber-400 uppercase">
            Partial
          </span>
        )}
      </div>

      {/* Children */}
      {hasChildren && isExpanded && (
        <div className="border-l border-border/50 ml-4">
          {node.children!.map((child) => (
            <PermissionTreeNode
              key={child.path}
              node={child}
              state={state}
              onChange={onChange}
              onBulkChange={onBulkChange}
              depth={depth + 1}
              disabled={disabled}
              expandedPaths={expandedPaths}
              onToggleExpand={onToggleExpand}
            />
          ))}
        </div>
      )}
    </div>
  );
}

