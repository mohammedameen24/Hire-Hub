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

  const backendBase = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/api$/, '');

  // Normalize to a backend-relative API path.
  let rel;
  if (path.startsWith('http://') || path.startsWith('https://')) {
    // Absolute URL pointing at our own backend — keep routing it through the
    // authenticated /api/files endpoint so the token gets attached below.
    // External URLs (e.g. Cloudinary) are public and returned untouched.
    if (path.startsWith(`${backendBase}/`)) {
      rel = path.slice(backendBase.length);
    } else {
      return path;
    }
  } else {
    rel = path;
  }

  // Rewrite legacy /uploads/ paths to go through the authenticated /api/files/ endpoint
  rel = rel.replace(/^\/uploads\//, '/api/files/');

  const cleanPath = rel.startsWith('/') ? rel : `/${rel}`;
  let fullUrl = `${backendBase}${cleanPath}`;

  // Attach auth token if available so direct browser links (<a> tags) pass auth
  const token = useAuthStore.getState()?.token;
  if (token && !fullUrl.includes('token=')) {
    const separator = fullUrl.includes('?') ? '&' : '?';
    fullUrl = `${fullUrl}${separator}token=${encodeURIComponent(token)}`;
  }

  return fullUrl;
}

