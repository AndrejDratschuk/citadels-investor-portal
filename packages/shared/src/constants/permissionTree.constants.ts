/**
 * Permission Tree Constants
 * Defines the complete hierarchical permission structure for the dashboard
 */

/** Permission types that can be granted */
export const PERMISSION_TYPES = ['view', 'create', 'edit', 'delete'] as const;
export type PermissionType = typeof PERMISSION_TYPES[number];

/** Role types */
export const ROLE_TYPES = ['system', 'custom'] as const;
export type RoleType = typeof ROLE_TYPES[number];

/** Permission node in the tree structure */
export interface PermissionNode {
  path: string;
  label: string;
  description?: string;
  permissionTypes: PermissionType[];
  children?: PermissionNode[];
}

/** Flat permission entry for API/DB */
export interface PermissionEntry {
  path: string;
  type: PermissionType;
  granted: boolean;
}

/** Permission tree state for UI */
export interface PermissionTreeState {
  [path: string]: {
    [type in PermissionType]?: boolean;
  };
}

/**
 * Complete permission tree structure
 * Mirrors the dashboard navigation hierarchy
 */
export const PERMISSION_TREE: PermissionNode[] = [
  {
    path: 'dashboard',
    label: 'Dashboard',
    description: 'Main dashboard and overview pages',
    permissionTypes: ['view'],
    children: [
      {
        path: 'dashboard.fund_overview',
        label: 'Fund Overview',
        permissionTypes: ['view'],
      },
      {
        path: 'dashboard.portfolio_summary',
        label: 'Portfolio Summary',
        permissionTypes: ['view'],
      },
      {
        path: 'dashboard.quick_actions',
        label: 'Quick Actions',
        permissionTypes: ['view'],
      },
    ],
  },
  {
    path: 'deals',
    label: 'Deals',
    description: 'Deal management and details',
    permissionTypes: ['view', 'create', 'edit', 'delete'],
    children: [
      {
        path: 'deals.overview',
        label: 'Deal Overview',
        permissionTypes: ['view'],
        children: [
          { path: 'deals.overview.status', label: 'Status', permissionTypes: ['view'] },
          { path: 'deals.overview.acquisition_price', label: 'Acquisition Price', permissionTypes: ['view'] },
          { path: 'deals.overview.current_value', label: 'Current Value', permissionTypes: ['view'] },
          { path: 'deals.overview.internal_notes', label: 'Internal Notes', permissionTypes: ['view'] },
        ],
      },
      {
        path: 'deals.financials',
        label: 'Financials',
        description: 'Financial KPIs and statements',
        permissionTypes: ['view'],
        children: [
          {
            path: 'deals.financials.rent_revenue',
            label: 'Rent/Revenue KPIs',
            permissionTypes: ['view'],
            children: [
              { path: 'deals.financials.rent_revenue.noi', label: 'Net Operating Income (NOI)', permissionTypes: ['view'] },
              { path: 'deals.financials.rent_revenue.gross_rental_income', label: 'Gross Rental Income', permissionTypes: ['view'] },
              { path: 'deals.financials.rent_revenue.rental_income_per_unit', label: 'Rental Income Per Unit', permissionTypes: ['view'] },
              { path: 'deals.financials.rent_revenue.collection_rate', label: 'Collection Rate', permissionTypes: ['view'] },
              { path: 'deals.financials.rent_revenue.delinquency_rate', label: 'Delinquency Rate', permissionTypes: ['view'] },
              { path: 'deals.financials.rent_revenue.effective_gross_income', label: 'Effective Gross Income', permissionTypes: ['view'] },
            ],
          },
          {
            path: 'deals.financials.occupancy',
            label: 'Occupancy KPIs',
            permissionTypes: ['view'],
            children: [
              { path: 'deals.financials.occupancy.occupancy_rate', label: 'Occupancy Rate', permissionTypes: ['view'] },
              { path: 'deals.financials.occupancy.vacancy_rate', label: 'Vacancy Rate', permissionTypes: ['view'] },
              { path: 'deals.financials.occupancy.average_lease_term', label: 'Average Lease Term', permissionTypes: ['view'] },
              { path: 'deals.financials.occupancy.tenant_turnover_rate', label: 'Tenant Turnover Rate', permissionTypes: ['view'] },
            ],
          },
          {
            path: 'deals.financials.debt_service',
            label: 'Debt Service KPIs',
            permissionTypes: ['view'],
            children: [
              { path: 'deals.financials.debt_service.dscr', label: 'Debt Service Coverage Ratio (DSCR)', permissionTypes: ['view'] },
              { path: 'deals.financials.debt_service.ltv', label: 'Loan to Value (LTV)', permissionTypes: ['view'] },
              { path: 'deals.financials.debt_service.interest_coverage_ratio', label: 'Interest Coverage Ratio', permissionTypes: ['view'] },
              { path: 'deals.financials.debt_service.debt_yield', label: 'Debt Yield', permissionTypes: ['view'] },
            ],
          },
          {
            path: 'deals.financials.performance',
            label: 'Performance KPIs',
            permissionTypes: ['view'],
            children: [
              { path: 'deals.financials.performance.cap_rate', label: 'Cap Rate', permissionTypes: ['view'] },
              { path: 'deals.financials.performance.cash_on_cash', label: 'Cash on Cash Return', permissionTypes: ['view'] },
              { path: 'deals.financials.performance.irr', label: 'Internal Rate of Return (IRR)', permissionTypes: ['view'] },
              { path: 'deals.financials.performance.equity_multiple', label: 'Equity Multiple', permissionTypes: ['view'] },
              { path: 'deals.financials.performance.roi', label: 'Return on Investment (ROI)', permissionTypes: ['view'] },
            ],
          },
          {
            path: 'deals.financials.financial_statements',
            label: 'Financial Statements',
            permissionTypes: ['view'],
            children: [
              { path: 'deals.financials.financial_statements.income_statement', label: 'Income Statement', permissionTypes: ['view'] },
              { path: 'deals.financials.financial_statements.balance_sheet', label: 'Balance Sheet', permissionTypes: ['view'] },
              { path: 'deals.financials.financial_statements.cash_flow', label: 'Cash Flow Statement', permissionTypes: ['view'] },
            ],
          },
        ],
      },
      {
        path: 'deals.milestones',
        label: 'Milestones',
        permissionTypes: ['view', 'create', 'edit', 'delete'],
      },
      {
        path: 'deals.documents',
        label: 'Deal Documents',
        permissionTypes: ['view', 'create'],
      },
      {
        path: 'deals.investors',
        label: 'Deal Investors',
        permissionTypes: ['view'],
        children: [
          { path: 'deals.investors.view_list', label: 'View Investor List', permissionTypes: ['view'] },
          { path: 'deals.investors.view_details', label: 'View Investor Details', permissionTypes: ['view'] },
        ],
      },
      {
        path: 'deals.outliers',
        label: 'Outliers Dashboard',
        permissionTypes: ['view'],
      },
    ],
  },
  {
    path: 'investors',
    label: 'Investors',
    description: 'Investor management',
    permissionTypes: ['view', 'create', 'edit', 'delete'],
    children: [
      { path: 'investors.view_list', label: 'View Investor List', permissionTypes: ['view'] },
      { path: 'investors.view_details', label: 'View Investor Details', permissionTypes: ['view'] },
      { path: 'investors.add_investor', label: 'Add Investor', permissionTypes: ['create'] },
      { path: 'investors.edit_investor', label: 'Edit Investor', permissionTypes: ['edit'] },
      { path: 'investors.remove_investor', label: 'Remove Investor', permissionTypes: ['delete'] },
    ],
  },
  {
    path: 'pipeline',
    label: 'Pipeline',
    description: 'Prospect and lead management',
    permissionTypes: ['view', 'create', 'edit'],
    children: [
      { path: 'pipeline.view', label: 'View Pipeline', permissionTypes: ['view'] },
      { path: 'pipeline.send_kyc', label: 'Send KYC Invites', permissionTypes: ['create'] },
      { path: 'pipeline.approve_reject', label: 'Approve/Reject Applications', permissionTypes: ['edit'] },
      { path: 'pipeline.convert_to_investor', label: 'Convert to Investor', permissionTypes: ['create'] },
    ],
  },
  {
    path: 'capital_calls',
    label: 'Capital Calls',
    description: 'Capital call management',
    permissionTypes: ['view', 'create', 'edit'],
    children: [
      { path: 'capital_calls.view_own', label: 'View Own Capital Calls', permissionTypes: ['view'] },
      { path: 'capital_calls.view_all', label: 'View All Capital Calls', permissionTypes: ['view'] },
      { path: 'capital_calls.create', label: 'Create Capital Calls', permissionTypes: ['create'] },
      { path: 'capital_calls.edit', label: 'Edit Capital Calls', permissionTypes: ['edit'] },
      { path: 'capital_calls.send_reminders', label: 'Send Reminders', permissionTypes: ['create'] },
    ],
  },
  {
    path: 'documents',
    label: 'Documents',
    description: 'Document management',
    permissionTypes: ['view', 'create'],
    children: [
      { path: 'documents.view_own', label: 'View Own Documents', permissionTypes: ['view'] },
      {
        path: 'documents.fund_documents',
        label: 'Fund Documents',
        permissionTypes: ['view', 'create'],
      },
      {
        path: 'documents.deal_documents',
        label: 'Deal Documents',
        permissionTypes: ['view', 'create'],
      },
      {
        path: 'documents.investor_documents',
        label: 'Investor Documents',
        permissionTypes: ['view', 'create'],
        children: [
          { path: 'documents.investor_documents.view_own', label: 'View Own', permissionTypes: ['view'] },
          { path: 'documents.investor_documents.view_all', label: 'View All', permissionTypes: ['view'] },
          { path: 'documents.investor_documents.upload', label: 'Upload', permissionTypes: ['create'] },
        ],
      },
      {
        path: 'documents.validation_queue',
        label: 'Validation Queue',
        permissionTypes: ['view', 'edit'],
        children: [
          { path: 'documents.validation_queue.view', label: 'View Queue', permissionTypes: ['view'] },
          { path: 'documents.validation_queue.approve', label: 'Approve Documents', permissionTypes: ['edit'] },
          { path: 'documents.validation_queue.reject', label: 'Reject Documents', permissionTypes: ['edit'] },
        ],
      },
    ],
  },
  {
    path: 'reports',
    label: 'Reports',
    description: 'Report generation and export',
    permissionTypes: ['view'],
    children: [
      { path: 'reports.fund_overview', label: 'Fund Overview Report', permissionTypes: ['view'] },
      { path: 'reports.deal_performance', label: 'Deal Performance Report', permissionTypes: ['view'] },
      { path: 'reports.financial_report', label: 'Detailed Financial Report', permissionTypes: ['view'] },
      { path: 'reports.export_csv', label: 'Export to CSV', permissionTypes: ['view'] },
      { path: 'reports.export_pdf', label: 'Export to PDF', permissionTypes: ['view'] },
    ],
  },
  {
    path: 'communications',
    label: 'Communications',
    description: 'Messaging and email',
    permissionTypes: ['view', 'create'],
    children: [
      { path: 'communications.view_inbox', label: 'View Inbox', permissionTypes: ['view'] },
      { path: 'communications.send_messages', label: 'Send Messages', permissionTypes: ['create'] },
      { path: 'communications.view_all', label: 'View All Communications', permissionTypes: ['view'] },
      { path: 'communications.email_templates', label: 'Email Templates', permissionTypes: ['view', 'edit'] },
    ],
  },
  {
    path: 'settings',
    label: 'Settings',
    description: 'Fund and account settings',
    permissionTypes: ['view', 'edit'],
    children: [
      { path: 'settings.fund_settings', label: 'Fund Settings', permissionTypes: ['view', 'edit'] },
      { path: 'settings.branding', label: 'Branding', permissionTypes: ['view', 'edit'] },
      { path: 'settings.permissions', label: 'Permissions', permissionTypes: ['view', 'edit'] },
      { path: 'settings.team_members', label: 'Team Members', permissionTypes: ['view', 'edit'] },
      { path: 'settings.integrations', label: 'Integrations', permissionTypes: ['view', 'edit'] },
      { path: 'settings.billing', label: 'Billing', permissionTypes: ['view', 'edit'] },
    ],
  },
  {
    path: 'data',
    label: 'Data',
    description: 'Data connections and imports',
    permissionTypes: ['view', 'create', 'edit'],
    children: [
      { path: 'data.view_connections', label: 'View Connections', permissionTypes: ['view'] },
      { path: 'data.add_connection', label: 'Add Connection', permissionTypes: ['create'] },
      { path: 'data.upload_csv', label: 'Upload CSV', permissionTypes: ['create'] },
      { path: 'data.mapping', label: 'Column Mapping', permissionTypes: ['edit'] },
    ],
  },
];

/**
 * Get all paths from the permission tree (flattened)
 */
export function getAllPermissionPaths(nodes: PermissionNode[] = PERMISSION_TREE): string[] {
  const paths: string[] = [];
  
  function traverse(nodeList: PermissionNode[]): void {
    for (const node of nodeList) {
      paths.push(node.path);
      if (node.children) {
        traverse(node.children);
      }
    }
  }
  
  traverse(nodes);
  return paths;
}

/**
 * Find a node by path in the permission tree
 */
export function findPermissionNode(path: string, nodes: PermissionNode[] = PERMISSION_TREE): PermissionNode | null {
  for (const node of nodes) {
    if (node.path === path) {
      return node;
    }
    if (node.children) {
      const found = findPermissionNode(path, node.children);
      if (found) return found;
    }
  }
  return null;
}

/**
 * Get parent path from a permission path
 */
export function getParentPath(path: string): string | null {
  const parts = path.split('.');
  if (parts.length <= 1) return null;
  return parts.slice(0, -1).join('.');
}

/**
 * Get all child paths for a given path
 */
export function getChildPaths(path: string, nodes: PermissionNode[] = PERMISSION_TREE): string[] {
  const node = findPermissionNode(path, nodes);
  if (!node || !node.children) return [];
  
  const paths: string[] = [];
  function traverse(nodeList: PermissionNode[]): void {
    for (const n of nodeList) {
      paths.push(n.path);
      if (n.children) traverse(n.children);
    }
  }
  traverse(node.children);
  return paths;
}

/**
 * Check if a path is an ancestor of another path
 */
export function isAncestorPath(potentialAncestor: string, path: string): boolean {
  return path.startsWith(potentialAncestor + '.');
}

/**
 * Get the depth level of a path (0-indexed)
 */
export function getPathDepth(path: string): number {
  return path.split('.').length - 1;
}

/** Labels for permission types */
export const PERMISSION_TYPE_LABELS: Record<PermissionType, string> = {
  view: 'View',
  create: 'Create',
  edit: 'Edit',
  delete: 'Delete',
};

