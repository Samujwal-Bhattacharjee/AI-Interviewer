/**
 * src/contexts/AuthContext.tsx — Phase 4: Role-Based Authentication Context.
 * Manages global user state, role transitions, and clean mock auth lifecycle.
 */

import React, { createContext, useState, useCallback } from 'react';
import { authService, type AuthUser } from '../services/authService';

export interface AuthContextType {
  user: AuthUser | null;
  role: 'student' | 'faculty' | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password?: string, requestedRole?: 'student' | 'faculty') => Promise<AuthUser>;
  demoLogin: (role: 'student' | 'faculty') => Promise<AuthUser>;
  logout: () => Promise<void>;
  getCurrentUser: () => AuthUser | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(() => authService.getCurrentUser());
  const [isLoading, setIsLoading] = useState(false);

  const login = useCallback(
    async (email: string, password?: string, requestedRole?: 'student' | 'faculty'): Promise<AuthUser> => {
      setIsLoading(true);
      try {
        const loggedUser = await authService.login(email, password, requestedRole);
        setUser(loggedUser);
        return loggedUser;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const demoLogin = useCallback(async (role: 'student' | 'faculty'): Promise<AuthUser> => {
    setIsLoading(true);
    try {
      const loggedUser = await authService.demoLogin(role);
      setUser(loggedUser);
      return loggedUser;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getCurrentUser = useCallback(() => {
    return user ?? authService.getCurrentUser();
  }, [user]);

  return (
    <AuthContext.Provider
      value={{
        user,
        role: user?.role ?? null,
        isAuthenticated: !!user,
        isLoading,
        login,
        demoLogin,
        logout,
        getCurrentUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export type { AuthUser };
