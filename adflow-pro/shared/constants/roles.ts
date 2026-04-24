export const ROLES = {
  CLIENT: 'client',
  MODERATOR: 'moderator',
  ADMIN: 'admin',
  SUPER_ADMIN: 'super_admin',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

export const ROLE_HIERARCHY: Record<Role, number> = {
  client: 1,
  moderator: 2,
  admin: 3,
  super_admin: 4,
};

export const hasRole = (userRole: Role, requiredRole: Role): boolean =>
  ROLE_HIERARCHY[userRole] >= ROLE_HIERARCHY[requiredRole];