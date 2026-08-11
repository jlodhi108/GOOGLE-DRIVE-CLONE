import { apiRequest } from './client';

export const activityApi = {
  list: (page = 1, limit = 20) =>
    apiRequest(`/activities?page=${page}&limit=${limit}`),

  recent: (limit = 10) => apiRequest(`/activities/recent?limit=${limit}`),

  unreadCount: () => apiRequest('/activities/unread/count'),

  markAsRead: (id) => apiRequest(`/activities/${id}/read`, { method: 'POST' }),

  resource: (resourceId, page = 1, limit = 20) =>
    apiRequest(`/activities/resource/${resourceId}?page=${page}&limit=${limit}`)
};
