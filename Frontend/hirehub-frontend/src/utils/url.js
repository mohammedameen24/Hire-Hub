import { useAuthStore } from '../store/authStore';

/**
 * Converts stored resume/file paths to full authenticated API URLs.
 *
 * Handles two formats:
 *   - New: /api/files/resume-xxx.pdf  → served via authenticated endpoint
 *   - Legacy: /uploads/resume-xxx.pdf → rewritten to /api/files/resume-xxx.pdf
 */
export function getStorageUrl(path) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const backendBase = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/api$/, '');

  // Rewrite legacy /uploads/ paths to go through the authenticated /api/files/ endpoint
  const normalizedPath = path.replace(/^\/uploads\//, '/api/files/');

  const cleanPath = normalizedPath.startsWith('/') ? normalizedPath : `/${normalizedPath}`;
  let fullUrl = `${backendBase}${cleanPath}`;

  // Attach auth token if available so direct browser links (<a> tags) pass auth
  const token = useAuthStore.getState()?.token;
  if (token && !fullUrl.includes('token=')) {
    const separator = fullUrl.includes('?') ? '&' : '?';
    fullUrl = `${fullUrl}${separator}token=${encodeURIComponent(token)}`;
  }

  return fullUrl;
}

