// ============================================================================
// Auth Context — React context for auth state
// ============================================================================

import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import type { UserInfo } from '@/types';
import { getCurrentUser, loginAs, logout as mockLogout, MOCK_USERS } from './mock-auth';

export interface AuthContextType {
  user: UserInfo | null;
  isAuthenticated: boolean;
  login: (role: string) => void;
  logout: () => void;
  switchRole: (role: string) => void;
  availableUsers: UserInfo[];
}

export const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  login: () => {},
  logout: () => {},
  switchRole: () => {},
  availableUsers: MOCK_USERS,
});

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<UserInfo | null>(getCurrentUser);

  useEffect(() => {
    if (user) {
      localStorage.setItem('vdbas_auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('vdbas_auth_user');
    }
  }, [user]);

  const login = useCallback((role: string) => {
    const loggedInUser = loginAs(role);
    setUser(loggedInUser);
  }, []);

  const logout = useCallback(() => {
    mockLogout();
    setUser(null);
  }, []);

  const switchRole = useCallback(
    (role: string) => {
      const newUser = loginAs(role);
      setUser(newUser);
    },
    []
  );

  const value = useMemo<AuthContextType>(
    () => ({
      user,
      isAuthenticated: user !== null,
      login,
      logout,
      switchRole,
      availableUsers: MOCK_USERS,
    }),
    [user, login, logout, switchRole]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
