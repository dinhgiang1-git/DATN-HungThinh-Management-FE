import api from './api';

const userService = {
  getAll: (params = {}) => {
    return api.get('/api/v1/users', { params });
  },
  getById: (userId) => {
    return api.get(`/api/v1/users/${userId}`);
  },
  getByUsername: (username) => {
    return api.get(`/api/v1/users/${username}`);
  },
  create: (data) => {
    return api.post('/api/v1/users', data);
  },
  update: (userId, data) => {
    return api.patch(`/api/v1/users/${userId}`, data);
  },
  delete: (userId) => {
    return api.delete(`/api/v1/users/${userId}`);
  },
};

export default userService;
