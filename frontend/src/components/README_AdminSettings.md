# Admin Settings - RBAC Management

## Overview
The Admin Settings page provides a comprehensive interface for managing the Role-Based Access Control (RBAC) system. This includes managing roles, permissions, and user role assignments.

## Features

### 1. Roles Management
- **View Roles**: See all available roles with their colors, descriptions, and permission counts
- **Create Role**: Define new roles with custom permissions and colors
- **Edit Role**: Modify existing roles (except system roles)
- **Delete Role**: Remove non-system roles (with confirmation)
- **System Roles**: Pre-defined roles that cannot be deleted
  - Super Admin: Full system access
  - Admin: Administrative privileges
  - Manager: Management-level access
  - Analyst: Data analysis permissions
  - User: Basic user permissions

### 2. User Role Management
- **Select User**: Choose a user to manage their roles
- **View Current Roles**: See all roles assigned to the selected user
- **Assign Roles**: Add new roles to users
- **Unassign Roles**: Remove roles from users
- **Role Indicators**: Color-coded role indicators for easy identification

### 3. Permissions Overview
- **View All Permissions**: Browse all 40+ system permissions organized by category
- **Permission Categories**:
  - User Management
  - Contact Management
  - Organization Management
  - Fundraising Management
  - Task Management
  - Tracker Management
  - Opportunity Management
  - System Administration
  - Report Management
  - Settings Management

## Usage

### Creating a New Role
1. Click "Create Role" button
2. Enter role name and description
3. Select a color for the role
4. Choose permissions by category
5. Click "Create Role"

### Assigning Roles to Users
1. Go to "User Roles" tab
2. Select a user from the dropdown
3. View their current roles
4. Use the "+" button to assign available roles
5. Use the "×" button to remove assigned roles

### Managing Permissions
1. Go to "Permissions" tab
2. Browse permissions by category
3. Each permission shows its description and purpose

## Permission System

The system uses 40+ granular permissions across 10 categories:

- **CREATE**: Ability to create new records
- **READ**: Ability to view records
- **UPDATE**: Ability to modify existing records
- **DELETE**: Ability to remove records
- **MANAGE**: Administrative control over modules
- **EXPORT**: Ability to export data
- **IMPORT**: Ability to import data

## Role Colors

Roles are assigned colors for visual identification:
- `#3B82F6` (Blue)
- `#10B981` (Green) 
- `#F59E0B` (Yellow)
- `#EF4444` (Red)
- `#8B5CF6` (Purple)
- `#F97316` (Orange)
- `#06B6D4` (Cyan)
- `#84CC16` (Lime)
- `#EC4899` (Pink)
- `#6B7280` (Gray)

## API Integration

The admin settings page integrates with the following API endpoints:

### Roles API
- `GET /api/permissions` - Get all permissions
- `GET /api/roles` - Get all roles
- `POST /api/roles` - Create new role
- `PUT /api/roles/{role_id}` - Update role
- `DELETE /api/roles/{role_id}` - Delete role

### User Role Management API
- `POST /api/roles/assign` - Assign role to user
- `DELETE /api/roles/unassign` - Remove role from user
- `GET /api/users/{user_id}/roles` - Get user's roles

## Security

- All API calls are protected by authentication tokens
- Permission checks are enforced on the backend
- System roles cannot be modified or deleted
- Role assignments are logged for audit purposes

## Responsive Design

The interface is fully responsive and works on:
- Desktop computers
- Tablets
- Mobile devices

## Error Handling

The component provides comprehensive error handling for:
- Network failures
- Authentication errors  
- Permission denied errors
- Validation errors
- Server errors

All errors are displayed with user-friendly messages.