/**
 * Shared JWT token validation utility.
 * Bug #6 — was copy-pasted in authStore.js, ProtectedRoute.jsx, and Login.jsx.
 * Single source of truth: import from here everywhere.
 */
import { jwtDecode } from 'jwt-decode';

export function isTokenValid(token) {
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
