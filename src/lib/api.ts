import { API_BASE_URL } from './config';
import { logger } from './logger';
import { USER_SESSION_KEY } from './storage';



const getAuthHeaders = (): HeadersInit => {
  return {
    'Content-Type': 'application/json',
  };
};


const addCorsHeaders = (headers: HeadersInit = {}): HeadersInit => {
  
  
  return headers;
};


export const api = {
  get: async (endpoint: string, options: RequestInit = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`API GET Request to: ${url}`);
    try {
      const response = await fetch(url, {
        ...options,
        headers: addCorsHeaders({
          ...getAuthHeaders(),
          ...options.headers,
        }),
        credentials: 'include', 
      });
      console.log(`API GET Response from: ${url}`, response.status, response.statusText);
      if (response.status === 401) {
        
        localStorage.removeItem(USER_SESSION_KEY);
        
      }
      return response;
    } catch (error) {
      console.error(`API GET Request failed to: ${url}`, error);
      
      throw new Error(`Failed to fetch data: ${error instanceof Error ? error.message : 'Network error'}`);
    }
  },
  post: async (endpoint: string, data: Record<string, any>, options: RequestInit = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log(`API POST Request to: ${url}`, data);
    try {
      const response = await fetch(url, {
        ...options,
        method: 'POST',
        headers: addCorsHeaders({
          ...getAuthHeaders(),
          ...options.headers,
        }),
        credentials: 'include', 
        body: JSON.stringify(data),
      });
      console.log(`API POST Response from: ${url}`, response.status, response.statusText);
      if (response.status === 401) {
        localStorage.removeItem(USER_SESSION_KEY);
      }
      return response;
    } catch (error) {
      console.error(`API POST Request failed to: ${url}`, error);
      
      throw new Error(`Failed to submit data: ${error instanceof Error ? error.message : 'Network error'}`);
    }
  },
  put: async (endpoint: string, data: any, options: RequestInit = {}) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        method: 'PUT',
        headers: addCorsHeaders({
          ...getAuthHeaders(),
          ...options.headers,
        }),
        credentials: 'include', 
        body: JSON.stringify(data),
      });
      if (response.status === 401) {
        localStorage.removeItem(USER_SESSION_KEY);
      }
      return response;
    } catch (error) {
      console.error(`API PUT Request failed to: ${API_BASE_URL}${endpoint}`, error);
      
      throw new Error(`Failed to update data: ${error instanceof Error ? error.message : 'Network error'}`);
    }
  },
  delete: async (endpoint: string, options: RequestInit = {}) => {
    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        method: 'DELETE',
        headers: addCorsHeaders({
          ...getAuthHeaders(),
          ...options.headers,
        }),
        credentials: 'include', 
      });
      if (response.status === 401) {
        localStorage.removeItem(USER_SESSION_KEY);
      }
      return response;
    } catch (error) {
      console.error(`API DELETE Request failed to: ${API_BASE_URL}${endpoint}`, error);
      
      throw new Error(`Failed to delete data: ${error instanceof Error ? error.message : 'Network error'}`);
    }
  },
};


export const authAPI = {
  login: async (identifier: string, password: string): Promise<any> => {
    try {
      const response = await api.post('/auth/login', { identifier, password });
      const data = await response.json();

      if (data.success) {
        
        localStorage.setItem(USER_SESSION_KEY, JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      logger.error('API Error /auth/login', error instanceof Error ? error : undefined);
      throw error;
    }
  },

  register: async (userData: any) => {
    try {
      const response = await api.post('/auth/register', userData);
      const data = await response.json();

      if (data.success) {
        
        localStorage.setItem(USER_SESSION_KEY, JSON.stringify(data.user));
      }

      return data;
    } catch (error) {
      logger.error('API Error /auth/register', error instanceof Error ? error : undefined);
      throw error;
    }
  },

  getProfile: async () => {
    try {
      const response = await api.get('/auth/me');
      const data = await response.json();
      return data;
    } catch (error) {
      logger.error('API Error /auth/profile', error instanceof Error ? error : undefined);
      throw error;
    }
  },

  logout: async () => {
    try {
      await api.post('/auth/logout', {});
      localStorage.removeItem(USER_SESSION_KEY);
      logger.info('User logged out');
    } catch (error) {
      logger.error('Logout error', error instanceof Error ? error : undefined);
    }
  }
};


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
