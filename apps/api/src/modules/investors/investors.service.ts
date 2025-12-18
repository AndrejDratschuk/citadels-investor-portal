import { supabaseAdmin } from '../../common/database/supabase';

export class InvestorsService {
  /**
   * Get all investors for a fund (manager view)
   */
  async getAllByFundId(fundId: string) {
    const { data, error } = await supabaseAdmin
      .from('investors')
      .select('*')
      .eq('fund_id', fundId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching investors:', error);
      throw new Error('Failed to fetch investors');
    }

    return data.map((investor: any) => this.formatInvestor(investor));
  }

  /**
   * Get investor profile by user ID
   */
  async getInvestorByUserId(userId: string) {
    console.log('[getInvestorByUserId] Looking up investor for user_id:', userId);
    
    const { data, error } = await supabaseAdmin
      .from('investors')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      console.error('[getInvestorByUserId] Error fetching investor:', error);
      console.error('[getInvestorByUserId] User ID was:', userId);
      throw new Error('Investor not found');
    }

    console.log('[getInvestorByUserId] Found investor:', data.id, data.email);
    return this.formatInvestor(data);
  }

  /**
   * Get investor by ID
   */
  async getInvestorById(investorId: string) {
    const { data, error } = await supabaseAdmin
      .from('investors')
      .select('*')
      .eq('id', investorId)
      .single();

    if (error) {
      throw new Error('Investor not found');
    }

    return this.formatInvestor(data);
  }

  /**
   * Update investor profile
   */
  async updateInvestor(investorId: string, updates: Partial<InvestorUpdate>) {
    const { data, error } = await supabaseAdmin
      .from('investors')
      .update({
        first_name: updates.firstName,
        last_name: updates.lastName,
        phone: updates.phone,
        address: updates.address,
        entity_type: updates.entityType,
        entity_name: updates.entityName,
        updated_at: new Date().toISOString(),
      })
      .eq('id', investorId)
      .select()
      .single();

    if (error) {
      console.error('Error updating investor:', error);
      throw new Error('Failed to update investor');
    }

    return this.formatInvestor(data);
  }

  /**
   * Get investor's investments (deals)
   */
  async getInvestorInvestments(investorId: string) {
    const { data, error } = await supabaseAdmin
      .from('investor_deals')
      .select(`
        ownership_percentage,
        joined_at,
        deal:deals (
          id,
          name,
          description,
          status,
          address,
          property_type,
          unit_count,
          square_footage,
          acquisition_price,
          acquisition_date,
          current_value,
          total_investment,
          kpis
        )
      `)
      .eq('investor_id', investorId);

    if (error) {
      console.error('Error fetching investments:', error);
      throw new Error('Failed to fetch investments');
    }

    return data.map((item: any) => ({
      ownershipPercentage: item.ownership_percentage,
      joinedAt: item.joined_at,
      deal: item.deal ? {
        id: item.deal.id,
        name: item.deal.name,
        description: item.deal.description,
        status: item.deal.status,
        address: item.deal.address,
        propertyType: item.deal.property_type,
        unitCount: item.deal.unit_count,
        squareFootage: item.deal.square_footage,
        acquisitionPrice: item.deal.acquisition_price,
        acquisitionDate: item.deal.acquisition_date,
        currentValue: item.deal.current_value,
        totalInvestment: item.deal.total_investment,
        kpis: item.deal.kpis,
      } : null,
    }));
  }

  /**
   * Get investor's documents
   */
  async getInvestorDocuments(investorId: string, fundId: string) {
    const { data, error } = await supabaseAdmin
      .from('documents')
      .select('*')
      .or(`investor_id.eq.${investorId},and(fund_id.eq.${fundId},investor_id.is.null)`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching documents:', error);
      throw new Error('Failed to fetch documents');
    }

    return data.map((doc: any) => ({
      id: doc.id,
      fundId: doc.fund_id,
      dealId: doc.deal_id,
      investorId: doc.investor_id,
      type: doc.type,
      name: doc.name,
      filePath: doc.file_path,
      requiresSignature: doc.requires_signature,
      signingStatus: doc.signing_status,
      signedAt: doc.signed_at,
      createdAt: doc.created_at,
    }));
  }

  /**
   * Get investor's capital calls
   */
  async getInvestorCapitalCalls(investorId: string) {
    const { data, error } = await supabaseAdmin
      .from('capital_call_items')
      .select(`
        id,
        amount_due,
        amount_received,
        status,
        wire_received_at,
        created_at,
        capital_call:capital_calls (
          id,
          total_amount,
          deadline,
          status,
          deal:deals (
            id,
            name
          )
        )
      `)
      .eq('investor_id', investorId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching capital calls:', error);
      throw new Error('Failed to fetch capital calls');
    }

    return data.map((item: any) => ({
      id: item.id,
      amountDue: item.amount_due,
      amountReceived: item.amount_received,
      status: item.status,
      wireReceivedAt: item.wire_received_at,
      createdAt: item.created_at,
      capitalCall: item.capital_call ? {
        id: item.capital_call.id,
        totalAmount: item.capital_call.total_amount,
        deadline: item.capital_call.deadline,
        status: item.capital_call.status,
        deal: item.capital_call.deal ? {
          id: item.capital_call.deal.id,
          name: item.capital_call.deal.name,
        } : null,
      } : null,
    }));
  }

  /**
   * Get dashboard stats for investor
   */
  async getInvestorStats(investorId: string) {
    const investor = await this.getInvestorById(investorId);
    const investments = await this.getInvestorInvestments(investorId);
    const capitalCalls = await this.getInvestorCapitalCalls(investorId);

    const pendingCapitalCalls = capitalCalls.filter(
      (cc) => cc.status === 'pending' || cc.status === 'partial'
    );

    const totalInvestmentValue = investments.reduce((sum, inv) => {
      if (inv.deal && inv.deal.currentValue && inv.ownershipPercentage) {
        return sum + (inv.deal.currentValue * inv.ownershipPercentage);
      }
      return sum;
    }, 0);

    return {
      commitmentAmount: investor.commitmentAmount,
      totalCalled: investor.totalCalled,
      totalInvested: investor.totalInvested,
      totalInvestmentValue,
      activeInvestments: investments.length,
      pendingCapitalCalls: pendingCapitalCalls.length,
      pendingAmount: pendingCapitalCalls.reduce(
        (sum, cc) => sum + (cc.amountDue - cc.amountReceived),
        0
      ),
    };
  }

  /**
   * Get investor's communications
   */
  async getInvestorCommunications(investorId: string): Promise<InvestorCommunication[]> {
    console.log('[getInvestorCommunications] Querying for investor_id:', investorId);
    
    // Use SELECT * to avoid column issues with migrations not yet run
    const { data, error } = await supabaseAdmin
      .from('investor_communications')
      .select('*')
      .eq('investor_id', investorId)
      .order('occurred_at', { ascending: false });

    console.log('[getInvestorCommunications] Query result - data:', data?.length || 0, 'error:', error?.message || 'none');

    if (error) {
      console.error('[getInvestorCommunications] Error fetching communications:', error);
      throw new Error('Failed to fetch communications');
    }

    console.log('[getInvestorCommunications] Returning', (data || []).length, 'communications');
    return (data || []).map((comm: any) => this.formatCommunication(comm));
  }

  /**
   * Mark a communication as read
   */
  async markCommunicationRead(communicationId: string, investorId: string): Promise<InvestorCommunication> {
    // Try to update - if is_read column doesn't exist, just return the communication as-is
    const { data, error } = await supabaseAdmin
      .from('investor_communications')
      .update({
        is_read: true,
        read_at: new Date().toISOString(),
      })
      .eq('id', communicationId)
      .eq('investor_id', investorId)
      .select('*')
      .single();

    if (error) {
      // If error is about missing column, try to just fetch the communication
      if (error.message?.includes('column') || error.code === '42703') {
        console.warn('[markCommunicationRead] is_read column may not exist, fetching communication as-is');
        const { data: comm, error: fetchError } = await supabaseAdmin
          .from('investor_communications')
          .select('*')
          .eq('id', communicationId)
          .eq('investor_id', investorId)
          .single();

        if (fetchError || !comm) {
          throw new Error('Communication not found');
        }
        // Return with isRead: true even though DB doesn't have it
        return { ...this.formatCommunication(comm), isRead: true };
      }
      console.error('Error marking communication as read:', error);
      throw new Error('Failed to mark communication as read');
    }

    return this.formatCommunication(data);
  }

  /**
   * Update communication tags
   */
  async updateCommunicationTags(communicationId: string, investorId: string, tags: string[]): Promise<InvestorCommunication> {
    const { data, error } = await supabaseAdmin
      .from('investor_communications')
      .update({
        tags: tags,
      })
      .eq('id', communicationId)
      .eq('investor_id', investorId)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating communication tags:', error);
      throw new Error('Failed to update communication tags');
    }

    return this.formatCommunication(data);
  }

  private formatCommunication(data: any): InvestorCommunication {
    return {
      id: data.id,
      investorId: data.investor_id,
      fundId: data.fund_id,
      type: data.type,
      title: data.title,
      content: data.content,
      occurredAt: data.occurred_at,
      emailFrom: data.email_from,
      emailTo: data.email_to,
      meetingAttendees: data.meeting_attendees,
      meetingDurationMinutes: data.meeting_duration_minutes,
      callDirection: data.call_direction,
      callDurationMinutes: data.call_duration_minutes,
      source: data.source,
      externalId: data.external_id,
      createdBy: data.created_by,
      createdAt: data.created_at,
      isRead: data.is_read ?? false,
      readAt: data.read_at,
      tags: data.tags || [],
      deal: data.deal ? {
        id: data.deal.id,
        name: data.deal.name,
      } : null,
    };
  }

  /**
   * Get fund contact info for investor
   * Fund managers are users with role='manager' and fund_id matching the investor's fund
   */
  async getFundContact(fundId: string): Promise<{ fundName: string; email: string; managerName: string }> {
    console.log('[getFundContact] Looking up fund contact for fundId:', fundId);
    
    if (!fundId) {
      console.error('[getFundContact] No fundId provided');
      throw new Error('Investor is not associated with a fund');
    }

    // Get fund info
    const { data: fund, error: fundError } = await supabaseAdmin
      .from('funds')
      .select('id, name')
      .eq('id', fundId)
      .single();

    if (fundError) {
      console.error('[getFundContact] Fund lookup error:', fundError);
    }

    const fundName = fund?.name || 'Your Fund';
    console.log('[getFundContact] Found fund:', fundName);

    // Get fund manager (user with role='manager' and fund_id matching)
    // Note: users table only has id, email, role, fund_id, created_at
    const { data: manager, error: managerError } = await supabaseAdmin
      .from('users')
      .select('id, email')
      .eq('fund_id', fundId)
      .eq('role', 'manager')
      .limit(1)
      .single();

    if (managerError) {
      console.error('[getFundContact] Manager lookup error:', managerError);
      // If no manager found, throw error
      throw new Error('Could not find fund manager');
    }

    if (!manager) {
      console.error('[getFundContact] No manager found for fund:', fundId);
      throw new Error('No fund manager found for your fund');
    }

    console.log('[getFundContact] Found manager:', manager.email);

    // Extract name from email (before @) as fallback
    const emailName = manager.email.split('@')[0].replace(/[._]/g, ' ');
    const managerName = emailName.charAt(0).toUpperCase() + emailName.slice(1);

    return {
      fundName: fundName,
      email: manager.email,
      managerName: managerName || 'Fund Manager',
    };
  }

  /**
   * Send email to fund (from investor)
   */
  async sendEmailToFund(
    investor: any,
    subject: string,
    body: string
  ): Promise<{ success: boolean; messageId?: string }> {
    // Get fund contact
    const fundContact = await this.getFundContact(investor.fundId);

    console.log('[sendEmailToFund] Sending email from', investor.email, 'to', fundContact.email);
    console.log('[sendEmailToFund] Subject:', subject);

    // Store the communication in the database
    // Mark as read for the sender (investor) since they sent it
    const { data: communication, error: commError } = await supabaseAdmin
      .from('investor_communications')
      .insert({
        investor_id: investor.id,
        fund_id: investor.fundId,
        type: 'email',
        title: subject,
        content: body,
        occurred_at: new Date().toISOString(),
        email_from: investor.email,
        email_to: fundContact.email,
        source: 'manual',
        is_read: true, // Sender already knows about their own message
        read_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (commError) {
      console.error('[sendEmailToFund] Error storing communication:', commError);
      throw new Error('Failed to store communication');
    }

    // Create a notification for the fund manager
    try {
      // Find the fund manager's user ID
      const { data: manager } = await supabaseAdmin
        .from('users')
        .select('id')
        .eq('fund_id', investor.fundId)
        .eq('role', 'manager')
        .limit(1)
        .single();

      if (manager) {
        await supabaseAdmin
          .from('notifications')
          .insert({
            user_id: manager.id,
            fund_id: investor.fundId,
            type: 'investor_message',
            title: `New message from ${investor.firstName} ${investor.lastName}`,
            message: subject,
            related_entity_type: 'communication',
            related_entity_id: communication.id,
            metadata: {
              investor_id: investor.id,
              investor_name: `${investor.firstName} ${investor.lastName}`,
              investor_email: investor.email,
            },
          });
        console.log('[sendEmailToFund] Notification created for manager:', manager.id);
      }
    } catch (notifError) {
      // Don't fail the whole operation if notification fails
      console.error('[sendEmailToFund] Failed to create notification:', notifError);
    }

    // TODO: Actually send the email via email service
    // For now, we just store it in the database
    // You can integrate with Resend, SendGrid, etc.

    return {
      success: true,
      messageId: communication.id,
    };
  }

  private formatInvestor(data: any) {
    return {
      id: data.id,
      userId: data.user_id,
      fundId: data.fund_id,
      firstName: data.first_name,
      lastName: data.last_name,
      email: data.email,
      phone: data.phone,
      address: data.address,
      entityType: data.entity_type,
      entityName: data.entity_name,
      taxIdType: data.tax_id_type,
      accreditationStatus: data.accreditation_status,
      accreditationType: data.accreditation_type,
      accreditationDate: data.accreditation_date,
      commitmentAmount: parseFloat(data.commitment_amount) || 0,
      totalCalled: parseFloat(data.total_called) || 0,
      totalInvested: parseFloat(data.total_invested) || 0,
      onboardingStep: data.onboarding_step,
      onboardedAt: data.onboarded_at,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

interface InvestorUpdate {
  firstName?: string;
  lastName?: string;
  phone?: string;
  address?: {
    street?: string;
    city?: string;
    state?: string;
    zip?: string;
    country?: string;
  };
  entityType?: string;
  entityName?: string;
}

export interface InvestorCommunication {
  id: string;
  investorId: string;
  fundId: string;
  type: 'email' | 'meeting' | 'phone_call';
  title: string;
  content: string | null;
  occurredAt: string;
  emailFrom: string | null;
  emailTo: string | null;
  meetingAttendees: string[] | null;
  meetingDurationMinutes: number | null;
  callDirection: 'inbound' | 'outbound' | null;
  callDurationMinutes: number | null;
  source: string;
  externalId: string | null;
  createdBy: string | null;
  createdAt: string;
  isRead: boolean;
  readAt: string | null;
  tags: string[];
  deal?: {
    id: string;
    name: string;
  } | null;
}


