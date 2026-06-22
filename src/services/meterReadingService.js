import api from './api';

const meterReadingService = {
  getAll: (params = {}) => {
    return api.get('/api/v1/meter-readings', { params });
  },
  preview: (apartmentId, billingPeriod) => {
    return api.get('/api/v1/meter-readings/preview', { params: { apartmentId, billingPeriod, _t: Date.now() } });
  },
  create: (data) => {
    return api.post('/api/v1/meter-readings', data, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  evidence: (meterReadingId, type) => {
    const suffix = type ? `/evidence/${type}` : '/evidence';
    return api.get(`/api/v1/meter-readings/${meterReadingId}${suffix}`, { responseType: 'blob' });
  },
};

export default meterReadingService;
