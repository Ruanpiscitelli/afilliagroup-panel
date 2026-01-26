import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || '/api',
    withCredentials: true,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Auth
export const authApi = {
    login: (email: string, password: string) =>
        api.post('/auth/login', { email, password }),
    register: (data: {
        name: string;
        email: string;
        password: string;
        whatsapp?: string;
        instagram?: string;
        marketNiche?: string;
        projectedFtds?: string;
    }) => api.post('/auth/register', data),
    logout: () => api.post('/auth/logout'),
    me: () => api.get('/auth/me'),
};

// Affiliates
export const affiliatesApi = {
    getAll: () => api.get('/metrics/affiliates'),
};

// Metrics
export const metricsApi = {
    getDashboard: (startDate?: string, endDate?: string, affiliateId?: string) =>
        api.get('/metrics/dashboard', { params: { startDate, endDate, affiliateId } }),
    getTopCampaigns: (startDate?: string, endDate?: string, limit?: number, affiliateId?: string) =>
        api.get('/metrics/top-campaigns', { params: { startDate, endDate, limit, affiliateId } }),
    getByCampaign: (startDate?: string, endDate?: string, affiliateId?: string) =>
        api.get('/metrics/by-campaign', { params: { startDate, endDate, affiliateId } }),
    getTimeSeries: (startDate?: string, endDate?: string, affiliateId?: string) =>
        api.get('/metrics/time-series', { params: { startDate, endDate, affiliateId } }),
};

// Admin
export const adminApi = {
    getStats: () => api.get('/admin/stats'),
    getPerformanceAffiliates: (startDate?: string, endDate?: string) =>
        api.get('/admin/performance/affiliates', { params: { startDate, endDate } }),
    getRequests: () => api.get('/admin/requests'),
    getAffiliates: () => api.get('/admin/affiliates'),
    getUser: (userId: string) => api.get(`/admin/users/${userId}`),
    updateUser: (userId: string, data: {
        name?: string;
        email?: string;
        whatsapp?: string;
        instagram?: string;
        projectedFtds?: string;
        cpaAmount?: number;
        parentId?: string | null;
    }) => api.put(`/admin/users/${userId}`, data),
    getMetrics: (userId: string) => api.get(`/admin/users/${userId}/metrics`),
    updateMetric: (metricId: string, data: {
        date?: string;
        clicks?: number;
        registrations?: number;
        ftds?: number;
        qualifiedCpa?: number;
        depositAmount?: number;
        commissionCpa?: number;
        commissionRev?: number;
    }) => api.put(`/admin/metrics/${metricId}`, data),
    createMetric: (data: any) => api.post('/admin/metrics', data),
    updateStatus: (userId: string, status: 'ACTIVE' | 'REJECTED' | 'BANNED') =>
        api.put(`/admin/users/${userId}/status`, { status }),
    updateCpa: (userId: string, cpaAmount: number) =>
        api.put(`/admin/users/${userId}/cpa`, { cpaAmount }),
    createUser: (data: {
        name: string;
        email: string;
        password: string;
        whatsapp?: string;
        instagram?: string;
        projectedFtds?: string;
        cpaAmount?: number;
        parentId?: string | null;
    }) => api.post('/admin/users', data),
    deleteUser: (userId: string) => api.delete(`/admin/users/${userId}`),
    updatePassword: (userId: string, password: string) =>
        api.put(`/admin/users/${userId}/password`, { password }),
    // Links management
    getLinks: () => api.get('/admin/links'),
    createLink: (data: {
        userId: string;
        campaignId: number;
        platformUrl: string;
    }) => api.post('/admin/links', data),
    deleteLink: (linkId: number) => api.delete(`/admin/links/${linkId}`),
    // Campaigns management
    getCampaigns: () => api.get('/admin/campaigns'),
    createCampaign: (data: { name: string; slug: string }) =>
        api.post('/admin/campaigns', data),
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

