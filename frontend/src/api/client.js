import axios from 'axios';

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5001/api',
});

// Attach Auth Token if present
API.interceptors.request.use((req) => {
  const token = localStorage.getItem('token');
  if (token) {
    req.headers.Authorization = `Bearer ${token}`;
  }
  return req;
});

// Dedicated fetch methods for each supplier entity
// `params` is forwarded as query string, e.g. { search, minPrice, maxPrice, sort }
export const fetchHotels = (params = {}) => API.get('/hotels', { params });
export const fetchRestaurants = () => API.get('/restaurants');
export const fetchPackages = () => API.get('/packages');
export const fetchCruises = () => API.get('/cruises');

export default API;
