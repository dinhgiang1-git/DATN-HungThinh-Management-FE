import api from './api';

const invoiceService = {
  getAll: (params = {}) => {
    return api.get('/api/v1/invoices', { params });
  },
  getById: (invoiceId) => {
    return api.get(`/api/v1/invoices/${invoiceId}`);
  },
  create: (data) => {
    return api.post('/api/v1/invoices', data);
  },
  update: (invoiceId, data) => {
    return api.patch(`/api/v1/invoices/${invoiceId}`, data);
  },
  delete: (invoiceId) => {
    return api.delete(`/api/v1/invoices/${invoiceId}`);
  },
};

export default invoiceService;
