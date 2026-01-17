import { useState, useCallback, useMemo } from 'react';
import { ChevronDown, ChevronUp, CheckSquare, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PermissionTreeNode } from './PermissionTreeNode';
import {
  PERMISSION_TREE,
  getAllPermissionPaths,
  type PermissionNode,
  type PermissionType,
  type PermissionTreeState,
  type PermissionGrant,
} from '@altsui/shared';

interface PermissionTreeAccordionProps {
  permissions: PermissionGrant[];
  onChange: (permissions: PermissionGrant[]) => void;
  disabled?: boolean;
}

/**
 * Convert permission grants array to tree state map
 */
function grantsToState(grants: PermissionGrant[]): PermissionTreeState {
  const state: PermissionTreeState = {};
  for (const grant of grants) {
    if (!state[grant.path]) {
      state[grant.path] = {};
    }
    state[grant.path][grant.type] = grant.granted;
  }
  return state;
}

/**
 * Convert tree state map back to permission grants array
 */
function stateToGrants(state: PermissionTreeState): PermissionGrant[] {
  const grants: PermissionGrant[] = [];
  for (const [path, types] of Object.entries(state)) {
    for (const [type, granted] of Object.entries(types)) {
      if (granted !== undefined) {
        grants.push({
          path,
          type: type as PermissionType,
          granted,
        });
      }
    }
  }
  return grants;
}

/**
 * Get all paths from the permission tree
 */
function getAllTreePaths(): string[] {
  return getAllPermissionPaths(PERMISSION_TREE);
}

export function PermissionTreeAccordion({
  permissions,
  onChange,
  disabled = false,
}: PermissionTreeAccordionProps): JSX.Element {
  // Convert permissions to internal state
  const [state, setState] = useState<PermissionTreeState>(() => grantsToState(permissions));
  
  // Track expanded paths
  const [expandedPaths, setExpandedPaths] = useState<Set<string>>(() => {
    // Start with top-level nodes expanded
    return new Set(PERMISSION_TREE.map((n) => n.path));
  });

  // Handle single permission change
  const handleChange = useCallback(
    (path: string, type: PermissionType, granted: boolean) => {
      setState((prev) => {
        const newState = { ...prev };
        if (!newState[path]) {
          newState[path] = {};
        }
        newState[path] = { ...newState[path], [type]: granted };
        
        // Notify parent
        onChange(stateToGrants(newState));
        
        return newState;
      });
    },
    [onChange]
  );

  // Handle bulk permission change (for parent checkbox toggling children)
  const handleBulkChange = useCallback(
    (paths: string[], type: PermissionType, granted: boolean) => {
      setState((prev) => {
        const newState = { ...prev };
        for (const path of paths) {
          if (!newState[path]) {
            newState[path] = {};
          }
          newState[path] = { ...newState[path], [type]: granted };
        }
        
        // Notify parent
        onChange(stateToGrants(newState));
        
        return newState;
      });
    },
    [onChange]
  );

  // Toggle expand/collapse for a path
  const handleToggleExpand = useCallback((path: string) => {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) {
        next.delete(path);
      } else {
        next.add(path);
      }
      return next;
    });
  }, []);

  // Expand all nodes
  const handleExpandAll = useCallback(() => {
    const allPaths = getAllTreePaths();
    setExpandedPaths(new Set(allPaths));
  }, []);

  // Collapse all nodes
  const handleCollapseAll = useCallback(() => {
    setExpandedPaths(new Set());
  }, []);

  // Select all permissions
  const handleSelectAll = useCallback(() => {
    const allPaths = getAllTreePaths();
    const newState: PermissionTreeState = {};
    
    for (const path of allPaths) {
      const node = findNode(path, PERMISSION_TREE);
      if (node) {
        newState[path] = {};
        for (const type of node.permissionTypes) {
          newState[path][type] = true;
        }
      }
    }
    
    setState(newState);
    onChange(stateToGrants(newState));
  }, [onChange]);

  // Deselect all permissions
  const handleDeselectAll = useCallback(() => {
    const allPaths = getAllTreePaths();
    const newState: PermissionTreeState = {};
    
    for (const path of allPaths) {
      const node = findNode(path, PERMISSION_TREE);
      if (node) {
        newState[path] = {};
        for (const type of node.permissionTypes) {
          newState[path][type] = false;
        }
      }
    }
    
    setState(newState);
    onChange(stateToGrants(newState));
  }, [onChange]);

  // Sync state when permissions prop changes
  useMemo(() => {
    setState(grantsToState(permissions));
  }, [permissions]);

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2 pb-2 border-b">
        <Button
          variant="outline"
          size="sm"
          onClick={handleExpandAll}
          disabled={disabled}
        >
          <ChevronDown className="mr-1.5 h-3.5 w-3.5" />
          Expand All
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleCollapseAll}
          disabled={disabled}
        >
          <ChevronUp className="mr-1.5 h-3.5 w-3.5" />
          Collapse All
        </Button>
        <div className="w-px h-4 bg-border mx-1" />
        <Button
          variant="outline"
          size="sm"
          onClick={handleSelectAll}
          disabled={disabled}
        >
          <CheckSquare className="mr-1.5 h-3.5 w-3.5" />
          Select All
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={handleDeselectAll}
          disabled={disabled}
        >
          <Square className="mr-1.5 h-3.5 w-3.5" />
          Deselect All
        </Button>
      </div>

      {/* Permission legend */}
      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>Permission types:</span>
        <span className="flex items-center gap-1">
          <span className="font-medium">V</span> = View
        </span>
        <span className="flex items-center gap-1">
          <span className="font-medium">C</span> = Create
        </span>
        <span className="flex items-center gap-1">
          <span className="font-medium">E</span> = Edit
        </span>
        <span className="flex items-center gap-1">
          <span className="font-medium">D</span> = Delete
        </span>
      </div>

      {/* Tree */}
      <div className="border rounded-lg p-2 bg-card max-h-[500px] overflow-y-auto">
        {PERMISSION_TREE.map((node) => (
          <PermissionTreeNode
            key={node.path}
            node={node}
            state={state}
            onChange={handleChange}
            onBulkChange={handleBulkChange}
            disabled={disabled}
            expandedPaths={expandedPaths}
            onToggleExpand={handleToggleExpand}
          />
        ))}
      </div>
    </div>
  );
}

/**
 * Find a node by path in the tree
 */
function findNode(path: string, nodes: PermissionNode[]): PermissionNode | null {
  for (const node of nodes) {
    if (node.path === path) return node;
    if (node.children) {
      const found = findNode(path, node.children);
      if (found) return found;
    }
  }
  return null;
}

