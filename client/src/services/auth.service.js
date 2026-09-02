import api from './api';
import { saveToken, saveUser, removeToken, removeUser } from '../utils/storage';

export const authService = {
  login: async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    if (data.token) {
      saveToken(data.token);
      saveUser(data.user);
      api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    }
    return data; // { token, refreshToken, user }
  },
  register: async (userData) => {
    const { data } = await api.post('/auth/register', userData);
    if (data.token) {
      saveToken(data.token);
      saveUser(data.user);
      api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    }
    return data;
  },
  getMe: async () => {
    const { data } = await api.get('/auth/me');
    return data.data; // returns user object
  },
  logout: () => {
    removeToken();
    removeUser();
    delete api.defaults.headers.common['Authorization'];
  },
  refreshToken: async (refreshToken) => {
    const { data } = await api.post('/auth/refresh', { refreshToken });
    if (data.token) {
      saveToken(data.token);
      api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    }
    return data;
  }
};
