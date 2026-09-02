import axios from 'axios';
import { getToken, removeToken } from '../utils/storage';
import toast from 'react-hot-toast';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = getToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Handle responses and errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (!error.response) {
      // Network error
      toast.error('Unable to connect to server. Check your connection.', { id: 'network-error' });
    } else if (error.response.status === 401) {
      removeToken();
      window.location.href = '/login';
    } else if (error.response.status >= 500) {
      toast.error('Server error. Please try again later.');
    }
    return Promise.reject(error);
  }
);

export default api;
