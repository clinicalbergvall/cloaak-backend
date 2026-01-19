const VITE_API_URL = import.meta.env.VITE_API_URL
const OVERRIDE_API_URL = typeof window !== 'undefined'
  ? (localStorage.getItem('apiOverride') || '')
  : ''


try {
  // Since we always use the production URL in production mode, this check is kept for awareness
  if (!VITE_API_URL && import.meta.env.MODE === 'production') {
      console.warn('VITE_API_URL environment variable is not set in production, but using hardcoded backend URL')
  }
  
  // Log a message in development mode to indicate which backend is being used
  if (import.meta.env.MODE === 'development' && !VITE_API_URL) {
      console.log('Using localhost backend for development')
  } else if (import.meta.env.MODE === 'development') {
      console.log('Using custom backend for development:', VITE_API_URL)
  }
} catch (error) {
  console.warn('Environment validation failed:', error);
}

// Detect if running in Capacitor environment
const isCapacitor = typeof (window as any).Capacitor !== 'undefined';

// In development mode, default to localhost if no API URL is set
const getDefaultBaseUrl = () => {
  if (OVERRIDE_API_URL) return OVERRIDE_API_URL;
  
  // For production mode, always use the production URL
  if (import.meta.env.MODE === 'production') {
    return 'https://clean-cloak-b.onrender.com';
  }
  
  // In development mode, use production backend by default but allow override with VITE_API_URL
  if (VITE_API_URL) return VITE_API_URL;
  return 'https://clean-cloak-b.onrender.com';
};

const BASE = getDefaultBaseUrl();

// For Capacitor apps, use the base URL without additional /api suffix as Capacitor handles the proxying
export const API_BASE_URL = isCapacitor ? BASE : (BASE.endsWith('/api') ? BASE : `${BASE}/api`)


export const getApiUrl = (endpoint: string): string => {
    // During development, use proxy to avoid CORS issues
    // In production, use the configured API URL
    const isDevMode = import.meta.env.MODE === 'development';
    if (isDevMode && !isCapacitor) {
        // Use relative paths during development to leverage Vite proxy
        // This avoids CORS issues when connecting to external or local backends
        // We MUST prepend /api to match the Vite proxy configuration
        const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
        return `/api${cleanEndpoint}`;
    }
    
    // For Capacitor, we don't add additional /api since the base URL handles it
    if (isCapacitor) {
        const cleanEndpoint = endpoint.startsWith('/api/') ? endpoint : `/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;
        return `${API_BASE_URL}${cleanEndpoint}`;
    }
    
    const base = API_BASE_URL.endsWith('/api') ? API_BASE_URL : `${API_BASE_URL}/api`
    const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`
    return `${base}${cleanEndpoint}`
}


if (import.meta.env.MODE === 'development') {
    console.log('API Configuration:', {
        mode: import.meta.env.MODE,
        apiUrl: API_BASE_URL,
        envVarSet: !!VITE_API_URL,
        overrideSet: !!OVERRIDE_API_URL
    })
}

export const setApiOverride = (url: string) => {
  try {
    const trimmed = url.trim()
    localStorage.setItem('apiOverride', trimmed)
    window.location.reload()
  } catch {}
}
