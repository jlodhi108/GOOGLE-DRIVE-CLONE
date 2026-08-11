import { apiRequest } from './client';

export const shareApi = {
  shareFile: (fileId, email, permissions) =>
    apiRequest('/share/file', {
      method: 'POST',
      body: { fileId, email, permissions }
    }),

  shareFolder: (folderId, email, permissions) =>
    apiRequest('/share/folder', {
      method: 'POST',
      body: { folderId, email, permissions }
    }),

  getSharedFiles: () => apiRequest('/share/files'),

  getSharedFolders: () => apiRequest('/share/folders'),

  updateFileSharePermissions: (shareId, permissions) =>
    apiRequest(`/share/file/${shareId}`, { method: 'PUT', body: { permissions } }),

  updateFolderSharePermissions: (shareId, permissions) =>
    apiRequest(`/share/folder/${shareId}`, { method: 'PUT', body: { permissions } }),

  removeFileShare: (shareId) =>
    apiRequest(`/share/file/${shareId}`, { method: 'DELETE' }),

  removeFolderShare: (shareId) =>
    apiRequest(`/share/folder/${shareId}`, { method: 'DELETE' })
};
