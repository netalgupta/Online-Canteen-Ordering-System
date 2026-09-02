import api from './api';

export const orderService = {
  placeOrder: async (orderData) => {
    const { data } = await api.post('/orders', orderData);
    return data;
  },
  getMyOrders: async () => {
    const { data } = await api.get('/orders/my');
    return data;
  },
  getOrder: async (id) => {
    const { data } = await api.get(`/orders/${id}`);
    return data;
  },
  cancelOrder: async (id, reason) => {
    const { data } = await api.delete(`/orders/${id}/cancel`, { data: { reason } });
    return data;
  },
  getQueueStatus: async (id) => {
    const { data } = await api.get(`/orders/${id}/queue`);
    return data;
  },
  getSlots: async (date) => {
    const { data } = await api.get('/slots/available', { params: { date } });
    return data;
  }
};
