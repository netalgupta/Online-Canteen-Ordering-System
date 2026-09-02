import api from './api';

export const adminService = {
  getOverview: async () => {
    const { data } = await api.get('/admin/analytics/overview');
    return data;
  },
  getHourlyData: async () => {
    const { data } = await api.get('/admin/analytics/hourly');
    return data;
  },
  getPopularItems: async () => {
    const { data } = await api.get('/admin/analytics/popular-items');
    return data;
  },
  getPerformance: async () => {
    const { data } = await api.get('/admin/analytics/performance');
    return data;
  },
  getUsers: async (params) => {
    const { data } = await api.get('/admin/users', { params });
    return data;
  },
  updateUser: async (id, userData) => {
    const { data } = await api.patch(`/admin/users/${id}`, userData);
    return data;
  },
  getSettings: async () => {
    const { data } = await api.get('/admin/settings');
    return data;
  },
  updateSettings: async (settingsData) => {
    const { data } = await api.put('/admin/settings', settingsData);
    return data;
  },
  getFeedback: async () => {
    const { data } = await api.get('/admin/feedback');
    return data;
  }
};
