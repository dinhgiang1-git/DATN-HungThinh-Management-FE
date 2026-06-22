import api from './api';

const auditLogService = {
  getAll: (params = {}) => {
    return api.get('/api/v1/audit-logs', { params });
  },
  getSummary: (params = {}) => {
    return api.get('/api/v1/audit-logs/summary', { params });
  },
};

export default auditLogService;
