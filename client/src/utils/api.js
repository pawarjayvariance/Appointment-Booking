import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

const api = axios.create({
    baseURL: API_BASE,
});

// Request interceptor to attach token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle suspension
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 403) {
            const errorMessage = error.response.data?.error;
            if (errorMessage && errorMessage.includes('tenant is suspended')) {
                // Emit a custom event or use a callback to notify AuthContext
                // For now, we'll let AuthContext handle the state via this error
                window.dispatchEvent(new CustomEvent('tenant-suspended'));
            }
        }
        return Promise.reject(error);
    }
);

export default api;
