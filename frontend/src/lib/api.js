const getApiBaseUrl = () => {
  if (import.meta.env.VITE_API_BASE_URL) {
    return import.meta.env.VITE_API_BASE_URL;
  }
  // Self-healing fallback: if hosted on vercel.app, automatically point to Render backend
  if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
    return 'https://con2c.onrender.com';
  }
  return '';
};

const API_BASE_URL = getApiBaseUrl();

/**
 * Centrally manages cross-origin base URL resolution for all API requests.
 * Defaults to empty string to fallback to relative routing or Vite proxy during dev.
 */
export function apiFetch(path, options = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  return fetch(url, options);
}
