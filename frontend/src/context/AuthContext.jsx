import React, { createContext, useContext, useState, useEffect } from 'react';
import { login as apiLogin } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Restore authentication session from localStorage
    const savedToken = localStorage.getItem('manivtha_token');
    const savedUser = localStorage.getItem('manivtha_user');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email, password) => {
    setLoading(true);
    try {
      const data = await apiLogin(email, password);
      if (data.success && data.token) {
        setToken(data.token);
        setUser(data.user);
        localStorage.setItem('manivtha_token', data.token);
        localStorage.setItem('manivtha_user', JSON.stringify(data.user));
        return { success: true };
      } else {
        throw new Error(data.error || 'Authentication failed');
      }
    } catch (err) {
      console.error('AuthContext Login Error:', err);
      return { 
        success: false, 
        error: err.response?.data?.error || err.message || 'Invalid credentials' 
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('manivtha_token');
    localStorage.removeItem('manivtha_user');
  };

  const isAuthenticated = !!token;

  const value = {
    user,
    token,
    loading,
    login,
    logout,
    isAuthenticated
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
