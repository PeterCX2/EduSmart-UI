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

export const assignmentService = {
  getBySubject: async (schoolId: number, subjectId: number) => {
    try {
      const response = await api.get(
        `/school/${schoolId}/subject/${subjectId}/assignment`
      );

      const assignments = response.data?.data?.data || [];

      console.log(
        `✅ Assignments school ${schoolId} subject ${subjectId}:`,
        assignments
      );

      return assignments;
    } catch (error: any) {
      console.error("❌ getBySubject error:", error.response?.data || error.message);
      return [];
    }
  },

  getById: async (schoolId: number, subjectId: number, assignmentId: number) => {
    try {
      const response = await api.get(`/school/${schoolId}/subject/${subjectId}/assignment/show/${assignmentId}`);
      return response.data?.data || response.data;
    } catch (error: any) {
      console.error('Error get assignment:', error);
      throw error;
    }
  },

  create: async (schoolId: number, subjectId: number, data: any) => {
    try {
      const response = await api.post(`/school/${schoolId}/subject/${subjectId}/assignment/store`, data);
      return response.data?.data || response.data;
    } catch (error: any) {
      console.error('Error create assignment:', error);
      throw error;
    }
  },

  update: async (schoolId: number, subjectId: number, assignmentId: number, data: any) => {
    try {
      const response = await api.put(`/school/${schoolId}/subject/${subjectId}/assignment/update/${assignmentId}`, data);
      return response.data?.data || response.data;
    } catch (error: any) {
      console.error('Error update assignment:', error);
      throw error;
    }
  },

  delete: async (schoolId: number, subjectId: number, assignmentId: number) => {
    try {
      const response = await api.delete(`/school/${schoolId}/subject/${subjectId}/assignment/delete/${assignmentId}`);
      return response.data;
    } catch (error: any) {
      console.error('Error delete assignment:', error);
      throw error;
    }
  }
};