import api from "./api";

export const staffService = {
  getOrders: async (status) => {
    const params = status ? { status } : {};
    const { data } = await api.get("/staff/orders", { params });
    return data.data || [];
  },
  updateOrderStatus: async (id, status, reason) => {
    const { data } = await api.patch(`/staff/orders/${id}/status`, { status, reason });
    return data.data;
  },
  verifyPickup: async (pickupCode) => {
    const { data } = await api.post("/staff/pickup/verify", { pickupCode });
    return data.data;
  },
  collectOrder: async (orderId) => {
    const { data } = await api.patch(`/staff/pickup/${orderId}/collect`);
    return data.data;
  },
  getInventory: async () => {
    const { data } = await api.get("/staff/inventory");
    return data.data || [];
  },
  getQueueHeat: async () => {
    const { data } = await api.get("/staff/queue/heat");
    return data.data;
  }
};
