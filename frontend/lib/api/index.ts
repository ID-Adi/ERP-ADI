
import axios from 'axios';
import Cookies from 'js-cookie';

const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Interceptor untuk menyisipkan token
api.interceptors.request.use(
    (config) => {
        const token = Cookies.get('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Interceptor untuk handle response error (misal 401 logout)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            // Token expired atau invalid, clear cookie
            Cookies.remove('token');
            // Redirect ke login page jika perlu? 
            // Router nextjs tidak bisa diakses di sini dengan mudah
        }
        return Promise.reject(error);
    }
);

export default api;
