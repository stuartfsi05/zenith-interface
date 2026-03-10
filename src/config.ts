export const config = {
  // Uses Vite's environment variables. Fallback to localhost if not set.
  apiBaseUrl: import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000',
};
