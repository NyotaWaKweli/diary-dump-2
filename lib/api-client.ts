// Secure API client - ALL requests go through Vercel API routes
// Never calls Supabase directly for writes

const API_BASE = process.env.NEXT_PUBLIC_APP_URL || '';

function getAuthHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('diarydump_token') : null;
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const res = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
      ...options.headers,
    },
  });

  const data = await res.json().catch(() => ({ error: 'Invalid response' }));

  if (!res.ok) {
    throw new Error(data.error || 'Request failed');
  }

  return data;
}

// Auth APIs
export const authApi = {
  register: (username: string, password: string, recoveryPin: string) =>
    apiRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, password, recoveryPin }),
    }),

  login: (username: string, password: string) =>
    apiRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    }),

  checkUsername: (username: string) =>
    apiRequest(`/api/auth/check-username?username=${encodeURIComponent(username)}`),

  verifyRecovery: (username: string, recoveryPin: string) =>
    apiRequest('/api/auth/recovery', {
      method: 'PUT',
      body: JSON.stringify({ username, recoveryPin }),
    }),

  resetPassword: (userId: string, newPassword: string) =>
    apiRequest('/api/auth/recovery', {
      method: 'PATCH',
      body: JSON.stringify({ userId, newPassword }),
    }),
};

// Diary APIs
export const diaryApi = {
  getAll: (params?: Record<string, string>) => {
    const query = params ? '?' + new URLSearchParams(params).toString() : '';
    return apiRequest(`/api/diaries${query}`);
  },

  create: (data: any) =>
    apiRequest('/api/diaries', { method: 'POST', body: JSON.stringify(data) }),

  update: (data: any) =>
    apiRequest('/api/diaries', { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiRequest(`/api/diaries?id=${id}`, { method: 'DELETE' }),
};

// Comment APIs
export const commentApi = {
  getByDiary: (diaryId: string) =>
    apiRequest(`/api/comments?diaryId=${diaryId}`),

  create: (data: any) =>
    apiRequest('/api/comments', { method: 'POST', body: JSON.stringify(data) }),

  delete: (id: string) =>
    apiRequest(`/api/comments?id=${id}`, { method: 'DELETE' }),
};

// Bookmark APIs
export const bookmarkApi = {
  getAll: () => apiRequest('/api/bookmarks'),
  toggle: (diaryId: string) =>
    apiRequest('/api/bookmarks', { method: 'POST', body: JSON.stringify({ diaryId }) }),
};

// Notification APIs
export const notificationApi = {
  getAll: (unreadOnly?: boolean) =>
    apiRequest(`/api/notifications${unreadOnly ? '?unread=true' : ''}`),

  markRead: (id?: string) =>
    apiRequest('/api/notifications', {
      method: 'PATCH',
      body: JSON.stringify(id ? { id } : {}),
    }),

  clearAll: () =>
    apiRequest('/api/notifications', { method: 'DELETE' }),
};

// Profile APIs
export const profileApi = {
  get: () => apiRequest('/api/profile'),
  update: (data: any) =>
    apiRequest('/api/profile', { method: 'PATCH', body: JSON.stringify(data) }),
  updatePassword: (newPassword: string) =>
    apiRequest('/api/profile', { method: 'PUT', body: JSON.stringify({ newPassword }) }),
  deleteAccount: () =>
    apiRequest('/api/profile', { method: 'DELETE' }),
};

// Upload API
export const uploadApi = {
  avatar: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiRequest('/api/upload', {
      method: 'POST',
      body: formData,
      headers: {}, // Let browser set content-type for FormData
    });
  },
};

// Blocked Users APIs
export const blockedApi = {
  getAll: () => apiRequest('/api/blocked'),
  block: (username: string) =>
    apiRequest('/api/blocked', { method: 'POST', body: JSON.stringify({ username }) }),
  unblock: (id: string) =>
    apiRequest(`/api/blocked?id=${id}`, { method: 'DELETE' }),
};

// Settings APIs
export const settingsApi = {
  get: () => apiRequest('/api/settings'),
  update: (data: any) =>
    apiRequest('/api/settings', { method: 'PATCH', body: JSON.stringify(data) }),
};

// Views API (batch increment)
export const viewsApi = {
  batch: (diaryIds: string[]) =>
    apiRequest('/api/views', { method: 'POST', body: JSON.stringify({ diaryIds }) }),
};

// Token management
export function setToken(token: string) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('diarydump_token', token);
  }
}

export function clearToken() {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('diarydump_token');
  }
}

export function getToken() {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('diarydump_token');
  }
  return null;
}
