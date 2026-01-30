// @/lib/api/subject.ts
import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://edusmart.test/api';

const api = axios.create({
  baseURL: API_URL,
});

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

// Helper function untuk handle berbagai format response
const handleResponse = (response: any) => {
  console.log('API Response:', response);
  
  // Case 1: Response langsung array
  if (Array.isArray(response)) {
    return response;
  }
  
  // Case 2: Response ada property 'data' yang array
  if (response && Array.isArray(response.data)) {
    return response.data;
  }
  
  // Case 3: Response format Laravel Resource/Collection
  if (response && response.success !== undefined && Array.isArray(response.data)) {
    return response.data;
  }
  
  // Case 4: Response single object
  if (response && typeof response === 'object' && response.id) {
    return [response];
  }
  
  // Case 5: Empty response
  console.warn('Unknown response format:', response);
  return [];
};

export const subjectService = {
  // Ambil semua subjects untuk sekolah tertentu
  getBySchool: async (schoolId: number) => {
    try {
      console.log(`Fetching subjects for school ${schoolId}...`);
      const response = await api.get(`/school/${schoolId}/subject`);
      const processedData = handleResponse(response.data);
      console.log(`Subjects for school ${schoolId}:`, processedData);
      return processedData;
    } catch (error: any) {
      console.error(`Error get subjects for school ${schoolId}:`, error);
      // Return empty array jika error
      return [];
    }
  },

  // Ambil detail subject
  getById: async (schoolId: number, subjectId: number) => {
    try {
      const response = await api.get(`/school/${schoolId}/subject/show/${subjectId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error get subject:', error);
      throw error;
    }
  },

  // Buat subject baru
  create: async (schoolId: number, name: string) => {
    try {
      const response = await api.post(`/school/${schoolId}/subject/store`, { name });
      return response.data;
    } catch (error: any) {
      console.error('Error create subject:', error);
      throw error;
    }
  },

  // Update subject
  update: async (schoolId: number, subjectId: number, name: string) => {
    try {
      const response = await api.put(`/school/${schoolId}/subject/update/${subjectId}`, { name });
      return response.data;
    } catch (error: any) {
      console.error('Error update subject:', error);
      throw error;
    }
  },

  // Delete subject
  delete: async (schoolId: number, subjectId: number) => {
    try {
      const response = await api.delete(`/school/${schoolId}/subject/delete/${subjectId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error delete subject:', error);
      throw error;
    }
  }
};