import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, homePath } from '../store/authStore';
import { isTokenValid } from '../utils/tokenUtils'; // Bug #6 — shared utility

export default function ProtectedRoute({ allowedRoles, children }) {
  const { token, role, logout } = useAuthStore();
  const location = useLocation();

  // Check token existence and validity
  if (!token || !isTokenValid(token)) {
    // Clear stale auth data if token is invalid
    if (token && !isTokenValid(token)) {
      logout();
    }
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Logged in but wrong role → redirect to their own dashboard
  if (allowedRoles && !allowedRoles.includes(role)) {
    return <Navigate to={homePath(role)} replace />;
  }

  return children;
}
