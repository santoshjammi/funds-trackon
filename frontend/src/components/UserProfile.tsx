import React, { useState, useEffect } from 'react';
import { usersApi, User } from '../services/api';

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
      onError('Failed to update password. Please try again.');
      console.error('Password update error:', error);
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
    <div className="bg-white shadow rounded-lg p-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-medium text-gray-900">User Profile</h3>
        <div className="flex items-center space-x-2">
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            user.is_active 
              ? 'bg-green-100 text-green-800' 
              : 'bg-red-100 text-red-800'
          }`}>
            {user.is_active ? 'Active' : 'Inactive'}
          </span>
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
            hasPassword 
              ? 'bg-blue-100 text-blue-800' 
              : 'bg-yellow-100 text-yellow-800'
          }`}>
            {hasPassword ? 'Password Set' : 'No Password'}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-gray-700">Name</label>
          <p className="mt-1 text-sm text-gray-900">{user.name}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Email</label>
          <p className="mt-1 text-sm text-gray-900">{user.email}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Username</label>
          <p className="mt-1 text-sm text-gray-900">{user.username || 'Not set'}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Designation</label>
          <p className="mt-1 text-sm text-gray-900">{user.designation}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Employment Type</label>
          <p className="mt-1 text-sm text-gray-900">{user.employment_type}</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Roles</label>
          <p className="mt-1 text-sm text-gray-900">
            {user.roles?.join(', ') || 'No roles assigned'}
          </p>
        </div>

        {user.phone && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone</label>
            <p className="mt-1 text-sm text-gray-900">{user.phone}</p>
          </div>
        )}

        {user.last_login && (
          <div>
            <label className="block text-sm font-medium text-gray-700">Last Login</label>
            <p className="mt-1 text-sm text-gray-900">
              {new Date(user.last_login).toLocaleDateString()}
            </p>
          </div>
        )}
      </div>

      {/* Password Management Section */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-md font-medium text-gray-900">Password Management</h4>
          <button
            onClick={() => setShowPasswordForm(!showPasswordForm)}
            className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            {hasPassword ? 'Change Password' : 'Set Password'}
          </button>
        </div>

        {showPasswordForm && (
          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            {hasPassword && (
              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                  Current Password
                </label>
                <input
                  id="currentPassword"
                  type="password"
                  required
                  className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                  value={passwordForm.currentPassword}
                  onChange={(e) => handleInputChange('currentPassword', e.target.value)}
                />
              </div>
            )}

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                id="newPassword"
                type="password"
                required
                minLength={6}
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={passwordForm.newPassword}
                onChange={(e) => handleInputChange('newPassword', e.target.value)}
              />
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                required
                className="mt-1 block w-full border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                value={passwordForm.confirmPassword}
                onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
              />
            </div>

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => {
                  setShowPasswordForm(false);
                  setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                }}
                className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {loading ? 'Updating...' : hasPassword ? 'Change Password' : 'Set Password'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default UserProfile;