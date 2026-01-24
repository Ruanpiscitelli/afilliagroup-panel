import axios from 'axios';

const api = axios.create({
    baseURL: '/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Auth
export const authApi = {
    login: (email: string, password: string) =>
        api.post('/auth/login', { email, password }),
    logout: () => api.post('/auth/logout'),
    me: () => api.get('/auth/me'),
};

// Metrics
export const metricsApi = {
    getDashboard: (startDate?: string, endDate?: string) =>
        api.get('/metrics/dashboard', { params: { startDate, endDate } }),
    getTopCampaigns: (startDate?: string, endDate?: string, limit?: number) =>
        api.get('/metrics/top-campaigns', { params: { startDate, endDate, limit } }),
    getByCampaign: (startDate?: string, endDate?: string) =>
        api.get('/metrics/by-campaign', { params: { startDate, endDate } }),
    getTimeSeries: (startDate?: string, endDate?: string) =>
        api.get('/metrics/time-series', { params: { startDate, endDate } }),
};

// Campaigns
export const campaignsApi = {
    getAll: () => api.get('/campaigns'),
};

// Links
export const linksApi = {
    getAll: () => api.get('/links'),
};

export default api;
