import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore, homePath } from '../store/authStore';
import { jwtDecode } from 'jwt-decode';

function isTokenValid(token) {
  if (!token) return false;
  try {
    const decoded = jwtDecode(token);
    if (decoded.exp && decoded.exp * 1000 < Date.now()) {
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

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
