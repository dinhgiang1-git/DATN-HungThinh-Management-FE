import api from './api';

const vehicleService = {
  getAll: () => {
    return api.get('/api/v1/vehicles/all');
  },
  getByApartment: (apartmentId) => {
    return api.get('/api/v1/vehicles', { params: { apartmentId } });
  },
  getById: (vehicleId) => {
    return api.get(`/api/v1/vehicles/${vehicleId}`);
  },
  create: (data) => {
    return api.post('/api/v1/vehicles', data);
  },
  update: (vehicleId, data) => {
    return api.patch(`/api/v1/vehicles/${vehicleId}`, data);
  },
  delete: (vehicleId) => {
    return api.delete(`/api/v1/vehicles/${vehicleId}`);
  },
  calculateParkingFee: (apartmentId, motorbikeFee, carFee) => {
    return api.get('/api/v1/vehicles/parking-fee', {
      params: { apartmentId, motorbikeFee, carFee },
    });
  },
};

export default vehicleService;
