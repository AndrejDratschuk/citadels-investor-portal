/**
 * Stakeholder Type Constants
 * Unified stakeholder types covering investors, service providers, and team members
 */

export const STAKEHOLDER_TYPE = {
  // Investors
  LIMITED_PARTNER: 'limited_partner',
  GENERAL_PARTNER: 'general_partner',
  SERIES_A: 'series_a',
  SERIES_B: 'series_b',
  SERIES_C: 'series_c',
  INSTITUTIONAL: 'institutional',
  INDIVIDUAL_ACCREDITED: 'individual_accredited',
  FAMILY_OFFICE: 'family_office',
  // Service Providers
  ACCOUNTANT: 'accountant',
  ATTORNEY: 'attorney',
  PROPERTY_MANAGER: 'property_manager',
  // Team
  TEAM_MEMBER: 'team_member',
  CUSTOM: 'custom',
} as const;

export type StakeholderType = typeof STAKEHOLDER_TYPE[keyof typeof STAKEHOLDER_TYPE];

export const STAKEHOLDER_TYPE_LABELS: Record<StakeholderType, string> = {
  [STAKEHOLDER_TYPE.LIMITED_PARTNER]: 'Limited Partner (LP)',
  [STAKEHOLDER_TYPE.GENERAL_PARTNER]: 'General Partner (GP)',
  [STAKEHOLDER_TYPE.SERIES_A]: 'Series A Investor',
  [STAKEHOLDER_TYPE.SERIES_B]: 'Series B Investor',
  [STAKEHOLDER_TYPE.SERIES_C]: 'Series C Investor',
  [STAKEHOLDER_TYPE.INSTITUTIONAL]: 'Institutional Investor',
  [STAKEHOLDER_TYPE.INDIVIDUAL_ACCREDITED]: 'Individual Accredited',
  [STAKEHOLDER_TYPE.FAMILY_OFFICE]: 'Family Office',
  [STAKEHOLDER_TYPE.ACCOUNTANT]: 'Accountant',
  [STAKEHOLDER_TYPE.ATTORNEY]: 'Attorney',
  [STAKEHOLDER_TYPE.PROPERTY_MANAGER]: 'Property Manager',
  [STAKEHOLDER_TYPE.TEAM_MEMBER]: 'Team Member',
  [STAKEHOLDER_TYPE.CUSTOM]: 'Custom',
};

export const STAKEHOLDER_TYPE_SHORT_LABELS: Record<StakeholderType, string> = {
  [STAKEHOLDER_TYPE.LIMITED_PARTNER]: 'LP',
  [STAKEHOLDER_TYPE.GENERAL_PARTNER]: 'GP',
  [STAKEHOLDER_TYPE.SERIES_A]: 'Series A',
  [STAKEHOLDER_TYPE.SERIES_B]: 'Series B',
  [STAKEHOLDER_TYPE.SERIES_C]: 'Series C',
  [STAKEHOLDER_TYPE.INSTITUTIONAL]: 'Institutional',
  [STAKEHOLDER_TYPE.INDIVIDUAL_ACCREDITED]: 'Individual',
  [STAKEHOLDER_TYPE.FAMILY_OFFICE]: 'Family Office',
  [STAKEHOLDER_TYPE.ACCOUNTANT]: 'Accountant',
  [STAKEHOLDER_TYPE.ATTORNEY]: 'Attorney',
  [STAKEHOLDER_TYPE.PROPERTY_MANAGER]: 'Property Mgr',
  [STAKEHOLDER_TYPE.TEAM_MEMBER]: 'Team',
  [STAKEHOLDER_TYPE.CUSTOM]: 'Custom',
};

/** Stakeholder types grouped by category for UI display */
export const STAKEHOLDER_CATEGORIES = {
  INVESTORS: [
    STAKEHOLDER_TYPE.LIMITED_PARTNER,
    STAKEHOLDER_TYPE.GENERAL_PARTNER,
    STAKEHOLDER_TYPE.SERIES_A,
    STAKEHOLDER_TYPE.SERIES_B,
    STAKEHOLDER_TYPE.SERIES_C,
    STAKEHOLDER_TYPE.INSTITUTIONAL,
    STAKEHOLDER_TYPE.INDIVIDUAL_ACCREDITED,
    STAKEHOLDER_TYPE.FAMILY_OFFICE,
  ],
  SERVICE_PROVIDERS: [
    STAKEHOLDER_TYPE.ACCOUNTANT,
    STAKEHOLDER_TYPE.ATTORNEY,
    STAKEHOLDER_TYPE.PROPERTY_MANAGER,
  ],
  TEAM: [
    STAKEHOLDER_TYPE.TEAM_MEMBER,
    STAKEHOLDER_TYPE.CUSTOM,
  ],
} as const;

export const STAKEHOLDER_CATEGORY_LABELS = {
  INVESTORS: 'Investors',
  SERVICE_PROVIDERS: 'Service Providers',
  TEAM: 'Team & Custom',
} as const;

/** Array of all stakeholder types for iteration */
export const STAKEHOLDER_TYPE_ARRAY = Object.values(STAKEHOLDER_TYPE);

/** Check if a stakeholder type is an investor type */
export function isInvestorType(type: StakeholderType): boolean {
  return (STAKEHOLDER_CATEGORIES.INVESTORS as readonly string[]).includes(type);
}

/** Check if a stakeholder type is a service provider type */
export function isServiceProviderType(type: StakeholderType): boolean {
  return (STAKEHOLDER_CATEGORIES.SERVICE_PROVIDERS as readonly string[]).includes(type);
}

