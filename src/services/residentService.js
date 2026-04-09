import api from './api';

const residentService = {
  getAll: (params = {}) => {
    return api.get('/api/v1/residents', { params });
  },
  getById: (residentId) => {
    return api.get(`/api/v1/residents/${residentId}`);
  },
  create: (data) => {
    return api.post('/api/v1/residents', data);
  },
  update: (residentId, data) => {
    return api.patch(`/api/v1/residents/${residentId}`, data);
  },
  delete: (residentId) => {
    return api.delete(`/api/v1/residents/${residentId}`);
  },
};

export default residentService;
