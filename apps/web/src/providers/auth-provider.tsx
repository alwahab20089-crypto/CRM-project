import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import { toast } from 'sonner';
import {
  ApiError,
  refreshSession,
  setAccessToken,
  setActiveOrganizationId,
  setSessionExpiredHandler,
} from '@/lib/api-client';
import { queryClient } from '@/lib/query-client';
import { authService } from '@/services/auth-service';
import type { User } from '@/types';
import type { MembershipSummary, MeResponse } from '@/types/auth';

/**
 * Session state backed by the real API.
 * - The access token lives in memory only (api-client). The refresh token is an httpOnly cookie JS cannot read.
 * - A non-sensitive hint flag says "a session probably exists" so signed-out visitors skip a pointless refresh call.
 * - Frontend route guards are UX only. The backend is the authority.
 */
const HINT_KEY = 'ef-session-hint';
const hasHint = () => localStorage.getItem(HINT_KEY) === '1' || sessionStorage.getItem(HINT_KEY) === '1';
const setHint = (remember: boolean) => (remember ? localStorage : sessionStorage).setItem(HINT_KEY, '1');
const clearHint = () => {
  localStorage.removeItem(HINT_KEY);
  sessionStorage.removeItem(HINT_KEY);
};

type Status = 'loading' | 'authenticated' | 'unauthenticated';

interface SessionState {
  status: Status;
  user: User | null;
  organizations: MembershipSummary[];
  activeOrganizationId: string | null;
}

const SIGNED_OUT: SessionState = { status: 'unauthenticated', user: null, organizations: [], activeOrganizationId: null };

function fromMe(me: MeResponse): SessionState {
  const active = me.current?.organization._id ?? me.organizations[0]?.organization._id ?? null;
  setActiveOrganizationId(active);
  return { status: 'authenticated', user: me.user, organizations: me.organizations, activeOrganizationId: active };
}

interface AuthContextValue extends SessionState {
  isAuthenticated: boolean;
  activeMembership: MembershipSummary | null;
  login: (values: { email: string; password: string; remember: boolean }) => Promise<void>;
  register: (values: { name: string; email: string; password: string; organizationName: string }) => Promise<void>;
  logout: () => Promise<void>;
  switchOrganization: (organizationId: string) => Promise<void>;
  reloadSession: () => Promise<void>;
  can: (permission: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<SessionState>({ ...SIGNED_OUT, status: 'loading' });

  // Restore the session on page load: refresh (cookie) -> /auth/me.
  useEffect(() => {
    let cancelled = false;
    async function bootstrap() {
      if (!hasHint()) {
        setSession(SIGNED_OUT);
        return;
      }
      try {
        await refreshSession();
        const me = await authService.me();
        if (!cancelled) setSession(fromMe(me));
      } catch (err) {
        setAccessToken(null);
        if (err instanceof ApiError && err.status === 401) clearHint();
        else toast.error('Could not reach the server. Please try again.');
        if (!cancelled) setSession(SIGNED_OUT);
      }
    }
    void bootstrap();
    return () => {
      cancelled = true;
    };
  }, []);

  // When a refresh fails with 401 anywhere in the app, end the session cleanly.
  useEffect(() => {
    setSessionExpiredHandler(() => {
      setAccessToken(null);
      clearHint();
      queryClient.clear();
      setSession(SIGNED_OUT);
      toast.error('Your session has expired. Please sign in again.');
    });
    return () => setSessionExpiredHandler(null);
  }, []);

  const startSession = useCallback(async (accessToken: string, remember: boolean) => {
    setAccessToken(accessToken);
    setHint(remember);
    setSession(fromMe(await authService.me()));
  }, []);

  const login = useCallback<AuthContextValue['login']>(
    async (values) => {
      const result = await authService.login(values);
      await startSession(result.accessToken, values.remember);
    },
    [startSession],
  );

  const register = useCallback<AuthContextValue['register']>(
    async (values) => {
      const result = await authService.register(values);
      await startSession(result.accessToken, true);
    },
    [startSession],
  );

  const logout = useCallback(async () => {
    try {
      await authService.logout();
    } catch {
      /* the local session is cleared regardless */
    }
    setAccessToken(null);
    setActiveOrganizationId(null);
    clearHint();
    queryClient.clear(); // never leave one account's cached data around for the next
    setSession(SIGNED_OUT);
  }, []);

  const switchOrganization = useCallback(async (organizationId: string) => {
    const membership = await authService.switchOrganization(organizationId); // server re-verifies membership
    setActiveOrganizationId(membership.organization._id);
    setSession((prev) => ({
      ...prev,
      activeOrganizationId: membership.organization._id,
      organizations: prev.organizations.map((m) => (m.organization._id === organizationId ? membership : m)),
    }));
    await queryClient.invalidateQueries();
  }, []);

  const reloadSession = useCallback(async () => {
    setSession(fromMe(await authService.me()));
  }, []);

  const value = useMemo<AuthContextValue>(() => {
    const activeMembership = session.organizations.find((m) => m.organization._id === session.activeOrganizationId) ?? null;
    return {
      ...session,
      isAuthenticated: session.status === 'authenticated',
      activeMembership,
      login,
      register,
      logout,
      switchOrganization,
      reloadSession,
      can: (permission) => activeMembership?.permissions.includes(permission) ?? false,
    };
  }, [session, login, register, logout, switchOrganization, reloadSession]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}