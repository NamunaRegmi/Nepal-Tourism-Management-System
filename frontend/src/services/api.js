import axios from 'axios';
import { notifyAppDataChanged } from '@/lib/dataSync';

const API_URL = `${import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'}/api/`;

const api = axios.create({
    baseURL: API_URL,
    timeout: 10000,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('access_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

const AUTH_REQUIRED_PATHS = [
    '/auth/profile/',
    '/bookings/',
    '/guide-bookings/',
    '/admin/',
    '/provider/',
    '/guides/me/',
    '/reviews/',
];

let isRefreshing = false;
let refreshQueue = [];

function processRefreshQueue(newToken, error) {
    refreshQueue.forEach(({ resolve, reject }) => {
        if (error) reject(error);
        else resolve(newToken);
    });
    refreshQueue = [];
}

export function clearSession() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('wishlist');
    localStorage.removeItem('package_wishlist');
    localStorage.removeItem('travel_preferences');
    localStorage.removeItem('esewa_booking_id');
    notifyAppDataChanged();
}

api.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        if (error?.response?.status === 401 && originalRequest && !originalRequest._retry) {
            originalRequest._retry = true;

            const url = originalRequest.url || '';
            const needsAuth = AUTH_REQUIRED_PATHS.some((p) => url.includes(p));
            const refreshToken = localStorage.getItem('refresh_token');

            if (refreshToken) {
                if (isRefreshing) {
                    return new Promise((resolve, reject) => {
                        refreshQueue.push({ resolve, reject });
                    }).then((newToken) => {
                        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                        return api(originalRequest);
                    });
                }

                isRefreshing = true;
                try {
                    const { data } = await axios.post(`${API_URL}auth/token/refresh/`, {
                        refresh: refreshToken,
                    });
                    const newToken = data.access;
                    localStorage.setItem('access_token', newToken);
                    api.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
                    processRefreshQueue(newToken, null);
                    originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                    return api(originalRequest);
                } catch {
                    processRefreshQueue(null, error);
                    clearSession();
                    return Promise.reject(error);
                } finally {
                    isRefreshing = false;
                }
            }

            if (!needsAuth) {
                delete originalRequest.headers['Authorization'];
                return api(originalRequest);
            }

            clearSession();
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
    logout: () => Promise.resolve().then(() => clearSession()),
};

export const destinationService = {
    getAll: () => api.get('destinations/'),
    getById: (id) => api.get(`destinations/${id}/`),
    getRecommendations: (id, params) => api.get(`destinations/${id}/recommendations/`, { params }),
    getExploreRecommendations: (params) => api.get('destinations/explore-recommendations/', { params, timeout: 35000 }),
    create: (data) => api.post('destinations/', data),
    update: (id, data) => api.put(`destinations/${id}/`, data),
    delete: (id) => api.delete(`destinations/${id}/`),
};

export const hotelService = {
    getAll: (type) => api.get('hotels/', { params: type ? { type } : {} }),
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
    getByDestination: (destId) => api.get('packages/', { params: { destination_id: destId } }),
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
    getUser: (id) => api.get(`admin/users/${id}/`),
    updateUser: (id, data) => api.put(`admin/users/${id}/`, data),
    deleteUser: (id) => api.delete(`admin/users/${id}/`),
    getAllProviders: () => api.get('admin/providers/'),
    getProvider: (id) => api.get(`admin/providers/${id}/`),
    updateProvider: (id, data) => api.put(`admin/providers/${id}/`, data),
    deleteProvider: (id) => api.delete(`admin/providers/${id}/`),
    getAllPackages: () => api.get('admin/packages/'),
    getAllBookings: () => api.get('bookings/'),
};

export const reviewService = {
    getHotelReviews: (hotelId) => api.get(`hotels/${hotelId}/reviews/`),
    createHotelReview: (hotelId, data) => api.post(`hotels/${hotelId}/reviews/`, data),
    getDestinationReviews: (destId) => api.get(`destinations/${destId}/reviews/`),
    createDestinationReview: (destId, data) => api.post(`destinations/${destId}/reviews/`, data),
};

export const chatService = {
    sendMessage: (message, history) => api.post('chat/', { message, history }),
};

export default api;
