import api from './api';

const evnService = {
  getBillByResidentId: (residentId) => {
    return api.get(`/api/mock/evnnpc/bills/${residentId}`);
  },
};

export default evnService;
