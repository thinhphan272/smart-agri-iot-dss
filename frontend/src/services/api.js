import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Tự động đính kèm JWT Token vào Header của mọi request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('agri_jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Xử lý lỗi trả về (hết hạn token)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      console.warn('[API] Token hết hạn hoặc không hợp lệ.');
    }
    return Promise.reject(error);
  }
);

// 1. Auth & Users API
export const authAPI = {
  login: (email, password) => api.post('/api/auth/login', { email, password }),
  register: (data) => api.post('/api/auth/register', data),
  demoLogin: (role) => api.post('/api/auth/demo-login', { role }),
  getMe: () => api.get('/api/auth/me'),
};

// 2. Realtime AI Predict & Diagnostics API
export const predictAPI = {
  predict: (sensorData) => api.post('/api/predict/', sensorData),
  getHistory: (limit = 20) => api.get(`/api/predict/history?limit=${limit}`),
  getMetrics: () => api.get('/api/predict/metrics'),
};

// 3. Big Data Batch CSV API
export const batchAPI = {
  uploadCSV: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/api/batch/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  getJobs: (limit = 15) => api.get(`/api/batch/jobs?limit=${limit}`),
  getSampleCSVUrl: () => `${API_BASE_URL}/api/batch/sample-csv`,
};

// 4. Hybrid AI Chatbot API
export const chatAPI = {
  sendMessage: (sessionId, message) => api.post('/api/chat/message', { session_id: sessionId, message }),
  getHistory: (sessionId) => api.get(`/api/chat/history/${sessionId}`),
};

// 5. QR Code Session & Actuators API
export const qrAPI = {
  createSession: () => api.post('/qr/create-session'),
  triggerActuator: (data) => api.post('/actuators/trigger', data),
  getLogs: (limit = 20) => api.get(`/actuators/logs?limit=${limit}`),
};

export default api;
