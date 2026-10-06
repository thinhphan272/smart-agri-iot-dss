import axios from 'axios';

// Tự động phân giải hostname động để điện thoại trong cùng mạng WiFi / LAN gọi đúng Backend
const getDynamicBaseUrl = () => {
  if (import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined' && window.location) {
    const host = window.location.hostname;
    return `http://${host}:8000`;
  }
  return 'http://localhost:8000';
};

export const API_BASE_URL = getDynamicBaseUrl();

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
  googleLogin: (email, full_name, role) => api.post('/api/auth/google-login', { email, full_name, role }),
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
  uploadCSV: (file, engine = 'dual', modelSource = 'lightgbm') => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post(`/api/batch/upload?engine=${engine}&model_source=${modelSource}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
  scan200kDataset: (engine = 'dual', modelSource = 'lightgbm') =>
    api.post(`/api/batch/scan-200k-dataset?engine=${engine}&model_source=${modelSource}`),
  getSlice: (jobId, start = 1, end = 25, modelSource = 'lightgbm') =>
    api.get(`/api/batch/slice?${jobId ? `job_id=${jobId}&` : ''}start=${start}&end=${end}&model_source=${modelSource}`),
  getJobs: (limit = 15) => api.get(`/api/batch/jobs?limit=${limit}`),
  getSampleCSVUrl: () => `${API_BASE_URL}/api/batch/sample-csv`,
};

// 4. Hybrid AI Chatbot API
export const chatAPI = {
  sendMessage: (sessionId, message, model = 'gemini-1.5-flash', history = [], apiKey = null) => 
    api.post('/api/chat/message', { session_id: sessionId, message, model, history, api_key: apiKey }),
  getHistory: (sessionId) => api.get(`/api/chat/history/${sessionId}`),
};

// 5. QR Code Session & Actuators API
export const qrAPI = {
  createSession: () => api.post('/qr/create-session'),
  triggerActuator: (data) => api.post('/actuators/trigger', data),
  getLogs: (limit = 20) => api.get(`/actuators/logs?limit=${limit}`),
};

export default api;
