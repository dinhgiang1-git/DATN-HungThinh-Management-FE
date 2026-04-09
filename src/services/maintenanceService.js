import api from './api';

const maintenanceService = {
  getAll: (params = {}) => {
    return api.get('/api/v1/maintenances', { params });
  },
  getById: (maintenanceId) => {
    return api.get(`/api/v1/maintenances/${maintenanceId}`);
  },
  create: (data) => {
    return api.post('/api/v1/maintenances', data);
  },
  update: (maintenanceId, data) => {
    return api.patch(`/api/v1/maintenances/${maintenanceId}`, data);
  },
};

export default maintenanceService;
