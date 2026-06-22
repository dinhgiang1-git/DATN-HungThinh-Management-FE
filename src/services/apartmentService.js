import api from './api';

const apartmentService = {
  getAll: (params = {}) => {
    return api.get('/api/v1/apartments', { params });
  },
  getById: (apartmentId) => {
    return api.get(`/api/v1/apartments/${apartmentId}`);
  },
  getByResident: (residentId) => {
    return api.get(`/api/v1/apartments/resident/${residentId}`);
  },
  getStatistics: (params = {}) => {
    return api.get('/api/v1/apartments/statistics', { params });
  },
  create: (data) => {
    return api.post('/api/v1/apartments', data);
  },
  update: (apartmentId, data) => {
    return api.patch(`/api/v1/apartments/${apartmentId}`, data);
  },
  delete: (apartmentId) => {
    return api.delete(`/api/v1/apartments/${apartmentId}`);
  },
};

export default apartmentService;
