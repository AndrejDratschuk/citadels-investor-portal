import { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import {
  STAKEHOLDER_CATEGORIES,
  STAKEHOLDER_CATEGORY_LABELS,
  type StakeholderType,
  type StakeholderTypePermission,
} from '@altsui/shared';
import { PermissionRow } from './PermissionRow';

type CategoryKey = keyof typeof STAKEHOLDER_CATEGORIES;

interface CategorySectionProps {
  category: CategoryKey;
  permissions: StakeholderTypePermission[];
  onUpdate: (type: StakeholderType, updates: Partial<StakeholderTypePermission>) => void;
  isSaving: boolean;
}

export function CategorySection({ category, permissions, onUpdate, isSaving }: CategorySectionProps): JSX.Element {
  const [expanded, setExpanded] = useState(true);
  const categoryTypes = STAKEHOLDER_CATEGORIES[category] as readonly StakeholderType[];
  const categoryPerms = permissions.filter((p) => categoryTypes.includes(p.stakeholderType));

  if (categoryPerms.length === 0) return <></>;

  return (
    <div className="space-y-2">
      <button onClick={() => setExpanded(!expanded)} className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        {STAKEHOLDER_CATEGORY_LABELS[category]}
      </button>
      {expanded && (
        <div className="space-y-2 pl-2">
          {categoryPerms.map((perm) => (
            <PermissionRow key={perm.id} permission={perm} onUpdate={onUpdate} isSaving={isSaving} />
          ))}
        </div>
      )}
    </div>
  );
}

