import axios from 'axios'

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://edusmart.test/api'

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

export const submissionService = {
  async getByAssignment(
    schoolId: number,
    subjectId: number,
    assignmentId: number
  ) {
    const res = await api.get(
      `/schools/${schoolId}/subjects/${subjectId}/assignments/${assignmentId}/submissions`
    )
    return res.data?.data ?? []
  },

  async grade(
    schoolId: number,
    subjectId: number,
    assignmentId: number,
    submissionId: number,
    payload: { grade: number }
  ) {
    const res = await api.put(
      `/schools/${schoolId}/subjects/${subjectId}/assignments/${assignmentId}/submissions/${submissionId}/grade`,
      payload
    )
    return res.data
  },

  async saveFeedback(
    schoolId: number,
    subjectId: number,
    assignmentId: number,
    submissionId: number,
    payload: { feedback: string }
  ) {
    const res = await api.post(
      `/schools/${schoolId}/subjects/${subjectId}/assignments/${assignmentId}/submissions/${submissionId}/feedbacks/store`,
      payload
    )
    return res.data
  },
}
