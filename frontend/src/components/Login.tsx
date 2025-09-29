import React, { useState } from 'react';
import { authApi, LoginRequest } from '../services/api';

interface LoginProps {
  onLogin: (token: string) => void;
  onError: (error: string) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onError }) => {
  const [loginType, setLoginType] = useState<'email' | 'username'>('email');
  const [credentials, setCredentials] = useState({
    email: '',
    username: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let response;
      if (loginType === 'email') {
        response = await authApi.login({
          email: credentials.email,
          password: credentials.password
        });
      } else {
        response = await authApi.loginUsername({
          username: credentials.username,
          password: credentials.password
        });
      }

  // Store token under multiple keys for compatibility
  localStorage.setItem('authToken', response.access_token);
  localStorage.setItem('access_token', response.access_token);
  localStorage.setItem('token', response.access_token);
  onLogin(response.access_token);
    } catch (error) {
      console.error('Login error:', error);
      onError('Invalid credentials. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setCredentials(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Sign in to TNIFMC Lead Management
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Investment tracking and lead management system
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            {/* Login Type Toggle */}
            <div className="mb-4">
              <div className="flex rounded-md border border-gray-300">
                <button
                  type="button"
                  className={`flex-1 py-2 px-4 text-sm font-medium rounded-l-md transition-colors ${
                    loginType === 'email'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setLoginType('email')}
                >
                  Email
                </button>
                <button
                  type="button"
                  className={`flex-1 py-2 px-4 text-sm font-medium rounded-r-md transition-colors ${
                    loginType === 'username'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 hover:bg-gray-50'
                  }`}
                  onClick={() => setLoginType('username')}
                >
                  Username
                </button>
              </div>
            </div>

            {/* Email/Username Input */}
            <div>
              <label htmlFor={loginType} className="sr-only">
                {loginType === 'email' ? 'Email address' : 'Username'}
              </label>
              <input
                id={loginType}
                name={loginType}
                type={loginType === 'email' ? 'email' : 'text'}
                autoComplete="off"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder={loginType === 'email' ? 'Email address' : 'Username'}
                value={loginType === 'email' ? credentials.email : credentials.username}
                onChange={(e) => handleInputChange(loginType, e.target.value)}
              />
            </div>

            {/* Password Input */}
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="off"
                required
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
                value={credentials.password}
                onChange={(e) => handleInputChange('password', e.target.value)}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg className="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                </svg>
              )}
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Login;