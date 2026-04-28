import api from './api';

const paymentService = {
  createMomoPayment: (invoiceId) => {
    return api.get(`/api/v1/payment/momo/${invoiceId}?source=admin`);
  },
  momoCallback: (queryString) => {
    return api.get(`/api/v1/payment/momo-callback${queryString}`);
  },
  createManualPayment: (data) => {
    return api.post('/api/v1/payment/manual', data);
  },
};

export default paymentService;

