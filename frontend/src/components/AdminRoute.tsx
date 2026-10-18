import type { ReactNode } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

interface AdminRouteProps {
  children: ReactNode;
}

// Only users with the "admin" role can see the wrapped page.
// The role comes from AuthContext (refreshed from the API on load).
export default function AdminRoute({ children }: AdminRouteProps) {
  const { isAuthenticated, isAdmin, loading } = useAuth();

  if (!isAuthenticated) {
    return <Navigate to="/signin" replace />;
  }

  if (loading) {
    return <p className="muted-text">Checking your permissions...</p>;
  }

  if (!isAdmin) {
    return (
      <article className="content-panel access-denied">
        <h2>Access denied</h2>
        <p>You need an admin account to view this page.</p>
        <Link to="/" className="primary-button">
          Back to dashboard
        </Link>
      </article>
    );
  }

  return <>{children}</>;
}
