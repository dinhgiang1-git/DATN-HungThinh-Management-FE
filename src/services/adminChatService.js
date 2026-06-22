import api from './api';

const adminChatService = {
  ask: (message, messages = []) => api.post('/api/v1/admin-chat', { message, messages }),
};

export default adminChatService;
