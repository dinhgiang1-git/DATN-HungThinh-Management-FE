import api from './api';

const tableFeeService = {
  getAll: () => {
    return api.get('/api/v1/tablefees');
  },
  create: (data) => {
    return api.post('/api/v1/tablefees', null, { params: data });
  },
  update: (tableFeeId, data) => {
    return api.patch(`/api/v1/tablefees/${tableFeeId}`, null, { params: data });
  },
  delete: (tableFeeId) => {
    return api.delete(`/api/v1/tablefees/${tableFeeId}`);
  },
};

export default tableFeeService;
