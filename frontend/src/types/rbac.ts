/**
 * RBAC (Role-Based Access Control) TypeScript types
 */

export interface Permission {
  name: string;
  description: string;
  category: string;
  created_at: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  permissions: string[];
  is_system_role: boolean;
  color?: string;
  created_at: string;
  updated_at?: string;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
  permissions: string[];
  color?: string;
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
  permissions?: string[];
  color?: string;
}

export interface UserRoleAssignment {
  role: Role;
  assigned_at: string;
  assigned_by?: string;
}

export interface UserRolesResponse {
  user_id: string;
  user_name: string;
  roles: UserRoleAssignment[];
}

export interface AssignRoleRequest {
  user_id: string;
  role_id: string;
}

// Permission categories for organization
export const PERMISSION_CATEGORIES = [
  'User Management',
  'Contact Management',
  'Organization Management',
  'Opportunity Management',
  'Task Management',
  'Fundraising Management',
  'Tracker Management',
  'Meeting Management',
  'Administration',
  'Reports'
] as const;

// System role colors
export const ROLE_COLORS = [
  '#DC2626', // Red
  '#F59E0B', // Amber
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#8B5CF6', // Violet
  '#F97316', // Orange
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#EC4899', // Pink
  '#6B7280', // Gray
] as const;

export type PermissionCategory = typeof PERMISSION_CATEGORIES[number];
export type RoleColor = typeof ROLE_COLORS[number];