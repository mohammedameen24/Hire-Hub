/**
 * Converts stored resume/file paths to full URLs.
 *
 * Bug #2 fixed — JWT token is NO LONGER appended to URLs as a query parameter.
 * Tokens in URLs end up in browser history, server logs, referrer headers, and
 * CDN logs. The axios instance already attaches Authorization: Bearer <token>
 * for API calls. For <a target="_blank"> links to local /api/files/ endpoints,
 * use openFileSecurely() below instead of a plain href.
 *
 * Handles two path formats:
 *   - Cloudinary: https://res.cloudinary.com/...  → returned as-is (public)
 *   - Local API:  /api/files/resume-xxx.pdf       → full backend URL (requires auth header via fetch)
 *   - Legacy:     /uploads/resume-xxx.pdf         → rewritten to /api/files/...
 */
export function getStorageUrl(path) {
  if (!path) return '';

  // External / Cloudinary URLs — already public, return as-is
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }

  const backendBase = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/api$/, '');

  // Rewrite legacy /uploads/ paths to go through the authenticated /api/files/ endpoint
  let rel = path.replace(/^\/uploads\//, '/api/files/');
  const cleanPath = rel.startsWith('/') ? rel : `/${rel}`;

  return `${backendBase}${cleanPath}`;
}

/**
 * Opens a local /api/files/ document securely in a new tab by fetching it
 * with the Authorization header and creating a temporary blob URL.
 * Use this for <button onClick> or programmatic file opens instead of
 * plain <a href={getStorageUrl(...)} target="_blank">.
 *
 * For Cloudinary URLs, falls back to a plain window.open since they are public.
 *
 * @param {string} path - raw path from DB (e.g. /api/files/resume-xxx.pdf)
 */
export async function openFileSecurely(path) {
  if (!path) return;

  const url = getStorageUrl(path);

  // Cloudinary / external URLs are public — open directly
  if (!url.includes('/api/files/')) {
    window.open(url, '_blank', 'noopener,noreferrer');
    return;
  }

  try {
    const { useAuthStore } = await import('../store/authStore');
    const token = useAuthStore.getState()?.token;

    const response = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const win = window.open(blobUrl, '_blank', 'noopener,noreferrer');

    // Revoke after a short delay to allow the browser to start loading
    setTimeout(() => URL.revokeObjectURL(blobUrl), 30000);

    if (!win) {
      // Popup blocked — fall back to same-tab navigation
      window.location.href = blobUrl;
    }
  } catch (err) {
    console.error('[openFileSecurely] Failed to open file:', err);
    // Last resort — open without auth (will get 401, but user sees an error rather than nothing)
    window.open(url, '_blank', 'noopener,noreferrer');
  }
}
