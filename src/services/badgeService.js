import api from './api';

const badgeService = {
  getCounts: () => api.get('/api/v1/badge-counts'),
};

export default badgeService;
