import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface User {
  id: string;
  name: string;
  email: string;
  role_names: string[];
}

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  user: User | null;
  login: (token: string) => void;
  logout: () => Promise<void> | void;
  loading: boolean;
  hasRole: (roleName: string) => boolean;
  hasAnyRole: (roleNames: string[]) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      // Check for stored token on app startup
      const storedToken = localStorage.getItem('authToken');
      if (storedToken) {
        setToken(storedToken);
        // Fetch user information
        try {
          const response = await fetch('/api/auth/me', {
            headers: {
              'Authorization': `Bearer ${storedToken}`
            }
          });
          if (response.ok) {
            const userData = await response.json();
            setUser(userData);
          } else {
            // Token is invalid, remove it
            localStorage.removeItem('authToken');
            setToken(null);
          }
        } catch (error) {
          console.error('Error fetching user data:', error);
          localStorage.removeItem('authToken');
          setToken(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (newToken: string) => {
    setToken(newToken);
    localStorage.setItem('authToken', newToken);
    
    // Fetch user information after login
    try {
      const response = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${newToken}`
        }
      });
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      }
    } catch (error) {
      console.error('Error fetching user data after login:', error);
    }
  };

  const logout = async () => {
    // Allow components to veto logout during sensitive operations (e.g., recording)
    const vetoEvent = new CustomEvent('app:before-logout', { cancelable: true });
    const notBlocked = window.dispatchEvent(vetoEvent);
    if (!notBlocked) {
      // Logout prevented
      return;
    }
    setToken(null);
    setUser(null);
    localStorage.removeItem('authToken');
  };

  const hasRole = (roleName: string): boolean => {
    return user?.role_names?.includes(roleName) || false;
  };

  const hasAnyRole = (roleNames: string[]): boolean => {
    return roleNames.some(roleName => hasRole(roleName));
  };

  const value: AuthContextType = {
    isAuthenticated: !!token,
    token,
    user,
    login,
    logout,
    loading,
    hasRole,
    hasAnyRole
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};