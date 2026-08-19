import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  headers: { 'Content-Type': 'application/json' }
});

api.interceptors.request.use((config) => {
  const language = window.localStorage.getItem('parkDedeman.language') || 'tr';
  config.headers.set('Accept-Language', language);
  return config;
});

export const withToken = (token) => ({
  headers: { Authorization: `Bearer ${token}` }
});
