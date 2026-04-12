import React, { useState, useEffect } from 'react';
import { usersApi, User } from '../services/api';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Separator } from './ui/separator';

interface UserProfileProps {
  user: User;
  onUserUpdate: (updatedUser: User) => void;
  onError: (error: string) => void;
}

const UserProfile: React.FC<UserProfileProps> = ({ user, onUserUpdate, onError }) => {
  const [hasPassword, setHasPassword] = useState<boolean>(false);
  const [showPasswordForm, setShowPasswordForm] = useState<boolean>(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    checkUserPassword();
  }, [user.id]);

  const checkUserPassword = async () => {
    if (!user.id) return;
    
    try {
      const response = await usersApi.hasPassword(user.id);
      setHasPassword(response.has_password);
    } catch (error) {
      console.error('Error checking password:', error);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      onError('Passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      onError('Password must be at least 6 characters long');
      return;
    }

    if (!user.id) return;

    setLoading(true);
    try {
      if (hasPassword) {
        // Change existing password
        await usersApi.changePassword(user.id, passwordForm.currentPassword, passwordForm.newPassword);
      } else {
        // Set new password
        await usersApi.setPassword(user.id, passwordForm.newPassword);
      }
      
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setShowPasswordForm(false);
      setHasPassword(true);
      onError(''); // Clear any previous errors
    } catch (error) {
      console.error('Password update error:', error);
      // Show the actual error message if available
      const errorMessage = error instanceof Error ? error.message : 
                          (error as any)?.message || 
                          'Failed to update password. Please try again.';
      onError(`Password update failed: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: keyof typeof passwordForm, value: string) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">User Profile</CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant={user.is_active ? 'success' : 'destructive'}>
              {user.is_active ? 'Active' : 'Inactive'}
            </Badge>
            <Badge variant={hasPassword ? 'default' : 'warning'}>
              {hasPassword ? 'Password Set' : 'No Password'}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {[
            { label: 'Name', value: user.name },
            { label: 'Email', value: user.email },
            { label: 'Username', value: user.username || 'Not set' },
            { label: 'Designation', value: user.designation },
            { label: 'Employment Type', value: user.employment_type },
            { label: 'Roles', value: user.roles?.join(', ') || 'No roles assigned' },
            ...(user.phone ? [{ label: 'Phone', value: user.phone }] : []),
            ...(user.last_login ? [{ label: 'Last Login', value: new Date(user.last_login).toLocaleDateString() }] : []),
          ].map(({ label, value }) => (
            <div key={label}>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{label}</p>
              <p className="mt-0.5 text-sm">{value}</p>
            </div>
          ))}
        </div>

        <Separator />

        {/* Password Management */}
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold">Password Management</h4>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowPasswordForm(!showPasswordForm)}
          >
            {hasPassword ? 'Change Password' : 'Set Password'}
          </Button>
        </div>

        {showPasswordForm && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {hasPassword && (
              <div className="space-y-1.5">
                <Label htmlFor="currentPassword">Current Password</Label>
                <Input
                  id="currentPassword"
                  type="password"
                  required
                  value={passwordForm.currentPassword}
                  onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                />
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="newPassword">New Password</Label>
              <Input
                id="newPassword"
                type="password"
                required
                minLength={6}
                value={passwordForm.newPassword}
                onChange={(e) => handleInputChange('newPassword', e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                type="password"
                required
                value={passwordForm.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setShowPasswordForm(false);
                  setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? 'Updating...' : hasPassword ? 'Change Password' : 'Set Password'}
              </Button>
            </div>
          </form>
        )}
      </CardContent>
    </Card>
  );


};

export default UserProfile;
