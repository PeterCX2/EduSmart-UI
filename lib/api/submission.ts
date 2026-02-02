import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://edusmart.test/api'

const api = axios.create({
  baseURL: API_URL,
})

api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Helper untuk debug
api.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      url: response.config.url,
      status: response.status,
      data: response.data
    })
    return response
  },
  (error) => {
    console.error('❌ API Error:', {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      data: error.response?.data,
      message: error.message
    })
    return Promise.reject(error)
  }
)

export const submissionService = {
  // GET submissions by assignment
  async getByAssignment(schoolId: number, subjectId: number, assignmentId: number) {
    try {
      console.log(`📥 Fetching submissions: schools/${schoolId}/subjects/${subjectId}/assignments/${assignmentId}/submissions`)
      
      const res = await api.get(
        `/schools/${schoolId}/subjects/${subjectId}/assignments/${assignmentId}/submissions`
      )
      return res.data?.data ?? []
    } catch (error: any) {
      console.error('Error getting submissions:', error)
      return []
    }
  },

  // GET my submissions (for student)
  async getMySubmissions(schoolId: number, subjectId: number, assignmentId: number) {
    try {
      const res = await api.get(
        `/schools/${schoolId}/subjects/${subjectId}/assignments/${assignmentId}/submissions/student`
      )
      return res.data?.data ?? []
    } catch (error: any) {
      console.error('Error getting my submissions:', error)
      return []
    }
  },

  // SUBMIT new assignment - FIXED!
  async submit(schoolId: number, subjectId: number, assignmentId: number, formData: FormData) {
    try {
      console.log('📤 Submitting to:', {
        schoolId,
        subjectId,
        assignmentId
      })
      
      // Debug FormData contents
      console.log('📦 FormData contents:')
      for (let pair of formData.entries()) {
        console.log(`${pair[0]}:`, pair[1])
      }

      const res = await api.post(
        `/schools/${schoolId}/subjects/${subjectId}/assignments/${assignmentId}/submissions/store`,
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        }
      )
      
      console.log('✅ Submit success:', res.data)
      return res.data
      
    } catch (error: any) {
      console.error('❌ Submit failed:', {
        status: error.response?.status,
        data: error.response?.data,
        message: error.message
      })
      throw error
    }
  },

  // GRADE submission
  async grade(schoolId: number, subjectId: number, assignmentId: number, submissionId: number, payload: { grade: number }) {
    try {
      const res = await api.put(
        `/schools/${schoolId}/subjects/${subjectId}/assignments/${assignmentId}/submissions/${submissionId}/grade`,
        payload
      )
      return res.data
    } catch (error: any) {
      console.error('Error grading submission:', error)
      throw error
    }
  },

  // SAVE feedback
  async saveFeedback(schoolId: number, subjectId: number, assignmentId: number, submissionId: number, payload: { feedback: string }) {
    try {
      const res = await api.post(
        `/schools/${schoolId}/subjects/${subjectId}/assignments/${assignmentId}/submissions/${submissionId}/feedbacks/store`,
        payload
      )
      return res.data
    } catch (error: any) {
      console.error('Error saving feedback:', error)
      throw error
    }
  },

  // DELETE submission
  async delete(schoolId: number, subjectId: number, assignmentId: number, submissionId: number) {
    try {
      const res = await api.delete(
        `/schools/${schoolId}/subjects/${subjectId}/assignments/${assignmentId}/submissions/${submissionId}/delete`
      )
      return res.data
    } catch (error: any) {
      console.error('Error deleting submission:', error)
      throw error
    }
  }
}