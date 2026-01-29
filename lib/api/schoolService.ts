// lib/api/schoolService.ts - UPDATE dengan debug lebih detail
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://edusmart.test/api';

console.log('🔧 School Service URL:', API_URL);

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// DEBUG: Tambah log untuk semua request
api.interceptors.request.use(
  (config) => {
    console.group('📤 API Request');
    console.log('URL:', config.url);
    console.log('Method:', config.method?.toUpperCase());
    
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      console.log('Token exists:', !!token);
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
        console.log('Token set in header');
      }
    }
    
    console.log('Headers:', config.headers);
    console.groupEnd();
    return config;
  },
  (error) => {
    console.error('❌ Request interceptor error:', error);
    return Promise.reject(error);
  }
);

// DEBUG: Tambah log untuk semua response
api.interceptors.response.use(
  (response) => {
    console.group('📥 API Response');
    console.log('URL:', response.config.url);
    console.log('Status:', response.status, response.statusText);
    console.log('Data:', response.data);
    console.log('Headers:', response.headers);
    console.groupEnd();
    return response;
  },
  (error) => {
    console.group('🚨 API Error');
    console.log('URL:', error.config?.url);
    console.log('Method:', error.config?.method?.toUpperCase());
    console.log('Status:', error.response?.status);
    console.log('Error message:', error.message);
    console.log('Response data:', error.response?.data);
    console.log('Full error:', error);
    console.groupEnd();
    
    // Auto logout jika token invalid
    if (error.response?.status === 401) {
      console.log('🔓 Token expired/invalid, redirecting to login');
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Helper untuk handle berbagai format response Laravel
const handleResponse = (response: any) => {
  console.log('🔍 Processing response:', response);
  
  // Case 1: Response langsung array
  if (Array.isArray(response)) {
    console.log('✅ Format: Direct array');
    return response;
  }
  
  // Case 2: Response ada property 'data' yang array
  if (response && Array.isArray(response.data)) {
    console.log('✅ Format: { data: [...] }');
    return response.data;
  }
  
  // Case 3: Response ada property 'schools' yang array
  if (response && Array.isArray(response.schools)) {
    console.log('✅ Format: { schools: [...] }');
    return response.schools;
  }
  
  // Case 4: Response format Laravel Resource/Collection
  if (response && response.success !== undefined && Array.isArray(response.data)) {
    console.log('✅ Format: { success: true, data: [...] }');
    return response.data;
  }
  
  // Case 5: Response single object (wrap in array)
  if (response && typeof response === 'object' && response.id) {
    console.log('⚠️ Format: Single object, wrapping in array');
    return [response];
  }
  
  // Case 6: Empty or unknown format
  console.warn('❓ Unknown response format, returning empty array');
  console.log('Response:', response);
  return [];
};

export const schoolService = {
  getAll: async () => {
    try {
      console.log('🔄 Starting getAll()...');
      
      // Cek token sebelum request
      if (typeof window !== 'undefined') {
        const token = localStorage.getItem('token');
        if (!token) {
          console.error('❌ No token found! Redirect to login');
          window.location.href = '/login';
          throw new Error('No authentication token');
        }
        console.log('✅ Token found');
      }
      
      const response = await api.get('/school');
      console.log('✅ API call successful');
      
      const processedData = handleResponse(response.data);
      console.log('✅ Processed data length:', processedData.length);
      
      return processedData;
    } catch (error: any) {
      console.error('💥 SchoolService.getAll() failed:', {
        name: error.name,
        message: error.message,
        stack: error.stack,
        response: error.response?.data,
        status: error.response?.status,
        headers: error.response?.headers
      });
      
      // Re-throw error dengan pesan yang lebih jelas
      if (error.response?.data?.message) {
        throw new Error(`API Error: ${error.response.data.message}`);
      } else if (error.message.includes('Network Error')) {
        throw new Error('Tidak dapat terhubung ke server. Periksa koneksi atau URL API.');
      } else if (error.response?.status === 403) {
        throw new Error('Anda tidak memiliki izin untuk melihat data sekolah');
      } else if (error.response?.status === 404) {
        throw new Error('Endpoint API tidak ditemukan');
      } else {
        throw new Error(`Gagal mengambil data sekolah: ${error.message}`);
      }
    }
  },

  getById: async (id: string | number) => {
    try {
      console.log(`🔄 Fetching school ${id}...`);
      const response = await api.get(`/school/show/${id}`);
      return response.data;
    } catch (error: any) {
      console.error(`💥 Error fetching school ${id}:`, error);
      throw error;
    }
  },

  create: async (schoolData: any) => {
    try {
      console.log('🔄 Creating school...', schoolData);
      const response = await api.post('/school/store', schoolData);
      return response.data;
    } catch (error: any) {
      console.error('💥 Error creating school:', error);
      throw error;
    }
  },

  update: async (id: string | number, schoolData: any) => {
    try {
      console.log(`🔄 Updating school ${id}...`, schoolData);
      const response = await api.put(`/school/update/${id}`, schoolData);
      return response.data;
    } catch (error: any) {
      console.error(`💥 Error updating school ${id}:`, error);
      throw error;
    }
  },

  delete: async (id: string | number) => {
    try {
      console.log(`🔄 Deleting school ${id}...`);
      const response = await api.delete(`/school/delete/${id}`);
      return response.data;
    } catch (error: any) {
      console.error(`💥 Error deleting school ${id}:`, error);
      throw error;
    }
  }
};