import api from './api';

export const menuService = {
  getCategories: async () => {
    const { data } = await api.get('/menu/categories');
    return data.data;
  },
  getItems: async (params) => {
    const { data } = await api.get('/menu/items', { params });
    return data.data;
  },
  getItem: async (id) => {
    const { data } = await api.get(`/menu/items/${id}`);
    return data.data;
  },
  updateAvailability: async (id, availability) => {
    const { data } = await api.patch(`/menu/items/${id}/availability`, { availability });
    return data.data;
  },
  createItem: async (itemData) => {
    const { data } = await api.post('/menu/items', itemData);
    return data.data;
  },
  updateItem: async (id, itemData) => {
    const { data } = await api.put(`/menu/items/${id}`, itemData);
    return data.data;
  },
  deleteItem: async (id) => {
    const { data } = await api.delete(`/menu/items/${id}`);
    return data.data;
  },
  createCategory: async (categoryData) => {
    const { data } = await api.post('/menu/categories', categoryData);
    return data.data;
  },
  updateCategory: async (id, categoryData) => {
    const { data } = await api.put(`/menu/categories/${id}`, categoryData);
    return data.data;
  },
  deleteCategory: async (id) => {
    const { data } = await api.delete(`/menu/categories/${id}`);
    return data.data;
  }
};
