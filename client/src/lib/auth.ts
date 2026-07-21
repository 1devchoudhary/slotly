import { createContext, useContext } from 'react';
import type { AuthUser } from './api';

export interface AuthContextValue {
  user: AuthUser | null;
  /** True until the stored token has been validated against /auth/me. */
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextValue | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
