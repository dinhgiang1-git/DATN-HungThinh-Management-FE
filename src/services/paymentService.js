import api from './api';

const paymentService = {
  createVnpayPayment: (invoiceId) => {
    return api.get(`/api/v1/payment/vnpay/${invoiceId}`);
  },
};

export default paymentService;
