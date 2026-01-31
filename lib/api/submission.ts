import axios from 'axios'

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://edusmart.test/api'

const api = axios.create({
  baseURL: API_URL,
})

/* ================= INTERCEPTOR TOKEN ================= */
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

/* ================= SERVICE ================= */
export const submissionService = {
  /**
   * LIST submission by assignment (ADMIN / GURU)
   */
  async getByAssignment(
    schoolId: number,
    subjectId: number,
    assignmentId: number
  ) {
    try {
      const response = await api.get(
        `/schools/${schoolId}/subjects/${subjectId}/assignments/${assignmentId}/submissions`
      )

      // kalau paginate() → response.data.data.data
      // kalau get() biasa → response.data.data
      return response.data?.data ?? []
    } catch (error: any) {
      console.error(
        '❌ getByAssignment error:',
        error.response?.data || error.message
      )
      return []
    }
  },

  /**
   * GRADING (UPDATE grade + status)
   */
  async grade(
    schoolId: number,
    subjectId: number,
    assignmentId: number,
    submissionId: number,
    payload: {
      grade: number
    }
  ) {
    try {
      const response = await api.put(
        `/schools/${schoolId}/subjects/${subjectId}/assignments/${assignmentId}/submissions/${submissionId}/grade`,
        payload
      )

      return response.data
    } catch (error: any) {
      console.error(
        '❌ grade submission error:',
        error.response?.data || error.message
      )
      throw error
    }
  },
}
