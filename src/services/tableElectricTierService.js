import api from './api';

const tableElectricTierService = {
  getAll: () => {
    return api.get(`/api/v1/table_electric_tiers`);
  },
  create: (data) => {
    return api.post('/api/v1/table_electric_tiers', data);
  },
  update: (id, data) => {
    return api.patch(`/api/v1/table_electric_tiers/${id}`, data);
  },
  delete: (id) => {
    return api.delete(`/api/v1/table_electric_tiers/${id}`);
  },
  calculator: (totalKwh, startDate, endDate, numberOfHouseholds = 1) => {
    return api.get('/api/v1/table_electric_tiers/calculator', {
      params: { totalKwh, startDate, endDate, numberOfHouseholds }
    });
  },
};

export default tableElectricTierService;