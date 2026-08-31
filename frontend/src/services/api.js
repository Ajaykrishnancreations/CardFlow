// CardFlow Frontend API Client
// Connects to local or live Render backend API

export const API_BASE_URL =
  (typeof process !== 'undefined' && process.env && process.env.API_URL) ||
  'https://cardflow-api-fsij.onrender.com/api/v1';

export const BACKEND_ROOT_URL =
  (typeof process !== 'undefined' && process.env && process.env.BACKEND_URL) ||
  'https://cardflow-api-fsij.onrender.com';

export const apiClient = {
  // Check health
  async checkHealth() {
    try {
      const res = await fetch(`${BACKEND_ROOT_URL}/health`);
      return await res.json();
    } catch (e) {
      console.warn('Backend health check error:', e);
      return null;
    }
  },

  // Get Live Categories from Backend
  async getCategories() {
    try {
      const res = await fetch(`${API_BASE_URL}/categories`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.data?.categories || data.data || [];
    } catch (e) {
      console.warn('Could not load live categories, using local fallback:', e);
      return null;
    }
  },

  // Discover / Search Businesses from Backend
  async searchBusinesses({ q = '', category = '', lat, lng, radius_km = 10, limit = 20 } = {}) {
    try {
      const params = new URLSearchParams();
      if (q) params.append('q', q);
      if (category) params.append('category', category);
      if (lat != null) params.append('lat', lat);
      if (lng != null) params.append('lng', lng);
      if (radius_km) params.append('radius_km', radius_km);
      if (limit) params.append('limit', limit);

      const res = await fetch(`${API_BASE_URL}/businesses?${params.toString()}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data.data?.businesses || data.data || [];
    } catch (e) {
      console.warn('Could not load live businesses, using local fallback:', e);
      return null;
    }
  },

  // Request OTP
  async sendOtp(phone) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/otp/send`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone })
      });
      return await res.json();
    } catch (e) {
      return { status: 'error', message: e.message };
    }
  },

  // Verify OTP
  async verifyOtp(phone, otp) {
    try {
      const res = await fetch(`${API_BASE_URL}/auth/otp/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, otp })
      });
      return await res.json();
    } catch (e) {
      return { status: 'error', message: e.message };
    }
  }
};
