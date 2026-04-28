import api from './api';

const auditLogService = {
  getAll: (params = {}) => {
    return api.get('/api/v1/audit-logs', { params });
  },
};

export default auditLogService;
