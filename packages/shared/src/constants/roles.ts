export const USER_ROLES = {
  INVESTOR: 'investor',
  MANAGER: 'manager',
  ACCOUNTANT: 'accountant',
  ATTORNEY: 'attorney',
} as const;

export type UserRole = typeof USER_ROLES[keyof typeof USER_ROLES];

export const ROLE_ARRAY = Object.values(USER_ROLES);

