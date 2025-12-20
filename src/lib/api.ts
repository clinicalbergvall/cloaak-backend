import { API_BASE_URL } from './config';
import { logger } from './logger';
// Cookies are the primary auth mechanism; avoid bearer tokens

// Helper to get auth headers
const getAuthHeaders = (): HeadersInit => {
  return {
    'Content-Type': 'application/json',
  };
};

// Helper to add CORS headers to requests
const addCorsHeaders = (headers: HeadersInit = {}): HeadersInit => {
  // CORS headers should be set by the server, not the client
  // Returning headers as-is to avoid CORS issues
  return headers;
};

// Simple fetch API wrapper
export const api = {
  get: async (endpoint: string, options: RequestInit = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`API GET Request to: ${url}`);
    const response = await fetch(url, {
      ...options,
      headers: addCorsHeaders({
        ...getAuthHeaders(),
        ...options.headers,
      }),
      credentials: 'include', // Send cookies
    });
    console.log(`API GET Response from: ${url}`, response.status, response.statusText);
    if (response.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('clean-cloak-user-session');
      // Optional: Redirect to login or show modal
    }
    return response;
  },
  post: async (endpoint: string, data: Record<string, any>, options: RequestInit = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`API POST Request to: ${url}`, data);
    const response = await fetch(url, {
      ...options,
      method: 'POST',
      headers: addCorsHeaders({
        ...getAuthHeaders(),
        ...options.headers,
      }),
      credentials: 'include', // Send cookies
      body: JSON.stringify(data),
    });
    console.log(`API POST Response from: ${url}`, response.status, response.statusText);
    if (response.status === 401) {
      localStorage.removeItem('clean-cloak-user-session');
    }
    return response;
  },
  put: async (endpoint: string, data: any, options: RequestInit = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      method: 'PUT',
      headers: addCorsHeaders({
        ...getAuthHeaders(),
        ...options.headers,
      }),
      credentials: 'include', // Send cookies
      body: JSON.stringify(data),
    });
    if (response.status === 401) {
      localStorage.removeItem('clean-cloak-user-session');
    }
    return response;
  },
  delete: async (endpoint: string, options: RequestInit = {}) => {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      method: 'DELETE',
      headers: addCorsHeaders({
        ...getAuthHeaders(),
        ...options.headers,
      }),
      credentials: 'include', // Send cookies
    });
    if (response.status === 401) {
      localStorage.removeItem('clean-cloak-user-session');
    }
    return response;
  },
};

// Authentication APIs
export const authAPI = {
  login: async (identifier: string, password: string): Promise<any> => {
    try {
      const response = await api.post('/auth/login', { identifier, password });
      const data = await response.json();

      if (data.success) {
        // Token is now in httpOnly cookie
        localStorage.setItem('clean-cloak-user-session', JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      logger.error('API Error /auth/login', error);
      throw error;
    }
  },

  register: async (userData: any) => {
    try {
      const response = await api.post('/auth/register', userData);
      const data = await response.json();

      if (data.success) {
        // Token is now in httpOnly cookie
        localStorage.setItem('clean-cloak-user-session', JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      logger.error('API Error /auth/register', error);
      throw error;
    }
  },

  getProfile: async () => {
    try {
      const response = await api.get('/auth/me');
      const data = await response.json();
      return data;
    } catch (error) {
      logger.error('API Error /auth/profile', error);
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout', {});
      localStorage.removeItem('clean-cloak-user-session');
      logger.info('User logged out');
    } catch (error) {
      logger.error('Logout error', error);
    }
  }
};

// Admin APIs
export const adminAPI = {
  getPendingCleaners: async () => {
    const response = await api.get('/verification/pending-profiles');
    const data = await response.json();
    return data;
  },

  approveCleaner: async (profileId: string, notes: string) => {
    const response = await api.put(`/verification/approve-profile/${profileId}`, { adminNotes: notes });
    const data = await response.json();
    return data;
  },

  rejectCleaner: async (profileId: string, reason: string, notes: string) => {
    const response = await api.put(`/verification/reject-profile/${profileId}`, { rejectionReason: reason, adminNotes: notes });
    const data = await response.json();
    return data;
  },

  getDashboard: async () => {
    const response = await api.get('/admin/dashboard');
    const data = await response.json();
    return data;
  },

  getUsers: async () => {
    const response = await api.get('/admin/users');
    const data = await response.json();
    return data;
  }
};

export default api;
