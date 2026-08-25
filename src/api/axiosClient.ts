import axios from 'axios';

const axiosClient = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || 'https://quanlydaythem-api.onrender.com').replace(/\/+$/, '')
});

axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      localStorage.removeItem('role');
      window.location.href = '/login';
    } else if (error.response && error.response.status === 403) {
      alert('Lỗi: Bạn không có quyền truy cập hoặc thao tác dữ liệu này!');
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
