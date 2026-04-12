import React, { useState } from 'react';
import { Loader2, Lock } from 'lucide-react';
import { authApi } from '../services/api';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { cn } from '../lib/utils';

interface LoginProps {
  onLogin: (token: string) => void;
  onError: (error: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onError }) => {
  const [loginType, setLoginType] = useState<'email' | 'username'>('email');
  const [credentials, setCredentials] = useState({ email: '', username: '', password: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response =
        loginType === 'email'
          ? await authApi.login({ email: credentials.email, password: credentials.password })
          : await authApi.loginUsername({ username: credentials.username, password: credentials.password });
      localStorage.setItem('authToken', response.access_token);
      localStorage.setItem('access_token', response.access_token);
      localStorage.setItem('token', response.access_token);
      onLogin(response.access_token);
    } catch (error) {
      onError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold">Niveshya CRM</CardTitle>
          <CardDescription>Investment tracking &amp; lead management</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Login type toggle */}
            <div className="flex rounded-md border border-input overflow-hidden">
              {(['email', 'username'] as const).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setLoginType(type)}
                  className={cn(
                    'flex-1 py-2 text-sm font-medium capitalize transition-colors',
                    loginType === type
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-background text-muted-foreground hover:bg-muted'
                  )}
                >
                  {type}
                </button>
              ))}
            </div>

            <div className="space-y-2">
              <Label htmlFor={loginType}>
                {loginType === 'email' ? 'Email address' : 'Username'}
              </Label>
              <Input
                id={loginType}
                type={loginType === 'email' ? 'email' : 'text'}
                autoComplete="off"
                required
                placeholder={loginType === 'email' ? 'you@example.com' : 'your_username'}
                value={loginType === 'email' ? credentials.email : credentials.username}
                onChange={(e) =>
                  setCredentials((prev) => ({ ...prev, [loginType]: e.target.value }))
                }
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                autoComplete="off"
                required
                placeholder="••••••••"
                value={credentials.password}
                onChange={(e) => setCredentials((prev) => ({ ...prev, password: e.target.value }))}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;

