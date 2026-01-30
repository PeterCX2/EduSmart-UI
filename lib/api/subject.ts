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

export const subjectService = {
  // Get subjects by school
  getBySchool: async (schoolId: number) => {
    try {
      const response = await api.get(`/school/${schoolId}/subject`);
      return response.data?.data || response.data || [];
    } catch (error: any) {
      console.error(`Error get subjects for school ${schoolId}:`, error);
      return [];
    }
  },

  getById: async (schoolId: number, subjectId: number) => {
    try {
      const response = await api.get(`/school/${schoolId}/subject/show/${subjectId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error get subject:', error);
      throw error;
    }
  },

  create: async (schoolId: number, name: string) => {
    try {
      const response = await api.post(`/school/${schoolId}/subject/store`, { name });
      return response.data;
    } catch (error: any) {
      console.error('Error create subject:', error);
      throw error;
    }
  },

  update: async (schoolId: number, subjectId: number, name: string) => {
    try {
      const response = await api.put(`/school/${schoolId}/subject/update/${subjectId}`, { name });
      return response.data;
    } catch (error: any) {
      console.error('Error update subject:', error);
      throw error;
    }
  },

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