import React, { useState, useEffect } from 'react';
import { usersApi, joplinApi, User } from '../services/api';
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

  // Joplin settings state
  const [joplinForm, setJoplinForm] = useState({
    joplin_base_url: user.joplin_base_url || 'http://localhost:41184',
    joplin_api_token: user.joplin_api_token || '',
    joplin_master_password: user.joplin_master_password || '',
  });
  const [joplinSaving, setJoplinSaving] = useState(false);
  const [joplinTesting, setJoplinTesting] = useState(false);
  const [joplinStatus, setJoplinStatus] = useState<{ connected: boolean; message: string } | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [showMasterPassword, setShowMasterPassword] = useState(false);

  // AI API keys state
  const [aiKeysForm, setAiKeysForm] = useState({
    openai_api_key: user.openai_api_key || '',
    claude_api_key: user.claude_api_key || '',
    openrouter_api_key: user.openrouter_api_key || '',
  });
  const [aiKeysSaving, setAiKeysSaving] = useState(false);
  const [aiKeysSaved, setAiKeysSaved] = useState(false);
  const [showAiKeys, setShowAiKeys] = useState<Record<string, boolean>>({});

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

  const handleJoplinSave = async () => {
    if (!user.id) return;
    setJoplinSaving(true);
    setJoplinStatus(null);
    try {
      await usersApi.update(user.id, {
        joplin_base_url: joplinForm.joplin_base_url,
        joplin_api_token: joplinForm.joplin_api_token,
        joplin_master_password: joplinForm.joplin_master_password || undefined,
      });
      onUserUpdate({ ...user, ...joplinForm });
    } catch (err) {
      onError('Failed to save Joplin settings');
    } finally {
      setJoplinSaving(false);
    }
  };

  const handleJoplinTest = async () => {
    if (!user.id) return;
    setJoplinTesting(true);
    setJoplinStatus(null);
    try {
      await usersApi.update(user.id, {
        joplin_base_url: joplinForm.joplin_base_url,
        joplin_api_token: joplinForm.joplin_api_token,
        joplin_master_password: joplinForm.joplin_master_password || undefined,
      });
      const res = await joplinApi.status();
      setJoplinStatus({ connected: res.connected, message: res.connected ? (res.joplin_response || 'Connected') : (res.error || 'Not connected') });
    } catch (err: any) {
      setJoplinStatus({ connected: false, message: err?.message || 'Connection failed' });
    } finally {
      setJoplinTesting(false);
    }
  };

  const handleAiKeysSave = async () => {
    if (!user.id) return;
    setAiKeysSaving(true);
    setAiKeysSaved(false);
    try {
      await usersApi.update(user.id, {
        openai_api_key: aiKeysForm.openai_api_key || undefined,
        claude_api_key: aiKeysForm.claude_api_key || undefined,
        openrouter_api_key: aiKeysForm.openrouter_api_key || undefined,
      });
      onUserUpdate({ ...user, ...aiKeysForm });
      setAiKeysSaved(true);
      setTimeout(() => setAiKeysSaved(false), 2500);
    } catch (err) {
      onError('Failed to save AI API keys');
    } finally {
      setAiKeysSaving(false);
    }
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

        <Separator />

        {/* AI API Keys */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">AI API Keys</h4>
          <p className="text-xs text-muted-foreground">
            Keys are stored securely in your account and used server-side for audio processing, AI insights, and note extraction.
          </p>

          {(
            [
              { key: 'openai_api_key', label: 'OpenAI API Key', placeholder: 'sk-...' },
              { key: 'claude_api_key', label: 'Anthropic Claude API Key', placeholder: 'sk-ant-...' },
              { key: 'openrouter_api_key', label: 'OpenRouter API Key', placeholder: 'sk-or-...' },
            ] as const
          ).map(({ key, label, placeholder }) => (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={key}>{label}</Label>
              <div className="flex gap-2">
                <Input
                  id={key}
                  type={showAiKeys[key] ? 'text' : 'password'}
                  placeholder={placeholder}
                  value={aiKeysForm[key]}
                  onChange={(e) => setAiKeysForm(f => ({ ...f, [key]: e.target.value }))}
                  className="font-mono text-sm"
                  autoComplete="off"
                />
                <Button type="button" variant="outline" size="sm" onClick={() => setShowAiKeys(s => ({ ...s, [key]: !s[key] }))}>
                  {showAiKeys[key] ? 'Hide' : 'Show'}
                </Button>
              </div>
            </div>
          ))}

          {aiKeysSaved && (
            <p className="text-xs px-3 py-2 rounded border bg-green-50 text-green-700 border-green-200">✓ API keys saved</p>
          )}

          <Button size="sm" onClick={handleAiKeysSave} disabled={aiKeysSaving}>
            {aiKeysSaving ? 'Saving…' : 'Save AI Keys'}
          </Button>
        </div>

        <Separator />

        {/* Joplin Connection Settings */}
        <div className="space-y-3">
          <h4 className="text-sm font-semibold">Joplin Connection</h4>
          <p className="text-xs text-muted-foreground">
            Connect your local Joplin desktop app (Web Clipper must be enabled in Joplin → Tools → Options → Web Clipper).
          </p>

          <div className="space-y-1.5">
            <Label htmlFor="joplin_base_url">Joplin API URL</Label>
            <Input
              id="joplin_base_url"
              placeholder="http://localhost:41184"
              value={joplinForm.joplin_base_url}
              onChange={(e) => setJoplinForm(f => ({ ...f, joplin_base_url: e.target.value }))}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="joplin_api_token">API Token</Label>
            <div className="flex gap-2">
              <Input
                id="joplin_api_token"
                type={showToken ? 'text' : 'password'}
                placeholder="Paste your Joplin Web Clipper token"
                value={joplinForm.joplin_api_token}
                onChange={(e) => setJoplinForm(f => ({ ...f, joplin_api_token: e.target.value }))}
                className="font-mono text-sm"
              />
              <Button type="button" variant="outline" size="sm" onClick={() => setShowToken(s => !s)}>
                {showToken ? 'Hide' : 'Show'}
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="joplin_master_password">E2EE Master Password</Label>
            <p className="text-xs text-muted-foreground">
              Only needed if you have end-to-end encryption enabled in Joplin (Tools → Encryption). Leave blank if not using encryption.
            </p>
            <div className="flex gap-2">
              <Input
                id="joplin_master_password"
                type={showMasterPassword ? 'text' : 'password'}
                placeholder="Your Joplin encryption password"
                value={joplinForm.joplin_master_password}
                onChange={(e) => setJoplinForm(f => ({ ...f, joplin_master_password: e.target.value }))}
                className="font-mono text-sm"
              />
              <Button type="button" variant="outline" size="sm" onClick={() => setShowMasterPassword(s => !s)}>
                {showMasterPassword ? 'Hide' : 'Show'}
              </Button>
            </div>
          </div>

          {joplinStatus && (
            <p className={`text-xs px-3 py-2 rounded border ${joplinStatus.connected ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
              {joplinStatus.connected ? '✓ ' : '✗ '}{joplinStatus.message}
            </p>
          )}

          <div className="flex gap-2">
            <Button size="sm" variant="outline" onClick={handleJoplinTest} disabled={joplinTesting || joplinSaving}>
              {joplinTesting ? 'Testing…' : 'Test Connection'}
            </Button>
            <Button size="sm" onClick={handleJoplinSave} disabled={joplinSaving || joplinTesting}>
              {joplinSaving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );


};

export default UserProfile;
