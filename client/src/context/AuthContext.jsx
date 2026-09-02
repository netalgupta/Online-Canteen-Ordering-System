import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { getToken, saveToken, removeToken, saveUser, removeUser, getUser } from '../utils/storage';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getUser()); // Restore from localStorage immediately
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = getToken();
      if (token) {
        // Set axios default header immediately
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        try {
          const { data } = await api.get('/auth/me');
          const freshUser = data.data || data.user;
          setUser(freshUser);
          saveUser(freshUser);
        } catch (error) {
          // Token invalid or expired
          removeToken();
          removeUser();
          setUser(null);
          delete api.defaults.headers.common['Authorization'];
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    saveToken(data.token);
    saveUser(data.user);
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setUser(data.user);
    return data.user;
  };

  const register = async (userData) => {
    const { data } = await api.post('/auth/register', userData);
    saveToken(data.token);
    saveUser(data.user);
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    removeToken();
    removeUser();
    delete api.defaults.headers.common['Authorization'];
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
