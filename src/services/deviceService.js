import api from './api';

const deviceService = {
  getAll: (params = {}) => {
    return api.get('/api/v1/devices', { params });
  },
  getById: (deviceId) => {
    return api.get(`/api/v1/devices/${deviceId}`);
  },
  create: (data) => {
    return api.post('/api/v1/devices', data);
  },
  update: (deviceId, data) => {
    return api.patch(`/api/v1/devices/${deviceId}`, data);
  },
  delete: (deviceId) => {
    return api.delete(`/api/v1/devices/${deviceId}`);
  },
};

export default deviceService;
