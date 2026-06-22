import api from './api';

const buildReturnUrl = (path) => `${window.location.origin}${path}`;

const paymentService = {
  // Admin methods
  createMomoPayment: (invoiceId) => {
    return api.get(`/api/v1/payment/momo/${invoiceId}`, {
      params: {
        source: 'admin',
        returnUrl: buildReturnUrl('/payment-result'),
      },
    });
  },
  momoCallback: (queryString) => {
    return api.get(`/api/v1/payment/momo-callback${queryString}`);
  },
  createVnPayPayment: (invoiceId) => {
    return api.get(`/api/v1/payment/vnpay/${invoiceId}`, {
      params: {
        source: 'admin',
        returnUrl: buildReturnUrl('/payment-result'),
      },
    });
  },
  vnPayCallback: (queryString) => {
    return api.get(`/api/v1/payment/vnpay-callback${queryString}`);
  },
  createManualPayment: (data) => {
    return api.post('/api/v1/payment/manual', data);
  },
  confirmCashPayment: (paymentId) => {
    return api.patch(`/api/v1/payment/cash-request/${paymentId}/confirm`);
  },
  // Resident methods
  createMomo: (invoiceId) => {
    return api.get(`/api/v1/payment/momo/${invoiceId}`, {
      params: {
        source: 'resident',
        returnUrl: buildReturnUrl('/resident/payment-result'),
      },
    });
  },
  createVnPay: (invoiceId) => {
    return api.get(`/api/v1/payment/vnpay/${invoiceId}`, {
      params: {
        source: 'resident',
        returnUrl: buildReturnUrl('/resident/payment-result'),
      },
    });
  },
  requestCashPayment: (data) => {
    return api.post('/api/v1/payment/cash-request', data);
  },
};

export default paymentService;
