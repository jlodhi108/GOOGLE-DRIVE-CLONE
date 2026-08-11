import { apiRequest } from './client';

export const authApi = {
  register: (name, email, password) =>
    apiRequest('/auth/register', { method: 'POST', body: { name, email, password }, skipAuth: true }),

  verifyOtp: (email, otp) =>
    apiRequest('/auth/verify-otp', { method: 'POST', body: { email, otp }, skipAuth: true }),

  resendOtp: (email) =>
    apiRequest('/auth/resend-otp', { method: 'POST', body: { email }, skipAuth: true }),

  forgotPassword: (email) =>
    apiRequest('/auth/forgot-password', { method: 'POST', body: { email }, skipAuth: true }),

  resetPassword: (email, otp, newPassword) =>
    apiRequest('/auth/reset-password', { method: 'POST', body: { email, otp, newPassword }, skipAuth: true }),

  login: (email, password) =>
    apiRequest('/auth/login', { method: 'POST', body: { email, password }, skipAuth: true }),

  logout: () => apiRequest('/auth/logout', { method: 'POST' }),

  getProfile: () => apiRequest('/auth/profile'),

  updateProfile: (updates) =>
    apiRequest('/auth/profile', { method: 'PUT', body: updates }),

  deleteAccount: () => apiRequest('/auth/account', { method: 'DELETE' })
};
