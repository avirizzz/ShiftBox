const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

async function request(url, options = {}) {
  const token = localStorage.getItem('supabase.auth.token');
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {

  getProjects: () => request(`${API_URL}/projects`),
  createProject: (data) => request(`${API_URL}/projects`, { method: 'POST', body: JSON.stringify(data) }),

  getCategories: () => request(`${API_URL}/categories`),
  createCategory: (data) => request(`${API_URL}/categories`, { method: 'POST', body: JSON.stringify(data) }),
  updateCategory: (id, data) => request(`${API_URL}/categories/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteCategory: (id) => request(`${API_URL}/categories/${id}`, { method: 'DELETE' }),

  getBoxes: (categoryId) => {
    const url = categoryId ? `${API_URL}/boxes?categoryId=${categoryId}` : `${API_URL}/boxes`;
    return request(url);
  },
  getBox: (id) => request(`${API_URL}/boxes/${id}`),
  generateBoxes: (categoryId, count = 12) => request(`${API_URL}/boxes/generate`, { method: 'POST', body: JSON.stringify({ categoryId, count }) }),
  createStandaloneItem: (categoryId, itemName) => request(`${API_URL}/items`, { method: 'POST', body: JSON.stringify({ categoryId, itemName }) }),
  updateBox: (id, data) => request(`${API_URL}/boxes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  bulkDeleteBoxes: (boxIds) => request(`${API_URL}/boxes/bulk`, { method: 'DELETE', body: JSON.stringify({ boxIds }) }),

  searchBoxes: (query) => request(`${API_URL}/boxes?search=${encodeURIComponent(query)}`),

  getStats: () => request(`${API_URL}/stats`),

  getQR: (boxId) => request(`${API_URL}/qr/${boxId}`),

  scanBox: (boxId) => request(`${API_URL}/scan`, { method: 'POST', body: JSON.stringify({ boxId }) }),

  getHistory: (boxId) => request(`${API_URL}/history/${boxId}`),

  getPdfLabelsUrl: (categoryId) => `${API_URL}/pdf/labels/${categoryId}?token=${localStorage.getItem('supabase.auth.token') || ''}`,
  getPdfSummaryUrl: () => `${API_URL}/pdf/summary?token=${localStorage.getItem('supabase.auth.token') || ''}`,
  getCsvExportUrl: () => `${API_URL}/export/csv?token=${localStorage.getItem('supabase.auth.token') || ''}`,
};
