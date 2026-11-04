import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

/**
 * FRONTEND-ONLY MOCK SESSION. This is NOT security.
 * It stores a harmless flag so route guards can be demonstrated.
 * Phase 3 replaces it with real auth: in-memory access token + httpOnly refresh cookie,
 * and the backend remains the only authority on who may do what.
 * No passwords are ever stored here.
 */
const SESSION_KEY = 'ef-mock-session';

interface AuthContextValue {
  isAuthenticated: boolean;
  signIn: (remember: boolean) => void;
  signOut: () => void;
  activeOrganizationId: string;
  setActiveOrganizationId: (id: string) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const hasSession = () =>
  sessionStorage.getItem(SESSION_KEY) === '1' || localStorage.getItem(SESSION_KEY) === '1';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isAuthenticated, setAuthenticated] = useState(hasSession);
  const [activeOrganizationId, setActiveOrganizationId] = useState('org_001');

  const signIn = useCallback((remember: boolean) => {
    (remember ? localStorage : sessionStorage).setItem(SESSION_KEY, '1');
    setAuthenticated(true);
  }, []);

  const signOut = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY);
    localStorage.removeItem(SESSION_KEY);
    setAuthenticated(false);
  }, []);

  const value = useMemo(
    () => ({ isAuthenticated, signIn, signOut, activeOrganizationId, setActiveOrganizationId }),
    [isAuthenticated, signIn, signOut, activeOrganizationId],
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}