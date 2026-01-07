/**
 * API Base URL - Uses environment variable or falls back to empty string
 * (frontend is relative to same host, backend URL comes from process.env)
 */
export const getApiBaseUrl = (): string => {
  // In browser, this will use the NEXT_PUBLIC_API_URL if set
  // Otherwise empty string for same-origin requests
  if (typeof window !== 'undefined') {
    return process.env.NEXT_PUBLIC_API_URL || '';
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


