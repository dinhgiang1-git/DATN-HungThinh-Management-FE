import api from './api';

const feedbackService = {
  getAll: (params = {}) => {
    return api.get('/api/v1/feedbacks', { params });
  },
  getById: (feedbackId) => {
    return api.get(`/api/v1/feedbacks/${feedbackId}`);
  },
  create: (data) => {
    return api.post('/api/v1/feedbacks', data);
  },
  update: (feedbackId, data) => {
    return api.patch(`/api/v1/feedbacks/${feedbackId}`, data);
  },
  delete: (feedbackId) => {
    return api.delete(`/api/v1/feedbacks/${feedbackId}`);
  },
};

export default feedbackService;
