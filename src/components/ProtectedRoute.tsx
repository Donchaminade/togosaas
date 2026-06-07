import type * as React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from './ui/Spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  /** Si true, exige le role admin. */
  requireAdmin?: boolean;
}

export default function ProtectedRoute({ children, requireAdmin = false }: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <PageLoader label="Vérification de la session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/connexion" state={{ from: location.pathname }} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/espace-lead" replace />;
  }

  // Empeche un admin d'utiliser l'espace lead (et inversement).
  if (!requireAdmin && isAdmin && location.pathname.startsWith('/espace-lead')) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}
