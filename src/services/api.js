/**
 * Paylog Frontend API Client
 */

async function request(endpoint, options = {}) {
  const url = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  const config = {
    ...options,
    headers,
    credentials: 'include', // Include session cookie on all requests
  };

  const response = await fetch(url, config);

  let data;
  const contentType = response.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg = data?.error?.message || `Request failed with status ${response.status}`;
    const error = new Error(errorMsg);
    error.status = response.status;
    error.code = data?.error?.code || 'UNKNOWN_ERROR';
    error.details = data?.error?.details || null;
    throw error;
  }

  return data;
}

export const api = {
  // Authentication
  auth: {
    me: () => request('/api/auth/me'),
    login: (email, password) => request('/api/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
    register: (name, email, password) => request('/api/auth/register', { method: 'POST', body: JSON.stringify({ name, email, password }) }),
    logout: () => request('/api/auth/logout', { method: 'POST' }),
    demo: () => request('/api/auth/demo', { method: 'POST' }),
  },

  // Profile & Settings
  profile: {
    get: () => request('/api/profile'),
    update: (profileData) => request('/api/profile', { method: 'PUT', body: JSON.stringify(profileData) }),
  },

  // Categories
  categories: {
    list: () => request('/api/categories'),
    create: (data) => request('/api/categories', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Personal Transactions
  transactions: {
    list: (params = {}) => {
      const q = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') q.set(k, String(v));
      });
      const qs = q.toString();
      return request(`/api/transactions${qs ? `?${qs}` : ''}`);
    },
    create: (data) => request('/api/transactions', { method: 'POST', body: JSON.stringify(data) }),
    delete: (id) => request(`/api/transactions/${id}`, { method: 'DELETE' }),
  },

  // Payment Attempts (UPI Workflow)
  paymentAttempts: {
    create: (data) => request('/api/payment-attempts', { method: 'POST', body: JSON.stringify(data) }),
    reportOutcome: (id, data) => request(`/api/payment-attempts/${id}/outcome`, { method: 'POST', body: JSON.stringify(data) }),
    listPending: () => request('/api/payment-attempts/pending'),
    retry: (id, data = {}) => request(`/api/payment-attempts/${id}/retry`, { method: 'POST', body: JSON.stringify(data) }),
  },

  // Groups & Shared Expenses
  groups: {
    list: () => request('/api/groups'),
    get: (id) => request(`/api/groups/${id}`),
    create: (data) => request('/api/groups', { method: 'POST', body: JSON.stringify(data) }),
    addExpense: (groupId, data) => request(`/api/groups/${groupId}/expenses`, { method: 'POST', body: JSON.stringify(data) }),
  },

  // Settlements
  settlements: {
    create: (data) => request('/api/settlements', { method: 'POST', body: JSON.stringify(data) }),
  },

  // Friends
  friends: {
    list: () => request('/api/friends'),
    sendRequest: (emailOrUsername) => request('/api/friends/request', { method: 'POST', body: JSON.stringify({ emailOrUsername }) }),
    respondRequest: (id, action) => request(`/api/friends/requests/${id}/respond`, { method: 'POST', body: JSON.stringify({ action }) }),
  },

  // Reports
  reports: {
    getSummary: (year, month) => request(`/api/reports/summary?year=${year}&month=${month}`),
    getExportCsvUrl: (startDate, endDate) => {
      const q = new URLSearchParams();
      if (startDate) q.set('startDate', startDate);
      if (endDate) q.set('endDate', endDate);
      const qs = q.toString();
      return `/api/reports/export-csv${qs ? `?${qs}` : ''}`;
    },
  },

  // Dashboard Overview
  dashboard: {
    get: () => request('/api/dashboard'),
  },
};
