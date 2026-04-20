import api from './api';

const paymentService = {
  createVnpayPayment: (invoiceId) => {
    return api.get(`/api/v1/payment/vnpay/${invoiceId}`);
  },
  vnpayCallback: (queryString) => {
    return api.get(`/api/v1/payment/vnpay-callback${queryString}`);
  },
};

export default paymentService;
