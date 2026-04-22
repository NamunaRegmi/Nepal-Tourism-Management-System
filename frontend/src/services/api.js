import axios from 'axios';
import { notifyAppDataChanged } from '@/lib/dataSync';

const API_URL = 'http://127.0.0.1:8000/api/';

const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a request interceptor to add the auth token to requests
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Add a response interceptor to handle token expiration (optional but good practice)
api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // If error is 401 and we haven't tried to refresh yet
        if (error?.response?.status === 401 && originalRequest && !originalRequest._retry) {
            originalRequest._retry = true;

            try {
                const refreshToken = localStorage.getItem('refresh_token');
                if (refreshToken) {
                    // We would need a refresh token endpoint, but for now let's just logout or handle it simply
                    // implementing true refresh logic requires a bit more work in backendurls/views
                    // For this MVP, we might just redirect to login
                    console.log("Token expired");
                }
            } catch (e) {
                console.error("Refresh token failed", e);
            }
        }

        if (error?.code === 'ECONNABORTED') {
            console.error('API request timed out:', error.config?.url);
        }

        return Promise.reject(error);
    }
);

export const authService = {
    login: (credentials) => api.post('auth/login/', credentials),
    register: (userData) => api.post('auth/register/', userData),
    googleLogin: (credential, role) => api.post('auth/google/', { credential, role }),
    getProfile: () => api.get('auth/profile/'),
    updateProfile: (data) => api.put('auth/profile/', data),
    logout: () => Promise.resolve().then(() => {
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user');
        notifyAppDataChanged();
    }),
};

export const destinationService = {
    getAll: () => api.get('destinations/'),
    getById: (id) => api.get(`destinations/${id}/`),
    create: (data) => api.post('destinations/', data),
    update: (id, data) => api.put(`destinations/${id}/`, data),
    delete: (id) => api.delete(`destinations/${id}/`),
};

export const hotelService = {
    getByDestination: (destId) => api.get(`destinations/${destId}/hotels/`),
    getMyHotels: () => api.get('provider/hotels/'),
    getById: (id) => api.get(`hotels/${id}/`),
    create: (data) => api.post('provider/hotels/', data),
    update: (id, data) => api.put(`hotels/${id}/`, data),
    delete: (id) => api.delete(`hotels/${id}/`),
};

export const roomService = {
    getByHotel: (hotelId) => api.get(`hotels/${hotelId}/rooms/`),
    getById: (id) => api.get(`rooms/${id}/`),
    create: (hotelId, data) => api.post(`hotels/${hotelId}/rooms/`, data),
    update: (id, data) => api.put(`rooms/${id}/`, data),
    delete: (id) => api.delete(`rooms/${id}/`),
};

export const packageService = {
    getAll: () => api.get('packages/'),
    getMyPackages: () => api.get('provider/packages/'),
    getById: (id) => api.get(`packages/${id}/`),
    create: (data) => api.post('provider/packages/', data),
    update: (id, data) => api.put(`packages/${id}/`, data),
    delete: (id) => api.delete(`packages/${id}/`),
};

export const bookingService = {
    getMyBookings: () => api.get('bookings/'),
    create: (data) => api.post('bookings/', data),
    update: (id, data) => api.put(`bookings/${id}/`, data),
    updateStatus: (id, status) => api.put(`bookings/${id}/`, { status }),
    getById: (id) => api.get(`bookings/${id}/`),
};

export const guideService = {
    list: (params = {}) => api.get('guides/', { params }),
    getById: (id) => api.get(`guides/${id}/`),
    getMyProfile: () => api.get('guides/me/profile/'),
    createMyProfile: (data) => api.post('guides/me/profile/', data),
    updateMyProfile: (data) => api.put('guides/me/profile/', data),
};

export const guideBookingService = {
    list: () => api.get('guide-bookings/'),
    create: (data) => api.post('guide-bookings/', data),
    update: (id, data) => api.put(`guide-bookings/${id}/`, data),
    getById: (id) => api.get(`guide-bookings/${id}/`),
};

export const adminService = {
    getStats: () => api.get('admin/stats/'),
    getAllUsers: () => api.get('admin/users/'),
    deleteUser: (id) => api.delete(`admin/users/${id}/`),
    getAllProviders: () => api.get('admin/providers/'),
    // Same data as BookingListView for admin role (backend returns all bookings)
    getAllBookings: () => api.get('bookings/'),
};

export default api;
