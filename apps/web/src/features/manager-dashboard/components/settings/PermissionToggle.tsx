import { cn } from '@/lib/utils';

interface PermissionToggleProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function PermissionToggle({ label, checked, onChange, disabled }: PermissionToggleProps): JSX.Element {
  return (
    <label className="flex items-center gap-2 p-2 rounded border bg-background cursor-pointer text-sm">
      <div className="relative flex h-4 w-8 items-center">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="peer sr-only"
        />
        <div className={cn('h-4 w-8 rounded-full transition-colors', checked ? 'bg-primary' : 'bg-muted-foreground/30')} />
        <div className={cn('absolute left-0.5 h-3 w-3 rounded-full bg-white transition-transform shadow-sm', checked && 'translate-x-4')} />
      </div>
      <span>{label}</span>
    </label>
  );
}

