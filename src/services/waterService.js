import api from './api';

const waterService = {
  getBillByResidentId: (residentId) => {
    return api.get(`/api/mock/water/bills/${residentId}`);
  },
};

export default waterService;
