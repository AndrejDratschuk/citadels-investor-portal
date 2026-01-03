import type { 
  TeamInvite, 
  TeamMember, 
  CreateTeamInviteInput,
  ListTeamMembersResponse,
  CreateTeamInviteResponse,
  TeamRole,
} from '@altsui/shared';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

async function getAuthHeaders(): Promise<HeadersInit> {
  const token = localStorage.getItem('accessToken');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || error.message || 'Request failed');
  }
  return response.json();
}

export const teamInvitesApi = {
  /**
   * List all team members and pending invites for the current fund
   */
  async listTeam(): Promise<ListTeamMembersResponse> {
    const response = await fetch(`${API_URL}/team-invites/team`, {
      headers: await getAuthHeaders(),
    });
    return handleResponse<ListTeamMembersResponse>(response);
  },

  /**
   * Create a new team invite
   */
  async createInvite(input: CreateTeamInviteInput): Promise<CreateTeamInviteResponse> {
    const response = await fetch(`${API_URL}/team-invites`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(input),
    });
    return handleResponse<CreateTeamInviteResponse>(response);
  },

  /**
   * Verify an invite token (public endpoint)
   */
  async verifyToken(token: string): Promise<{
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
    isExistingUser?: boolean;
    error?: string;
  }> {
    const response = await fetch(`${API_URL}/team-invites/verify?token=${encodeURIComponent(token)}`);
    return handleResponse(response);
  },

  /**
   * Accept an invite (creates account if new user, joins fund if existing)
   */
  async acceptInvite(data: {
    token: string;
    password?: string;
    firstName?: string;
    lastName?: string;
  }): Promise<{
    success: boolean;
    user: {
      id: string;
      email: string;
      role: TeamRole;
      fundId: string;
    };
    accessToken: string;
    refreshToken: string;
  }> {
    const response = await fetch(`${API_URL}/team-invites/accept`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    return handleResponse(response);
  },

  /**
   * Resend an invite email
   */
  async resendInvite(inviteId: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_URL}/team-invites/${inviteId}/resend`, {
      method: 'POST',
      headers: await getAuthHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Cancel a pending invite
   */
  async cancelInvite(inviteId: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_URL}/team-invites/${inviteId}/cancel`, {
      method: 'POST',
      headers: await getAuthHeaders(),
    });
    return handleResponse(response);
  },

  /**
   * Update a team member's role
   */
  async updateMemberRole(userId: string, role: TeamRole): Promise<{ success: boolean }> {
    const response = await fetch(`${API_URL}/team-invites/members/${userId}/role`, {
      method: 'PATCH',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ role }),
    });
    return handleResponse(response);
  },

  /**
   * Remove a team member from the fund
   */
  async removeMember(userId: string): Promise<{ success: boolean }> {
    const response = await fetch(`${API_URL}/team-invites/members/${userId}`, {
      method: 'DELETE',
      headers: await getAuthHeaders(),
    });
    return handleResponse(response);
  },
};

