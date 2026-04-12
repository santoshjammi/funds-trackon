import React, { useState, useEffect } from 'react';
import { 
  Users,
  ShieldCheck,
  Settings2,
  Plus,
  Pencil,
  Trash2,
  Check,
  X
} from 'lucide-react';
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
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Skeleton } from './ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from './ui/dialog';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { SelectNative } from './ui/select-native';
import { Separator } from './ui/separator';
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
      <div className="space-y-6">
        <Skeleton className="h-9 w-48" />
        <div className="flex gap-6"><Skeleton className="h-10 w-36" /><Skeleton className="h-10 w-36" /><Skeleton className="h-10 w-36" /></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-40" />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Admin Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">Manage roles, permissions, and user access.</p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b">
        <nav className="flex gap-1 -mb-px">
          {[
            { key: 'roles', label: 'Roles Management', icon: ShieldCheck },
            { key: 'users', label: 'User Roles', icon: Users },
            { key: 'permissions', label: 'Permissions', icon: Settings2 }
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setActiveTab(key as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                activeTab === key
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              <Icon className="h-4 w-4" />{label}
            </button>
          ))}
        </nav>
      </div>

      {/* Roles Management Tab */}
      {activeTab === 'roles' && (
        <div>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Roles Management</h2>
            {hasRole('Super Admin') && (
              <Button size="sm" onClick={() => setShowCreateRole(true)}>
                <Plus className="h-4 w-4 mr-2" />Create Role
              </Button>
            )}
          </div>

          {/* Roles Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map((role) => (
              <Card key={role.id} className="hover:shadow-md transition-shadow">
                <CardContent className="pt-5">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="role-color-indicator" style={{ backgroundColor: role.color || '#6B7280' }} />
                      <div>
                        <h3 className="text-sm font-semibold">{role.name}</h3>
                        {role.is_system_role && <Badge variant="info" className="mt-1 text-xs">System Role</Badge>}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {hasRole('Super Admin') && (
                        <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEditRole(role)} title={`Edit ${role.name}`}>
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                      )}
                      {!role.is_system_role && hasRole('Super Admin') && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleDeleteRole(role.id, role.name)} title={`Delete ${role.name}`}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                  {role.description && <p className="mt-2 text-xs text-muted-foreground">{role.description}</p>}
                  <div className="mt-3">
                    <p className="text-xs font-medium mb-1.5">Permissions ({role.permissions.length})</p>
                    <div className="flex flex-wrap gap-1">
                      {role.permissions.slice(0, 3).map((permission) => (
                        <Badge key={permission} variant="secondary" className="text-xs">
                          {permission.replace(/_/g, ' ').toLowerCase()}
                        </Badge>
                      ))}
                      {role.permissions.length > 3 && (
                        <Badge variant="secondary" className="text-xs">+{role.permissions.length - 3} more</Badge>
                      )}
                    </div>
                  </div>
                  <p className="mt-3 text-xs text-muted-foreground">Created: {new Date(role.created_at).toLocaleDateString()}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* User Roles Tab */}
      {activeTab === 'users' && (
        <div>
          <h2 className="text-lg font-semibold mb-4">User Role Management</h2>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* User Selection */}
            <div>
              <div className="space-y-1.5 mb-4">
                <Label htmlFor="user-select">Select User</Label>
                <SelectNative
                  id="user-select"
                  value={selectedUser}
                  onChange={(e) => handleUserSelect(e.target.value)}
                >
                  <option value="">Select a user...</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
                  ))}
                </SelectNative>
              </div>
              
              {userRoles && (
                <div>
                  <h3 className="text-sm font-semibold mb-3">Current Roles for {userRoles.user_name}</h3>
                  <div className="space-y-2">
                    {userRoles.roles.map((assignment) => (
                      <div key={assignment.role.id} className="flex items-center justify-between p-3 bg-muted/40 rounded-md">
                        <div className="flex items-center gap-3">
                          <div className="user-role-indicator" style={{ backgroundColor: assignment.role.color || '#6B7280' }} />
                          <div>
                            <span className="text-sm font-medium">{assignment.role.name}</span>
                            {assignment.role.description && <p className="text-xs text-muted-foreground">{assignment.role.description}</p>}
                          </div>
                        </div>
                        {hasAnyRole(['Super Admin', 'Admin']) && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => handleUnassignRole(selectedUser, assignment.role.id)} title={`Remove ${assignment.role.name}`}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {userRoles.roles.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No roles assigned</p>}
                  </div>
                </div>
              )}
            </div>
            
            {/* Available Roles */}
            {selectedUser && (
              <div>
                <h3 className="text-sm font-semibold mb-3">Available Roles</h3>
                <div className="space-y-2">
                  {roles
                    .filter(role => !userRoles?.roles.some(ur => ur.role.id === role.id))
                    .map((role) => (
                      <div key={role.id} className="flex items-center justify-between p-3 border rounded-md">
                        <div className="flex items-center gap-3">
                          <div className="available-role-indicator" style={{ backgroundColor: role.color || '#6B7280' }} />
                          <div>
                            <span className="text-sm font-medium">{role.name}</span>
                            {role.description && <p className="text-xs text-muted-foreground">{role.description}</p>}
                          </div>
                        </div>
                        {hasAnyRole(['Super Admin', 'Admin']) && (
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-green-600 hover:text-green-700" onClick={() => handleAssignRole(selectedUser, role.id)} title={`Assign ${role.name}`}>
                            <Plus className="h-3.5 w-3.5" />
                          </Button>
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
          <h2 className="text-lg font-semibold mb-4">System Permissions</h2>
          {Object.entries(groupPermissionsByCategory(permissions)).map(([category, categoryPermissions]) => (
            <div key={category} className="mb-6">
              <h3 className="text-sm font-semibold mb-3">{category}</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {categoryPermissions.map((permission) => (
                  <Card key={permission.name}>
                    <CardContent className="pt-4 pb-4">
                      <h4 className="text-sm font-medium">
                        {permission.name.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                      </h4>
                      <p className="text-xs text-muted-foreground mt-1">{permission.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create/Edit Role Dialog */}
      <Dialog open={showCreateRole} onOpenChange={(open) => {
        if (!open) {
          setShowCreateRole(false);
          setEditingRole(null);
          setRoleForm({ name: '', description: '', permissions: [], color: ROLE_COLORS[0] });
        }
      }}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingRole ? 'Edit Role' : 'Create New Role'}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-5 py-2">
            {/* Basic Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="role-name">Role Name *</Label>
                <Input
                  id="role-name"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter role name"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="role-color">Role Color</Label>
                <div className="flex items-center gap-2">
                  <div className="role-color-picker" style={{ backgroundColor: roleForm.color }} />
                  <SelectNative
                    id="role-color"
                    value={roleForm.color}
                    onChange={(e) => setRoleForm(prev => ({ ...prev, color: e.target.value }))}
                  >
                    {ROLE_COLORS.map((color) => (
                      <option key={color} value={color}>{color}</option>
                    ))}
                  </SelectNative>
                </div>
              </div>
            </div>
            
            <div className="space-y-1.5">
              <Label htmlFor="role-description">Description</Label>
              <Textarea
                id="role-description"
                rows={3}
                value={roleForm.description}
                onChange={(e) => setRoleForm(prev => ({ ...prev, description: e.target.value }))}
                placeholder="Enter role description"
              />
            </div>
            
            {/* Permissions */}
            <div>
              <h4 className="text-sm font-semibold mb-3">Permissions</h4>
              {Object.entries(groupPermissionsByCategory(permissions)).map(([category, categoryPermissions]) => (
                <div key={category} className="mb-4">
                  <h5 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">{category}</h5>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {categoryPermissions.map((permission) => (
                      <label key={permission.name} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={roleForm.permissions.includes(permission.name)}
                          onChange={() => togglePermission(permission.name)}
                          className="rounded border-input text-primary"
                        />
                        <span className="text-sm">
                          {permission.name.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase())}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setShowCreateRole(false);
              setEditingRole(null);
              setRoleForm({ name: '', description: '', permissions: [], color: ROLE_COLORS[0] });
            }}>Cancel</Button>
            <Button onClick={editingRole ? handleUpdateRole : handleCreateRole}>
              {editingRole ? 'Update Role' : 'Create Role'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminSettings;