import api from './api';

const contractService = {
  getAll: (params = {}) => {
    return api.get('/api/v1/contracts', { params });
  },
  getById: (contractId) => {
    return api.get(`/api/v1/contracts/${contractId}`);
  },
  create: (data, file) => {
    const formData = new FormData();
    formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    if (file) {
      formData.append('file', file);
    }
    return api.post('/api/v1/contracts', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  update: (contractId, data, file) => {
    const formData = new FormData();
    formData.append('data', new Blob([JSON.stringify(data)], { type: 'application/json' }));
    if (file) {
      formData.append('file', file);
    }
    return api.patch(`/api/v1/contracts/${contractId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  delete: (contractId) => {
    return api.delete(`/api/v1/contracts/${contractId}`);
  },
  download: (contractId) => {
    return api.get(`/api/v1/contracts/${contractId}/download`, {
      responseType: 'blob',
    });
  },
};

export default contractService;
