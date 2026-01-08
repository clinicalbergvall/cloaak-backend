


const VITE_API_URL = import.meta.env.VITE_API_URL
const OVERRIDE_API_URL = typeof window !== 'undefined'
  ? (localStorage.getItem('apiOverride') || '')
  : ''


try {
  if (!VITE_API_URL && import.meta.env.MODE === 'production') {
      console.warn('VITE_API_URL environment variable is not set in production, using fallback')
  }
} catch (error) {
  console.warn('Environment validation failed:', error);
}

// Detect if running in Capacitor environment
const isCapacitor = typeof (window as any).Capacitor !== 'undefined';

const BASE = OVERRIDE_API_URL || VITE_API_URL || 'https://clean-cloak-b.onrender.com'

// For Capacitor apps, use the base URL without additional /api suffix as Capacitor handles the proxying
export const API_BASE_URL = isCapacitor ? BASE : (BASE.endsWith('/api') ? BASE : `${BASE}/api`)


export const getApiUrl = (endpoint: string): string => {
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
