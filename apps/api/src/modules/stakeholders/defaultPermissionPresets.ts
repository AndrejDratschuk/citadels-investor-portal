/**
 * Default Permission Presets
 * Defines default permissions for each system stakeholder type
 */

import type { PermissionGrant, StakeholderType, PermissionType } from '@altsui/shared';

/** Helper to create permission grants */
function grant(path: string, type: PermissionType = 'view', granted = true): PermissionGrant {
  return { path, type, granted };
}

/** Helper to create multiple view permissions */
function viewGrants(paths: string[], granted = true): PermissionGrant[] {
  return paths.map((path) => grant(path, 'view', granted));
}

/**
 * Get default permissions for a stakeholder type
 */
export function getDefaultPermissionsForType(type: StakeholderType): PermissionGrant[] {
  switch (type) {
    case 'team_member':
      return getTeamMemberDefaults();
    case 'general_partner':
      return getGeneralPartnerDefaults();
    case 'limited_partner':
      return getLimitedPartnerDefaults();
    case 'attorney':
      return getAttorneyDefaults();
    case 'accountant':
      return getAccountantDefaults();
    case 'property_manager':
      return getPropertyManagerDefaults();
    case 'institutional':
    case 'family_office':
      return getInstitutionalDefaults();
    case 'series_a':
    case 'series_b':
    case 'series_c':
    case 'individual_accredited':
    default:
      return getLimitedPartnerDefaults();
  }
}

/**
 * Team Member - Full access to everything
 */
function getTeamMemberDefaults(): PermissionGrant[] {
  return [
    // Dashboard - full
    ...viewGrants([
      'dashboard',
      'dashboard.fund_overview',
      'dashboard.portfolio_summary',
      'dashboard.quick_actions',
    ]),

    // Deals - full CRUD
    grant('deals', 'view'),
    grant('deals', 'create'),
    grant('deals', 'edit'),
    grant('deals', 'delete'),
    ...viewGrants([
      'deals.overview',
      'deals.overview.status',
      'deals.overview.acquisition_price',
      'deals.overview.current_value',
      'deals.overview.internal_notes',
      'deals.financials',
      'deals.financials.rent_revenue',
      'deals.financials.occupancy',
      'deals.financials.debt_service',
      'deals.financials.performance',
      'deals.financials.financial_statements',
      'deals.outliers',
    ]),
    grant('deals.milestones', 'view'),
    grant('deals.milestones', 'create'),
    grant('deals.milestones', 'edit'),
    grant('deals.milestones', 'delete'),
    grant('deals.documents', 'view'),
    grant('deals.documents', 'create'),
    ...viewGrants(['deals.investors', 'deals.investors.view_list', 'deals.investors.view_details']),

    // Investors - full CRUD
    grant('investors', 'view'),
    grant('investors', 'create'),
    grant('investors', 'edit'),
    grant('investors', 'delete'),
    ...viewGrants([
      'investors.view_list',
      'investors.view_details',
    ]),
    grant('investors.add_investor', 'create'),
    grant('investors.edit_investor', 'edit'),
    grant('investors.remove_investor', 'delete'),

    // Pipeline - full
    grant('pipeline', 'view'),
    grant('pipeline', 'create'),
    grant('pipeline', 'edit'),
    ...viewGrants(['pipeline.view']),
    grant('pipeline.send_kyc', 'create'),
    grant('pipeline.approve_reject', 'edit'),
    grant('pipeline.convert_to_investor', 'create'),

    // Capital Calls - full
    grant('capital_calls', 'view'),
    grant('capital_calls', 'create'),
    grant('capital_calls', 'edit'),
    ...viewGrants(['capital_calls.view_own', 'capital_calls.view_all']),
    grant('capital_calls.create', 'create'),
    grant('capital_calls.edit', 'edit'),
    grant('capital_calls.send_reminders', 'create'),

    // Documents - full
    grant('documents', 'view'),
    grant('documents', 'create'),
    ...viewGrants([
      'documents.view_own',
      'documents.fund_documents',
      'documents.deal_documents',
      'documents.investor_documents',
      'documents.investor_documents.view_own',
      'documents.investor_documents.view_all',
      'documents.validation_queue',
      'documents.validation_queue.view',
    ]),
    grant('documents.fund_documents', 'create'),
    grant('documents.deal_documents', 'create'),
    grant('documents.investor_documents.upload', 'create'),
    grant('documents.validation_queue.approve', 'edit'),
    grant('documents.validation_queue.reject', 'edit'),

    // Reports - full
    ...viewGrants([
      'reports',
      'reports.fund_overview',
      'reports.deal_performance',
      'reports.financial_report',
      'reports.export_csv',
      'reports.export_pdf',
    ]),

    // Communications - full
    grant('communications', 'view'),
    grant('communications', 'create'),
    ...viewGrants([
      'communications.view_inbox',
      'communications.view_all',
    ]),
    grant('communications.send_messages', 'create'),
    grant('communications.email_templates', 'view'),
    grant('communications.email_templates', 'edit'),

    // Data - full
    grant('data', 'view'),
    grant('data', 'create'),
    grant('data', 'edit'),
    ...viewGrants(['data.view_connections']),
    grant('data.add_connection', 'create'),
    grant('data.upload_csv', 'create'),
    grant('data.mapping', 'edit'),
  ];
}

/**
 * General Partner - Detailed view, no management
 */
function getGeneralPartnerDefaults(): PermissionGrant[] {
  return [
    // Dashboard - full view
    ...viewGrants([
      'dashboard',
      'dashboard.fund_overview',
      'dashboard.portfolio_summary',
      'dashboard.quick_actions',
    ]),

    // Deals - detailed view
    grant('deals', 'view'),
    ...viewGrants([
      'deals.overview',
      'deals.overview.status',
      'deals.overview.acquisition_price',
      'deals.overview.current_value',
      'deals.overview.internal_notes',
      'deals.financials',
      'deals.financials.rent_revenue',
      'deals.financials.occupancy',
      'deals.financials.debt_service',
      'deals.financials.performance',
      'deals.financials.financial_statements',
      'deals.milestones',
      'deals.documents',
      'deals.investors',
      'deals.investors.view_list',
      'deals.investors.view_details',
      'deals.outliers',
    ]),

    // Capital Calls - view all
    ...viewGrants([
      'capital_calls.view_own',
      'capital_calls.view_all',
    ]),

    // Documents - full view
    ...viewGrants([
      'documents',
      'documents.view_own',
      'documents.fund_documents',
      'documents.deal_documents',
      'documents.investor_documents.view_all',
    ]),

    // Reports - full view
    ...viewGrants([
      'reports',
      'reports.fund_overview',
      'reports.deal_performance',
      'reports.financial_report',
      'reports.export_csv',
      'reports.export_pdf',
    ]),

    // No investors, pipeline, communications, settings, data access
    ...viewGrants(['investors', 'pipeline', 'communications', 'settings', 'data'], false),
  ];
}

/**
 * Limited Partner - Restricted view
 */
function getLimitedPartnerDefaults(): PermissionGrant[] {
  return [
    // Dashboard - partial
    grant('dashboard', 'view'),
    grant('dashboard.fund_overview', 'view'),
    grant('dashboard.portfolio_summary', 'view'),
    grant('dashboard.quick_actions', 'view', false),

    // Deals - limited financials
    grant('deals', 'view'),
    grant('deals.overview', 'view'),
    grant('deals.overview.status', 'view'),
    grant('deals.overview.acquisition_price', 'view'),
    grant('deals.overview.current_value', 'view'),
    grant('deals.overview.internal_notes', 'view', false),
    grant('deals.financials', 'view'),
    grant('deals.financials.rent_revenue', 'view'),
    grant('deals.financials.occupancy', 'view'),
    grant('deals.financials.debt_service', 'view', false), // Hidden
    grant('deals.financials.performance', 'view'),
    grant('deals.financials.performance.irr', 'view', false), // Hidden
    grant('deals.milestones', 'view'),
    grant('deals.documents', 'view'),
    grant('deals.investors', 'view', false),
    grant('deals.outliers', 'view', false),

    // Capital Calls - own only
    grant('capital_calls.view_own', 'view'),
    grant('capital_calls.view_all', 'view', false),

    // Documents - own + fund
    grant('documents.view_own', 'view'),
    grant('documents.fund_documents', 'view'),
    grant('documents.investor_documents.view_all', 'view', false),

    // Reports - limited
    grant('reports.fund_overview', 'view'),
    grant('reports.deal_performance', 'view'),
    grant('reports.financial_report', 'view', false),

    // No access to these sections
    grant('investors', 'view', false),
    grant('pipeline', 'view', false),
    grant('communications', 'view', false),
    grant('settings', 'view', false),
    grant('data', 'view', false),
  ];
}

/**
 * Attorney - Documents only
 */
function getAttorneyDefaults(): PermissionGrant[] {
  return [
    // No dashboard
    grant('dashboard', 'view', false),
    grant('deals', 'view', false),
    grant('investors', 'view', false),
    grant('pipeline', 'view', false),
    grant('capital_calls', 'view', false),

    // Documents - full view
    grant('documents', 'view'),
    grant('documents.fund_documents', 'view'),
    grant('documents.deal_documents', 'view'),
    grant('documents.investor_documents', 'view'),
    grant('documents.investor_documents.view_all', 'view'),

    // Reports - view only
    grant('reports', 'view'),
    grant('reports.fund_overview', 'view'),

    // No communications, settings, data
    grant('communications', 'view', false),
    grant('settings', 'view', false),
    grant('data', 'view', false),
  ];
}

/**
 * Accountant - Financials, documents, reports
 */
function getAccountantDefaults(): PermissionGrant[] {
  return [
    // Dashboard - basic view
    grant('dashboard', 'view'),

    // Deals - financials only
    grant('deals', 'view'),
    grant('deals.financials', 'view'),
    grant('deals.financials.rent_revenue', 'view'),
    grant('deals.financials.occupancy', 'view'),
    grant('deals.financials.debt_service', 'view'),
    grant('deals.financials.performance', 'view'),
    grant('deals.financials.financial_statements', 'view'),
    grant('deals.milestones', 'view', false),
    grant('deals.documents', 'view'),
    grant('deals.investors', 'view', false),

    // No investors/pipeline
    grant('investors', 'view', false),
    grant('pipeline', 'view', false),

    // Capital Calls - view
    grant('capital_calls', 'view'),

    // Documents - full view
    grant('documents', 'view'),

    // Reports - full
    grant('reports', 'view'),
    grant('reports.fund_overview', 'view'),
    grant('reports.deal_performance', 'view'),
    grant('reports.financial_report', 'view'),
    grant('reports.export_csv', 'view'),
    grant('reports.export_pdf', 'view'),

    // No communications, settings, data
    grant('communications', 'view', false),
    grant('settings', 'view', false),
    grant('data', 'view', false),
  ];
}

/**
 * Property Manager - Deals only (milestones, notes, documents)
 */
function getPropertyManagerDefaults(): PermissionGrant[] {
  return [
    // No dashboard
    grant('dashboard', 'view', false),

    // Deals - limited to milestones and documents
    grant('deals', 'view'),
    grant('deals.overview', 'view'),
    grant('deals.financials', 'view', false),
    grant('deals.milestones', 'view'),
    grant('deals.milestones', 'create'),
    grant('deals.milestones', 'edit'),
    grant('deals.documents', 'view'),
    grant('deals.documents', 'create'),
    grant('deals.investors', 'view', false),
    grant('deals.outliers', 'view', false),

    // No investors/pipeline
    grant('investors', 'view', false),
    grant('pipeline', 'view', false),
    grant('capital_calls', 'view', false),

    // Documents - deal docs only
    grant('documents.deal_documents', 'view'),
    grant('documents.deal_documents', 'create'),
    grant('documents.fund_documents', 'view', false),
    grant('documents.investor_documents', 'view', false),

    // No reports, communications, settings, data
    grant('reports', 'view', false),
    grant('communications', 'view', false),
    grant('settings', 'view', false),
    grant('data', 'view', false),
  ];
}

/**
 * Institutional / Family Office - Enhanced view like GP
 */
function getInstitutionalDefaults(): PermissionGrant[] {
  return [
    // Dashboard - full view
    ...viewGrants([
      'dashboard',
      'dashboard.fund_overview',
      'dashboard.portfolio_summary',
    ]),
    grant('dashboard.quick_actions', 'view', false),

    // Deals - detailed view (same as GP but no internal notes)
    grant('deals', 'view'),
    grant('deals.overview', 'view'),
    grant('deals.overview.internal_notes', 'view', false),
    ...viewGrants([
      'deals.financials',
      'deals.financials.rent_revenue',
      'deals.financials.occupancy',
      'deals.financials.debt_service',
      'deals.financials.performance',
      'deals.milestones',
      'deals.documents',
      'deals.outliers',
    ]),
    grant('deals.investors', 'view', false),

    // Capital Calls - own + all
    grant('capital_calls.view_own', 'view'),
    grant('capital_calls.view_all', 'view'),

    // Documents - full view
    ...viewGrants([
      'documents',
      'documents.view_own',
      'documents.fund_documents',
      'documents.deal_documents',
    ]),
    grant('documents.investor_documents.view_all', 'view', false),

    // Reports - full view
    ...viewGrants([
      'reports',
      'reports.fund_overview',
      'reports.deal_performance',
      'reports.financial_report',
      'reports.export_csv',
      'reports.export_pdf',
    ]),

    // No investors, pipeline, communications, settings, data
    grant('investors', 'view', false),
    grant('pipeline', 'view', false),
    grant('communications', 'view', false),
    grant('settings', 'view', false),
    grant('data', 'view', false),
  ];
}

