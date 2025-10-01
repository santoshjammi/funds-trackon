import React, { useState, useEffect } from 'react';
import { 
  UsersIcon, 
  ShieldCheckIcon, 
  CogIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';
import { rolesApi, usersApi, User } from '../services/api';
import { 
  Role, 
  Permission, 
  CreateRoleRequest, 
  UserRolesResponse,
  ROLE_COLORS,
  PERMISSION_CATEGORIES 
} from '../types/rbac';
import { useAuth } from '../contexts/AuthContext';
import './AdminSettings.css';

interface AdminSettingsProps {
  onError: (message: string) => void;
  onSuccess: (message: string) => void;
}

const AdminSettings: React.FC<AdminSettingsProps> = ({ onError, onSuccess }) => {
  const { hasAnyRole, hasRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'roles' | 'users' | 'permissions'>('roles');
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Role management state
  const [showCreateRole, setShowCreateRole] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [roleForm, setRoleForm] = useState<CreateRoleRequest>({
    name: '',
    description: '',
    permissions: [],
    color: ROLE_COLORS[0]
  });
  
  // User role management state
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [userRoles, setUserRoles] = useState<UserRolesResponse | null>(null);

  useEffect(() => {
    // Check if user has admin permissions
    if (!hasAnyRole(['Super Admin', 'Admin'])) {
      onError('Access denied. You need admin privileges to access this page.');
      return;
    }
    
    loadData();
  }, [hasAnyRole, onError]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      console.log('Loading admin data...');
      
      // Check if we have a token
      const token = localStorage.getItem('authToken') || localStorage.getItem('access_token') || localStorage.getItem('token');
      console.log('Token available:', !!token);
      if (token) {
        console.log('Token preview:', token.substring(0, 50) + '...');
        
        // Try to decode the JWT payload to see what's in it
        try {
          const parts = token.split('.');
          if (parts.length === 3) {
            const payload = JSON.parse(atob(parts[1].replace(/-/g, '+').replace(/_/g, '/')));
            console.log('JWT payload:', payload);
            console.log('Token expires:', new Date(payload.exp * 1000));
            console.log('Token issued:', new Date(payload.iat * 1000));
          }
        } catch (e) {
          console.error('Failed to decode JWT:', e);
        }
      } else {
        console.error('No token found in localStorage!');
        console.log('All localStorage keys:', Object.keys(localStorage));
      }
      
      // Load permissions first (no special permissions required)
      console.log('Loading permissions...');
      const permissionsData = await rolesApi.getPermissions();
      console.log('Permissions loaded:', permissionsData.length);
      setPermissions(permissionsData);
      
      // Load roles (requires MANAGE_ROLES permission)
      console.log('Loading roles...');
      const rolesData = await rolesApi.getRoles();
      console.log('Roles loaded:', rolesData.length);
      setRoles(rolesData);
      
      // Load users
      console.log('Loading users...');
      const usersData = await usersApi.getAll();
      console.log('Users loaded:', usersData.length);
      setUsers(usersData);
      
      console.log('All admin data loaded successfully');
    } catch (error: any) {
      console.error('Error loading admin data:', error);
      
      let errorMessage = 'Unknown error';
      
      // Check if it's a fetch Response error
      if (error instanceof Response) {
        console.error('Response status:', error.status);
        console.error('Response statusText:', error.statusText);
        
        if (error.status === 401) {
          errorMessage = 'Not authenticated or access denied (401/403). Please log in again.';
        } else if (error.status === 403) {
          errorMessage = 'Access forbidden. You may not have the required permissions.';
        } else {
          errorMessage = `Server error (${error.status}): ${error.statusText}`;
        }
      } else if (error?.message) {
        errorMessage = error.message;
      } else if (error?.detail) {
        errorMessage = error.detail;
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
      
      onError(`Failed to load admin data: ${errorMessage}`);
      
      // Log more details about the error
      if (error?.response) {
        console.error('Response status:', error.response.status);
        console.error('Response data:', error.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRole = async () => {
    try {
      if (!roleForm.name.trim()) {
        onError('Role name is required');
        return;
      }
      
      await rolesApi.createRole(roleForm);
      onSuccess('Role created successfully');
      setShowCreateRole(false);
      setRoleForm({
        name: '',
        description: '',
        permissions: [],
        color: ROLE_COLORS[0]
      });
      loadData();
    } catch (error) {
      onError('Failed to create role');
      console.error('Error creating role:', error);
    }
  };

  const handleUpdateRole = async () => {
    try {
      if (!editingRole) return;
      
      await rolesApi.updateRole(editingRole.id, {
        name: roleForm.name,
        description: roleForm.description,
        permissions: roleForm.permissions,
        color: roleForm.color
      });
      onSuccess('Role updated successfully');
      setEditingRole(null);
      setRoleForm({
        name: '',
        description: '',
        permissions: [],
        color: ROLE_COLORS[0]
      });
      loadData();
    } catch (error) {
      onError('Failed to update role');
      console.error('Error updating role:', error);
    }
  };

  const handleDeleteRole = async (roleId: string, roleName: string) => {
    if (!window.confirm(`Are you sure you want to delete the role "${roleName}"?`)) {
      return;
    }
    
    try {
      await rolesApi.deleteRole(roleId);
      onSuccess('Role deleted successfully');
      loadData();
    } catch (error) {
      onError('Failed to delete role. It may be assigned to users or be a system role.');
      console.error('Error deleting role:', error);
    }
  };

  const handleEditRole = (role: Role) => {
    setEditingRole(role);
    setRoleForm({
      name: role.name,
      description: role.description || '',
      permissions: role.permissions,
      color: role.color || ROLE_COLORS[0]
    });
    setShowCreateRole(true);
  };

  const handleAssignRole = async (userId: string, roleId: string) => {
    try {
      await rolesApi.assignRole(userId, roleId);
      onSuccess('Role assigned successfully');
      if (selectedUser === userId) {
        loadUserRoles(userId);
      }
    } catch (error) {
      onError('Failed to assign role');
      console.error('Error assigning role:', error);
    }
  };

  const handleUnassignRole = async (userId: string, roleId: string) => {
    try {
      await rolesApi.unassignRole(userId, roleId);
      onSuccess('Role unassigned successfully');
      if (selectedUser === userId) {
        loadUserRoles(userId);
      }
    } catch (error) {
      onError('Failed to unassign role');
      console.error('Error unassigning role:', error);
    }
  };

  const loadUserRoles = async (userId: string) => {
    try {
      const userRolesData = await rolesApi.getUserRoles(userId);
      setUserRoles(userRolesData);
    } catch (error) {
      onError('Failed to load user roles');
      console.error('Error loading user roles:', error);
    }
  };

  const handleUserSelect = (userId: string) => {
    setSelectedUser(userId);
    if (userId) {
      loadUserRoles(userId);
    } else {
      setUserRoles(null);
    }
  };

  const togglePermission = (permission: string) => {
    setRoleForm(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permission)
        ? prev.permissions.filter(p => p !== permission)
        : [...prev.permissions, permission]
    }));
  };

  const groupPermissionsByCategory = (permissions: Permission[]) => {
    return permissions.reduce((acc, permission) => {
      if (!acc[permission.category]) {
        acc[permission.category] = [];
      }
      acc[permission.category].push(permission);
      return acc;
    }, {} as Record<string, Permission[]>);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Admin Settings</h1>
        <p className="mt-2 text-gray-600">Manage roles, permissions, and user access.</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-8">
        <nav className="-mb-px flex space-x-8">
          {[
            { key: 'roles', label: 'Roles Management', icon: ShieldCheckIcon },
            { key: 'users', label: 'User Roles', icon: UsersIcon },
            { key: 'permissions', label: 'Permissions', icon: CogIcon }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as typeof activeTab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                activeTab === key
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Roles Management Tab */}
      {activeTab === 'roles' && (
        <div>
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold text-gray-900">Roles Management</h2>
            {hasRole('Super Admin') && (
              <button
                onClick={() => setShowCreateRole(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <PlusIcon className="h-4 w-4 mr-2" />
                Create Role
              </button>
            )}
          </div>

          {/* Roles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {roles.map((role) => (
              <div key={role.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div 
                      className="role-color-indicator" 
                      style={{ backgroundColor: role.color || '#6B7280' }}
                    ></div>
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">{role.name}</h3>
                      {role.is_system_role && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          System Role
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    {hasRole('Super Admin') && (
                      <button
                        onClick={() => handleEditRole(role)}
                        className="text-gray-400 hover:text-gray-600"
                        title={`Edit ${role.name} role`}
                      >
                        <PencilIcon className="h-4 w-4" />
                      </button>
                    )}
                    {!role.is_system_role && hasRole('Super Admin') && (
                      <button
                        onClick={() => handleDeleteRole(role.id, role.name)}
                        className="text-gray-400 hover:text-red-600"
                        title={`Delete ${role.name} role`}
                      >
                        <TrashIcon className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </div>
                
                {role.description && (
                  <p className="mt-2 text-sm text-gray-600">{role.description}</p>
                )}
                
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-900">Permissions ({role.permissions.length})</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {role.permissions.slice(0, 3).map((permission) => (
                      <span
                        key={permission}
                        className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800"
                      >
                        {permission.replace(/_/g, ' ').toLowerCase()}
                      </span>
                    ))}
                    {role.permissions.length > 3 && (
                      <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-800">
                        +{role.permissions.length - 3} more
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="mt-4 text-xs text-gray-500">
                  Created: {new Date(role.created_at).toLocaleDateString()}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* User Roles Tab */}
      {activeTab === 'users' && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">User Role Management</h2>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* User Selection */}
            <div>
              <label htmlFor="user-select" className="block text-sm font-medium text-gray-700 mb-2">
                Select User
              </label>
              <select
                id="user-select"
                value={selectedUser}
                onChange={(e) => handleUserSelect(e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
              >
                <option value="">Select a user...</option>
                {users.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.name} ({user.email})
                  </option>
                ))}
              </select>
              
              {userRoles && (
                <div className="mt-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">
                    Current Roles for {userRoles.user_name}
                  </h3>
                  <div className="space-y-3">
                    {userRoles.roles.map((assignment) => (
                      <div key={assignment.role.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="user-role-indicator" 
                            style={{ backgroundColor: assignment.role.color || '#6B7280' }}
                          ></div>
                          <div>
                            <span className="font-medium text-gray-900">{assignment.role.name}</span>
                            {assignment.role.description && (
                              <p className="text-sm text-gray-600">{assignment.role.description}</p>
                            )}
                          </div>
                        </div>
                        {hasAnyRole(['Super Admin', 'Admin']) && (
                          <button
                            onClick={() => handleUnassignRole(selectedUser, assignment.role.id)}
                            className="text-red-600 hover:text-red-800"
                            title={`Remove ${assignment.role.name} role`}
                          >
                            <XMarkIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    {userRoles.roles.length === 0 && (
                      <p className="text-gray-500 text-center py-4">No roles assigned</p>
                    )}
                  </div>
                </div>
              )}
            </div>
            
            {/* Available Roles */}
            {selectedUser && (
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Available Roles</h3>
                <div className="space-y-3">
                  {roles
                    .filter(role => !userRoles?.roles.some(ur => ur.role.id === role.id))
                    .map((role) => (
                      <div key={role.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 rounded-md">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="available-role-indicator" 
                            style={{ backgroundColor: role.color || '#6B7280' }}
                          ></div>
                          <div>
                            <span className="font-medium text-gray-900">{role.name}</span>
                            {role.description && (
                              <p className="text-sm text-gray-600">{role.description}</p>
                            )}
                          </div>
                        </div>
                        {hasAnyRole(['Super Admin', 'Admin']) && (
                          <button
                            onClick={() => handleAssignRole(selectedUser, role.id)}
                            className="text-green-600 hover:text-green-800"
                            title={`Assign ${role.name} role`}
                          >
                            <PlusIcon className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Permissions Tab */}
      {activeTab === 'permissions' && (
        <div>
          <h2 className="text-xl font-semibold text-gray-900 mb-6">System Permissions</h2>
          
          {Object.entries(groupPermissionsByCategory(permissions)).map(([category, categoryPermissions]) => (
            <div key={category} className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">{category}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {categoryPermissions.map((permission) => (
                  <div key={permission.name} className="bg-white p-4 rounded-lg border border-gray-200">
                    <h4 className="font-medium text-gray-900">
                      {permission.name.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                    </h4>
                    <p className="text-sm text-gray-600 mt-1">{permission.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Role Modal */}
      {showCreateRole && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                {editingRole ? 'Edit Role' : 'Create New Role'}
              </h3>
            </div>
            
            <div className="px-6 py-4 space-y-6">
              {/* Basic Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label htmlFor="role-name" className="block text-sm font-medium text-gray-700">
                    Role Name *
                  </label>
                  <input
                    type="text"
                    id="role-name"
                    value={roleForm.name}
                    onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="Enter role name"
                  />
                </div>
                
                <div>
                  <label htmlFor="role-color" className="block text-sm font-medium text-gray-700">
                    Role Color
                  </label>
                  <div className="mt-1 flex items-center space-x-2">
                    <div 
                      className="role-color-picker" 
                      style={{ backgroundColor: roleForm.color }}
                    ></div>
                    <select
                      id="role-color"
                      value={roleForm.color}
                      onChange={(e) => setRoleForm(prev => ({ ...prev, color: e.target.value }))}
                      className="block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    >
                      {ROLE_COLORS.map((color) => (
                        <option key={color} value={color}>{color}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
              
              <div>
                <label htmlFor="role-description" className="block text-sm font-medium text-gray-700">
                  Description
                </label>
                <textarea
                  id="role-description"
                  rows={3}
                  value={roleForm.description}
                  onChange={(e) => setRoleForm(prev => ({ ...prev, description: e.target.value }))}
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  placeholder="Enter role description"
                />
              </div>
              
              {/* Permissions */}
              <div>
                <h4 className="text-sm font-medium text-gray-900 mb-4">Permissions</h4>
                {Object.entries(groupPermissionsByCategory(permissions)).map(([category, categoryPermissions]) => (
                  <div key={category} className="mb-6">
                    <h5 className="text-sm font-medium text-gray-700 mb-2">{category}</h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {categoryPermissions.map((permission) => (
                        <label key={permission.name} className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={roleForm.permissions.includes(permission.name)}
                            onChange={() => togglePermission(permission.name)}
                            className="rounded border-gray-300 text-blue-600 shadow-sm focus:border-blue-300 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                          />
                          <span className="text-sm text-gray-700">
                            {permission.name.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCreateRole(false);
                  setEditingRole(null);
                  setRoleForm({
                    name: '',
                    description: '',
                    permissions: [],
                    color: ROLE_COLORS[0]
                  });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                onClick={editingRole ? handleUpdateRole : handleCreateRole}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                {editingRole ? 'Update Role' : 'Create Role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminSettings;