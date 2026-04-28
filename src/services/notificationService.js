import api from './api';

const notificationService = {
  getAll: (params = {}) => {
    return api.get('/api/v1/notifications', { params });
  },
  getById: (notificationId) => {
    return api.get(`/api/v1/notifications/${notificationId}`);
  },
  getReceivers: (notificationId, params = {}) => {
    return api.get(`/api/v1/notifications/${notificationId}/receivers`, { params });
  },
  create: (data) => {
    return api.post('/api/v1/notifications', data);
  },
  update: (notificationId, data) => {
    return api.patch(`/api/v1/notifications/${notificationId}`, data);
  },
  delete: (notificationId) => {
    return api.delete(`/api/v1/notifications/${notificationId}`);
  },
};

export default notificationService;
