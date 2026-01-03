import { Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { TeamMember, TeamRole } from '@altsui/shared';

interface TeamMembersListProps {
  members: TeamMember[];
  onRoleChange: (userId: string, newRole: TeamRole) => void;
  onRemove: (userId: string) => void;
  currentUserId: string;
}

const ROLE_OPTIONS: { value: TeamRole; label: string }[] = [
  { value: 'manager', label: 'Manager' },
  { value: 'accountant', label: 'Accountant' },
  { value: 'attorney', label: 'Attorney' },
  { value: 'investor', label: 'Investor' },
];

function getInitials(firstName: string | null, lastName: string | null, email: string): string {
  if (firstName && lastName) {
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  }
  return email.substring(0, 2).toUpperCase();
}

function getDisplayName(firstName: string | null, lastName: string | null, email: string): string {
  if (firstName && lastName) {
    return `${firstName} ${lastName}`;
  }
  return email;
}

export function TeamMembersList({ 
  members, 
  onRoleChange, 
  onRemove,
  currentUserId,
}: TeamMembersListProps): JSX.Element {
  if (members.length === 0) {
    return (
      <div className="rounded-xl border bg-card p-8 text-center">
        <p className="text-muted-foreground">No team members yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border bg-card divide-y">
      {members.map((member) => {
        const isCurrentUser = member.id === currentUserId;
        
        return (
          <div
            key={member.id}
            className="flex items-center justify-between p-4"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 font-medium text-primary">
                {getInitials(member.firstName, member.lastName, member.email)}
              </div>
              <div>
                <p className="font-medium">
                  {getDisplayName(member.firstName, member.lastName, member.email)}
                  {isCurrentUser && <span className="ml-2 text-xs text-muted-foreground">(You)</span>}
                </p>
                <p className="text-sm text-muted-foreground">{member.email}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <select
                value={member.role}
                onChange={(e) => onRoleChange(member.id, e.target.value as TeamRole)}
                disabled={isCurrentUser}
                className="rounded-md border border-input bg-background px-3 py-1.5 text-sm disabled:opacity-50"
              >
                {ROLE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0 text-red-600"
                onClick={() => onRemove(member.id)}
                disabled={isCurrentUser}
                title={isCurrentUser ? "You cannot remove yourself" : "Remove member"}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

