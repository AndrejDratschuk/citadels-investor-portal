/**
 * Google Sheets Controller
 * HTTP handlers for Google Sheets OAuth and data operations
 */

import type { FastifyRequest, FastifyReply } from 'fastify';
import { googleSheetsService } from './googlesheets.service';
import type { ColumnMapping, SyncFrequency } from '@altsui/shared';

// ============================================
// Types
// ============================================
interface AuthenticatedRequest extends FastifyRequest {
  user: {
    id: string;
    email: string;
    role: string;
    fundId: string | null;
  };
}

interface OAuthCallbackQuery {
  code?: string;
  state?: string;
  error?: string;
}

interface SpreadsheetParams {
  spreadsheetId: string;
}

interface SheetPreviewParams {
  spreadsheetId: string;
  sheetName: string;
}

interface ConnectionParams {
  connectionId: string;
}

interface SaveConnectionBody {
  name: string;
  spreadsheetId: string;
  sheetName: string;
  dealId?: string | null;
  columnMapping: ColumnMapping[];
  syncFrequency: SyncFrequency;
  syncEnabled: boolean;
}

interface UpdateSyncSettingsBody {
  syncFrequency: SyncFrequency;
  syncEnabled: boolean;
}

// ============================================
// Controller Class
// ============================================
export class GoogleSheetsController {
  /**
   * Start OAuth flow - returns auth URL
   */
  async connect(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      // Check if user is authenticated
      if (!request.user) {
        return reply.status(401).send({ success: false, error: 'Not authenticated' });
      }

      const userId = request.user.id;
      const fundId = request.user.fundId;

      if (!fundId) {
        return reply.status(403).send({ success: false, error: 'No fund associated with user' });
      }

      // Check if Google Sheets is configured
      if (!googleSheetsService.isConfigured()) {
        return reply.status(500).send({
          success: false,
          error: 'Google Sheets is not configured on this server',
        });
      }

      // Create state with user and fund info
      const state = Buffer.from(
        JSON.stringify({
          userId,
          fundId,
        })
      ).toString('base64');

      const authUrl = googleSheetsService.getAuthUrl(state);

      return reply.send({ success: true, data: { authUrl } });
    } catch (err) {
      console.error('Google Sheets connect error:', err);
      const message = err instanceof Error ? err.message : 'Failed to start OAuth flow';
      return reply.status(500).send({ success: false, error: message });
    }
  }

  /**
   * OAuth callback - exchange code for tokens
   */
  async callback(
    request: FastifyRequest<{ Querystring: OAuthCallbackQuery }>,
    reply: FastifyReply
  ): Promise<void> {
    const { code, state, error: oauthError } = request.query;
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    // Handle OAuth error
    if (oauthError) {
      return reply.redirect(
        `${frontendUrl}/manager/data?google_sheets_error=${encodeURIComponent(oauthError)}`
      );
    }

    if (!code || !state) {
      return reply.redirect(
        `${frontendUrl}/manager/data?google_sheets_error=${encodeURIComponent('Missing authorization code')}`
      );
    }

    try {
      // Decode state
      const { userId, fundId } = JSON.parse(Buffer.from(state, 'base64').toString());

      // Exchange code for tokens
      const { accessToken, refreshToken, email } =
        await googleSheetsService.exchangeCodeForTokens(code);

      // Store tokens temporarily in session/URL params for the wizard to use
      // We don't create the connection yet - user needs to select sheet and map columns first
      const connectionData = Buffer.from(
        JSON.stringify({
          accessToken,
          refreshToken,
          email,
          fundId,
        })
      ).toString('base64');

      // Redirect to frontend with connection data
      return reply.redirect(
        `${frontendUrl}/manager/data?google_sheets_connected=true&google_email=${encodeURIComponent(email)}&connection_data=${connectionData}`
      );
    } catch (err) {
      console.error('Google Sheets OAuth error:', err);
      const errorMessage = err instanceof Error ? err.message : 'OAuth failed';
      return reply.redirect(
        `${frontendUrl}/manager/data?google_sheets_error=${encodeURIComponent(errorMessage)}`
      );
    }
  }

  /**
   * List user's spreadsheets
   */
  async listSpreadsheets(
    request: FastifyRequest<{ Querystring: { connection_data: string } }>,
    reply: FastifyReply
  ): Promise<void> {
    const { connection_data } = request.query;

    if (!connection_data) {
      return reply.status(400).send({ success: false, error: 'Missing connection data' });
    }

    try {
      const { accessToken, refreshToken } = JSON.parse(
        Buffer.from(connection_data, 'base64').toString()
      );

      const spreadsheets = await googleSheetsService.listSpreadsheets(accessToken, refreshToken);

      return reply.send({ success: true, data: { spreadsheets } });
    } catch (err) {
      console.error('Error listing spreadsheets:', err);
      const message = err instanceof Error ? err.message : 'Failed to list spreadsheets';
      return reply.status(500).send({ success: false, error: message });
    }
  }

  /**
   * Get sheets in a spreadsheet
   */
  async getSheets(
    request: FastifyRequest<{
      Params: SpreadsheetParams;
      Querystring: { connection_data: string };
    }>,
    reply: FastifyReply
  ): Promise<void> {
    const { spreadsheetId } = request.params;
    const { connection_data } = request.query;

    if (!connection_data) {
      return reply.status(400).send({ success: false, error: 'Missing connection data' });
    }

    try {
      const { accessToken, refreshToken } = JSON.parse(
        Buffer.from(connection_data, 'base64').toString()
      );

      const sheets = await googleSheetsService.getSpreadsheetSheets(
        accessToken,
        refreshToken,
        spreadsheetId
      );

      return reply.send({ success: true, data: { sheets } });
    } catch (err) {
      console.error('Error getting sheets:', err);
      const message = err instanceof Error ? err.message : 'Failed to get sheets';
      return reply.status(500).send({ success: false, error: message });
    }
  }

  /**
   * Preview sheet data
   */
  async previewData(
    request: FastifyRequest<{
      Params: SheetPreviewParams;
      Querystring: { connection_data: string };
    }>,
    reply: FastifyReply
  ): Promise<void> {
    const { spreadsheetId, sheetName } = request.params;
    const { connection_data } = request.query;

    if (!connection_data) {
      return reply.status(400).send({ success: false, error: 'Missing connection data' });
    }

    try {
      const { accessToken, refreshToken } = JSON.parse(
        Buffer.from(connection_data, 'base64').toString()
      );

      const preview = await googleSheetsService.previewSheetData(
        accessToken,
        refreshToken,
        spreadsheetId,
        sheetName
      );

      return reply.send({ success: true, data: { preview } });
    } catch (err) {
      console.error('Error previewing data:', err);
      const message = err instanceof Error ? err.message : 'Failed to preview data';
      return reply.status(500).send({ success: false, error: message });
    }
  }

  /**
   * Save connection after wizard completion
   */
  async saveConnection(
    request: FastifyRequest<{
      Body: SaveConnectionBody;
      Querystring: { connection_data: string };
    }>,
    reply: FastifyReply
  ): Promise<void> {
    const { connection_data } = request.query;
    const { name, spreadsheetId, sheetName, dealId, columnMapping, syncFrequency, syncEnabled } =
      request.body;

    if (!connection_data) {
      return reply.status(400).send({ success: false, error: 'Missing connection data' });
    }

    try {
      console.log('Saving connection - parsing connection_data...');
      
      let parsedData;
      try {
        parsedData = JSON.parse(Buffer.from(connection_data, 'base64').toString());
      } catch (parseErr) {
        console.error('Failed to parse connection_data:', parseErr);
        return reply.status(400).send({ success: false, error: 'Invalid connection data format' });
      }
      
      const { accessToken, refreshToken, email, fundId } = parsedData;
      
      console.log('Saving connection - input:', {
        fundId,
        dealId,
        name,
        spreadsheetId,
        sheetName,
        email,
        syncFrequency,
        syncEnabled,
        columnMappingCount: columnMapping?.length,
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
      });

      if (!fundId) {
        return reply.status(400).send({ success: false, error: 'Missing fundId in connection data' });
      }

      if (!accessToken || !refreshToken) {
        return reply.status(400).send({ success: false, error: 'Missing OAuth tokens in connection data' });
      }

      const connection = await googleSheetsService.saveConnection({
        fundId,
        dealId,
        name,
        spreadsheetId,
        sheetName,
        accessToken,
        refreshToken,
        googleEmail: email,
        columnMapping,
        syncFrequency,
        syncEnabled,
        now: new Date(),
      });

      console.log('Connection saved successfully:', connection.id);
      return reply.send({ success: true, data: { connection } });
    } catch (err) {
      console.error('Error saving connection:', err);
      const message = err instanceof Error ? err.message : 'Failed to save connection';
      const stack = err instanceof Error ? err.stack : undefined;
      console.error('Stack trace:', stack);
      return reply.status(500).send({ success: false, error: message });
    }
  }

  /**
   * Update sync settings for a connection
   */
  async updateSyncSettings(
    request: AuthenticatedRequest & { params: ConnectionParams; body: UpdateSyncSettingsBody },
    reply: FastifyReply
  ): Promise<void> {
    const { connectionId } = request.params;
    const { syncFrequency, syncEnabled } = request.body;

    try {
      const connection = await googleSheetsService.updateSyncSettings(
        connectionId,
        syncFrequency,
        syncEnabled,
        new Date()
      );

      return reply.send({ success: true, data: { connection } });
    } catch (err) {
      console.error('Error updating sync settings:', err);
      const message = err instanceof Error ? err.message : 'Failed to update sync settings';
      return reply.status(500).send({ success: false, error: message });
    }
  }

  /**
   * Manually trigger sync for a connection
   */
  async syncNow(
    request: AuthenticatedRequest & { params: ConnectionParams },
    reply: FastifyReply
  ): Promise<void> {
    const { connectionId } = request.params;

    try {
      // Get connection with credentials
      const connection = await googleSheetsService.getConnectionWithCredentials(connectionId);
      if (!connection) {
        return reply.status(404).send({ success: false, error: 'Connection not found' });
      }

      // Update status to syncing
      await googleSheetsService.updateSyncStatus(connectionId, 'syncing', new Date());

      // Fetch and process data (this would be extracted to a sync service)
      const { rows } = await googleSheetsService.fetchSheetData(
        connection.accessToken,
        connection.refreshToken,
        connection.spreadsheetId,
        connection.sheetName
      );

      // TODO: Process rows with column mapping and update KPI data
      // This will be implemented in the sync cron service

      // Update status to success
      await googleSheetsService.updateSyncStatus(connectionId, 'success', new Date(), {
        rowCount: rows.length,
      });

      return reply.send({ success: true, data: { success: true, rowCount: rows.length } });
    } catch (err) {
      console.error('Sync error:', err);
      const message = err instanceof Error ? err.message : 'Sync failed';

      await googleSheetsService.updateSyncStatus(connectionId, 'error', new Date(), {
        syncError: message,
      });

      return reply.status(500).send({ success: false, error: message });
    }
  }

  // ============================================
  // Endpoints using existing credentials (no re-auth needed)
  // ============================================

  /**
   * List spreadsheets using existing credentials
   */
  async listSpreadsheetsWithCredentials(
    request: AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> {
    try {
      if (!request.user?.fundId) {
        return reply.status(401).send({ success: false, error: 'Not authenticated' });
      }

      const spreadsheets = await googleSheetsService.listSpreadsheetsWithExistingCredentials(
        request.user.fundId
      );

      return reply.send({ success: true, data: { spreadsheets } });
    } catch (err) {
      console.error('Error listing spreadsheets with credentials:', err);
      const message = err instanceof Error ? err.message : 'Failed to list spreadsheets';
      return reply.status(500).send({ success: false, error: message });
    }
  }

  /**
   * Get sheets using existing credentials
   */
  async getSheetsWithCredentials(
    request: AuthenticatedRequest & { params: SpreadsheetParams },
    reply: FastifyReply
  ): Promise<void> {
    const { spreadsheetId } = request.params;

    try {
      if (!request.user?.fundId) {
        return reply.status(401).send({ success: false, error: 'Not authenticated' });
      }

      const sheets = await googleSheetsService.getSpreadsheetSheetsWithExistingCredentials(
        request.user.fundId,
        spreadsheetId
      );

      return reply.send({ success: true, data: { sheets } });
    } catch (err) {
      console.error('Error getting sheets with credentials:', err);
      const message = err instanceof Error ? err.message : 'Failed to get sheets';
      return reply.status(500).send({ success: false, error: message });
    }
  }

  /**
   * Preview sheet data using existing credentials
   */
  async previewDataWithCredentials(
    request: AuthenticatedRequest & { params: SheetPreviewParams },
    reply: FastifyReply
  ): Promise<void> {
    const { spreadsheetId, sheetName } = request.params;

    try {
      if (!request.user?.fundId) {
        return reply.status(401).send({ success: false, error: 'Not authenticated' });
      }

      const preview = await googleSheetsService.previewSheetDataWithExistingCredentials(
        request.user.fundId,
        spreadsheetId,
        sheetName
      );

      return reply.send({ success: true, data: { preview } });
    } catch (err) {
      console.error('Error previewing data with credentials:', err);
      const message = err instanceof Error ? err.message : 'Failed to preview data';
      return reply.status(500).send({ success: false, error: message });
    }
  }

  /**
   * Save connection using existing credentials
   */
  async saveConnectionWithCredentials(
    request: AuthenticatedRequest & { body: SaveConnectionBody },
    reply: FastifyReply
  ): Promise<void> {
    const { name, spreadsheetId, sheetName, dealId, columnMapping, syncFrequency, syncEnabled } =
      request.body;

    try {
      if (!request.user?.fundId) {
        return reply.status(401).send({ success: false, error: 'Not authenticated' });
      }

      const connection = await googleSheetsService.saveConnectionWithExistingCredentials(
        request.user.fundId,
        {
          name,
          spreadsheetId,
          sheetName,
          columnMapping,
          syncFrequency,
          syncEnabled,
          dealId: dealId || null,
        }
      );

      return reply.send({ success: true, data: { connection } });
    } catch (err) {
      console.error('Error saving connection with credentials:', err);
      const message = err instanceof Error ? err.message : 'Failed to save connection';
      return reply.status(500).send({ success: false, error: message });
    }
  }

  /**
   * Get Google Sheets status for current fund
   */
  async getStatus(request: AuthenticatedRequest, reply: FastifyReply): Promise<void> {
    try {
      if (!request.user) {
        return reply.status(401).send({ success: false, error: 'Not authenticated' });
      }

      const fundId = request.user.fundId;

      if (!fundId) {
        return reply.status(403).send({ success: false, error: 'No fund associated with user' });
      }

      const status = await googleSheetsService.getStatus(fundId);

      return reply.send({ success: true, data: status });
    } catch (err) {
      console.error('Google Sheets getStatus error:', err);
      const message = err instanceof Error ? err.message : 'Failed to get status';
      return reply.status(500).send({ success: false, error: message });
    }
  }

  /**
   * Disconnect a Google Sheets connection
   */
  async disconnect(
    request: AuthenticatedRequest & { params: ConnectionParams },
    reply: FastifyReply
  ): Promise<void> {
    const { connectionId } = request.params;

    try {
      await googleSheetsService.disconnect(connectionId);
      return reply.send({ success: true, data: { success: true } });
    } catch (err) {
      console.error('Error disconnecting:', err);
      const message = err instanceof Error ? err.message : 'Failed to disconnect';
      return reply.status(500).send({ success: false, error: message });
    }
  }
}

export const googleSheetsController = new GoogleSheetsController();
