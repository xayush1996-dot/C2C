const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "";

/**
 * Centrally manages cross-origin base URL resolution for all API requests.
 * Defaults to empty string to fallback to relative routing or Vite proxy during dev.
 */
export function apiFetch(path, options = {}) {
  const url = path.startsWith("http") ? path : `${API_BASE_URL}${path}`;
  return fetch(url, options);
}
