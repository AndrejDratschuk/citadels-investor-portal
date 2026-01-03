/**
 * Team Invite Types
 * Types for the multi-tenant team invitation system
 */

export type TeamRole = 'manager' | 'accountant' | 'attorney' | 'investor';

export type InviteStatus = 'pending' | 'accepted' | 'expired' | 'cancelled';

export interface TeamInvite {
  id: string;
  email: string;
  fundId: string;
  role: TeamRole;
  token: string;
  status: InviteStatus;
  invitedByUserId: string;
  expiresAt: string;
  acceptedAt: string | null;
  createdAt: string;
}

export interface TeamMember {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  role: TeamRole;
  fundId: string;
  joinedAt: string;
}

export interface CreateTeamInviteInput {
  email: string;
  role: TeamRole;
}

export interface AcceptTeamInviteInput {
  token: string;
  password?: string;
  firstName?: string;
  lastName?: string;
}

export interface TeamInviteTokenData {
  valid: boolean;
  invite?: {
    id: string;
    email: string;
    fundId: string;
    fundName: string;
    role: TeamRole;
    invitedByName: string;
    expiresAt: string;
  };
  error?: string;
  isExistingUser?: boolean;
}

export interface CreateTeamInviteResponse {
  success: boolean;
  invite: TeamInvite;
}

export interface AcceptTeamInviteResponse {
  success: boolean;
  user: {
    id: string;
    email: string;
    role: TeamRole;
    fundId: string;
  };
  accessToken: string;
  refreshToken: string;
}

export interface ListTeamMembersResponse {
  members: TeamMember[];
  pendingInvites: TeamInvite[];
}

