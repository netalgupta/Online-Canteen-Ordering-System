import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { STORAGE_KEYS, setStorage, removeStorage, getStorage } from '../utils/constants';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = getStorage(STORAGE_KEYS.TOKEN);
      if (token) {
        try {
          const { data } = await api.get('/auth/me');
          setUser(data.user);
        } catch (error) {
          console.error('Auth check failed', error);
          removeStorage(STORAGE_KEYS.TOKEN);
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    setStorage(STORAGE_KEYS.TOKEN, data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (userData) => {
    const { data } = await api.post('/auth/register', userData);
    setStorage(STORAGE_KEYS.TOKEN, data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    removeStorage(STORAGE_KEYS.TOKEN);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
