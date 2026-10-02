import React, { createContext, useContext, useState, useEffect } from 'react';
import { authAPI } from '../services/api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('agri_jwt_token'));
  const [loading, setLoading] = useState(true);

  // Tự động kiểm tra token khi tải trang
  useEffect(() => {
    const fetchUser = async () => {
      const storedToken = localStorage.getItem('agri_jwt_token');
      if (storedToken) {
        try {
          const res = await authAPI.getMe();
          setUser(res.data);
        } catch (err) {
          console.error('[AuthContext] Token không hợp lệ hoặc đã hết hạn:', err);
          logout();
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const loginWithToken = (tokenData) => {
    localStorage.setItem('agri_jwt_token', tokenData.access_token);
    setToken(tokenData.access_token);
    setUser({
      id: tokenData.user_id,
      email: tokenData.role === 'admin' ? 'admin@agri-iot.vn' : (tokenData.role === 'engineer' ? 'engineer@agri-iot.vn' : 'farmer@agri-iot.vn'),
      role: tokenData.role,
      full_name: tokenData.full_name,
    });
  };

  const quickDemoLogin = async (role) => {
    try {
      const res = await authAPI.demoLogin(role);
      loginWithToken(res.data);
      return { success: true, user: res.data };
    } catch (err) {
      console.error('[AuthContext] Demo login thất bại:', err);
      return { success: false, error: err.response?.data?.detail || 'Lỗi đăng nhập demo' };
    }
  };

  const login = async (email, password) => {
    try {
      const res = await authAPI.login(email, password);
      loginWithToken(res.data);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.detail || 'Sai email hoặc mật khẩu' };
    }
  };

  const register = async (formData) => {
    try {
      await authAPI.register(formData);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.response?.data?.detail || 'Đăng ký thất bại' };
    }
  };

  const logout = () => {
    localStorage.removeItem('agri_jwt_token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        role: user?.role || 'guest',
        isAuthenticated: !!user,
        loading,
        login,
        register,
        quickDemoLogin,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
