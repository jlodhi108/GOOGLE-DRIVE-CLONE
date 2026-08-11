import { apiRequest } from './client';

export const filesApi = {
  list: (folderId) =>
    apiRequest(`/files${folderId ? `?folderId=${folderId}` : ''}`),

  search: (query) =>
    apiRequest(`/files/search?query=${encodeURIComponent(query)}`),

  get: (id) => apiRequest(`/files/${id}`),

  upload: (file, folderId) => {
    const formData = new FormData();
    formData.append('file', file);
    if (folderId) formData.append('folderId', folderId);
    return apiRequest('/files/upload', { method: 'POST', body: formData, isFormData: true });
  },

  rename: (id, name) =>
    apiRequest(`/files/${id}`, { method: 'PUT', body: { name } }),

  remove: (id) => apiRequest(`/files/${id}`, { method: 'DELETE' }),

  getDownloadUrl: (id, mode = 'download') =>
    apiRequest(`/files/${id}/download?mode=${mode}`),

  star: (id) => apiRequest(`/files/${id}/star`, { method: 'PATCH' }),

  restore: (id) => apiRequest(`/files/${id}/restore`, { method: 'POST' }),

  permanentDelete: (id) => apiRequest(`/files/${id}/permanent`, { method: 'DELETE' }),

  trashList: () => apiRequest('/files/trash'),

  starred: () => apiRequest('/files/starred'),

  recent: () => apiRequest('/files/recent'),

  storageUsage: () => apiRequest('/files/storage-usage')
};
