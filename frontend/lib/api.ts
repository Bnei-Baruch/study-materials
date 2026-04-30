/**
 * API Base URL - Uses environment variable or falls back to empty string
 * (frontend is relative to same host, backend URL comes from process.env)
 */
export const getApiBaseUrl = (): string => {
  // Browser requests always use same-origin so they go through the Next.js proxy.
  // The proxy rewrites /api/* to the backend on the Docker internal network,
  // which satisfies the backend's trusted-IP check without needing an API key.
  if (typeof window !== 'undefined') {
    return '';
  }

  // On server-side, use the backend URL from environment
  return process.env.API_BACKEND_URL || 'http://localhost:8080';
};

/**
 * Helper to construct full API endpoint URL
 */
export const getApiUrl = (endpoint: string): string => {
  const baseUrl = getApiBaseUrl();
  if (!baseUrl) {
    // Same origin - just return the endpoint
    return `/api${endpoint}`;
  }
  // Different origin - use full URL
  return `${baseUrl}/api${endpoint}`;
};





