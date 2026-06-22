import api from './api';

const systemNotificationService = {
  getByResident: (residentId, params) => {
    return api.get(`/api/v1/system-notifications/resident/${residentId}`, { params });
  },
  markAsRead: (id) => {
    return api.patch(`/api/v1/system-notifications/${id}/read`);
  },
  markAllAsRead: (residentId) => {
    return api.patch(`/api/v1/system-notifications/resident/${residentId}/read-all`);
  },
  getUnreadCount: (residentId) => {
    return api.get(`/api/v1/system-notifications/resident/${residentId}/unread-count`);
  },
};

export default systemNotificationService;
