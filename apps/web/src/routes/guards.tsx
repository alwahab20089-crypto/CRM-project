import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { FullPageLoader } from '@/components/common/full-page-loader';
import { useAuth } from '@/providers/auth-provider';

/**
 * UI-only guards for navigation. They are NOT security: every API call is authorized by the backend.
 */
export function RequireAuth() {
  const { status } = useAuth();
  const location = useLocation();
  if (status === 'loading') return <FullPageLoader label="Restoring your session…" />;
  if (status === 'unauthenticated') {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  }
  return <Outlet />;
}

export function PublicOnly() {
  const { status } = useAuth();
  if (status === 'loading') return <FullPageLoader />;
  if (status === 'authenticated') return <Navigate to="/app/dashboard" replace />;
  return <Outlet />;
}