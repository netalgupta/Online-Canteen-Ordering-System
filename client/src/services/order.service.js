import api from './api';

export const orderService = {
  placeOrder: async (orderData) => {
    const response = await api.post('/orders', orderData);
    return response.data.data; // returns the created order object
  },
  getMyOrders: async () => {
    const response = await api.get('/orders/my');
    return response.data.data;
  },
  getOrder: async (id) => {
    const response = await api.get(`/orders/${id}`);
    return response.data.data;
  },
  cancelOrder: async (id, reason) => {
    const response = await api.delete(`/orders/${id}/cancel`, { data: { reason } });
    return response.data.data;
  },
  getQueueStatus: async (id) => {
    const response = await api.get(`/orders/${id}/queue`);
    return response.data.data;
  },
  getSlots: async (date) => {
    const response = await api.get('/slots/available', { params: { date } });
    return response.data.data || [];
  },
  reorder: async (orderId, cartContext) => {
    const response = await api.get(`/orders/${orderId}`);
    const order = response.data.data;
    if (!order) return;
    for (const item of order.items) {
      try {
        const itemRes = await api.get(`/menu/items/${item.foodItem}`);
        const fresh = itemRes.data.data;
        if (fresh && fresh.availability === 'available') {
          cartContext.addItem(fresh, item.quantity, item.specialInstructions || '');
        }
      } catch { /* skip unavailable items silently */ }
    }
  }
};
