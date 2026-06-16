import supabase from './supabase';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api/v1';

async function getHeaders() {
  const headers = {
    'Content-Type': 'application/json',
  };

  try {
    // Automatically fetch current Supabase session JWT and add it to request
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
      headers['Authorization'] = `Bearer ${session.access_token}`;
    } else {
      // In development fallback, add a dummy authorization header to bypass verification with backend mock
      headers['Authorization'] = 'Bearer dev-mock-token';
    }
  } catch (error) {
    console.error('Error fetching auth session for request headers:', error);
  }

  return headers;
}

export const api = {
  async get(path) {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'GET',
      headers,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(err.detail || 'API Request failed');
    }
    return response.json();
  },

  async post(path, body) {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(err.detail || 'API Request failed');
    }
    return response.json();
  },

  async put(path, body) {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(body),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(err.detail || 'API Request failed');
    }
    return response.json();
  },

  async delete(path) {
    const headers = await getHeaders();
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'DELETE',
      headers,
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(err.detail || 'API Request failed');
    }
    // Handle 204 No Content responses that have no body
    if (response.status === 204) {
      return null;
    }
    return response.json();
  },
};

export default api;
