import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { Aurora } from './UI/Aurora';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  // Don't flash the login page while the stored token is still being checked.
  if (loading) {
    return (
      <div className="relative grid min-h-screen place-items-center">
        <Aurora variant="subtle" />
        <div className="flex flex-col items-center gap-4">
          <span className="h-9 w-9 animate-spin rounded-full border-2 border-hairline border-t-brand-500" />
          <p className="text-sm text-text-muted">Restoring your session…</p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Remember where they were headed so login can send them back.
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
