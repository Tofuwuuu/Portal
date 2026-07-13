import axios from 'axios'
import type { Activity, Assignment, Meeting, Submission, TokenResponse, User, UserRole } from '../types'


const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const authApi = {
  register: (data: {
    email: string
    password: string
    full_name: string
    role: UserRole
  }) => api.post<User>('/auth/register', data),

  login: (email: string, password: string) =>
    api.post<TokenResponse>('/auth/login/json', { email, password }),

  me: () => api.get<User>('/auth/me'),
}

export const activitiesApi = {
  list: (includeArchived = false) =>
    api.get<Activity[]>('/activities', { params: { include_archived: includeArchived } }),
  create: (data: { title: string; description: string; date: string }) =>
    api.post<Activity>('/activities', data),
  update: (id: number, data: { title: string; description: string; date: string }) =>
    api.put<Activity>(`/activities/${id}`, data),
  publish: (id: number) => api.post<Activity>(`/activities/${id}/publish`),
  unpublish: (id: number) => api.post<Activity>(`/activities/${id}/unpublish`),
  archive: (id: number) => api.post<Activity>(`/activities/${id}/archive`),
  unarchive: (id: number) => api.post<Activity>(`/activities/${id}/unarchive`),
  remove: (id: number) => api.delete(`/activities/${id}`),
}

export const assignmentsApi = {
  list: (includeArchived = false) =>
    api.get<Assignment[]>('/assignments', { params: { include_archived: includeArchived } }),
  create: (data: { title: string; description: string; due_date: string }) =>
    api.post<Assignment>('/assignments', data),
  update: (id: number, data: { title: string; description: string; due_date: string }) =>
    api.put<Assignment>(`/assignments/${id}`, data),
  publish: (id: number) => api.post<Assignment>(`/assignments/${id}/publish`),
  unpublish: (id: number) => api.post<Assignment>(`/assignments/${id}/unpublish`),
  archive: (id: number) => api.post<Assignment>(`/assignments/${id}/archive`),
  unarchive: (id: number) => api.post<Assignment>(`/assignments/${id}/unarchive`),
  remove: (id: number) => api.delete(`/assignments/${id}`),
  submit: (id: number, data: { note: string; is_done: boolean; file?: File | null }) => {
    const formData = new FormData()
    formData.append('note', data.note)
    formData.append('is_done', String(data.is_done))
    if (data.file) {
      formData.append('file', data.file)
    }
    return api.post<Submission>(`/assignments/${id}/submit`, formData)
  },
  listSubmissions: (id: number) => api.get<Submission[]>(`/assignments/${id}/submissions`),
  downloadFileUrl: (assignmentId: number, submissionId: number) => {
    const base = (import.meta.env.VITE_API_URL || '/api').replace(/\/$/, '')
    return `${base}/assignments/${assignmentId}/submissions/${submissionId}/file`
  },
}

export const meetingsApi = {
  list: () => api.get<Meeting[]>('/meetings'),
  get: (id: number) => api.get<Meeting>(`/meetings/${id}`),
  create: (data: { title: string; description: string; starts_at: string }) =>
    api.post<Meeting>('/meetings', data),
  update: (id: number, data: { title: string; description: string; starts_at: string }) =>
    api.patch<Meeting>(`/meetings/${id}`, data),
  end: (id: number) => api.post<Meeting>(`/meetings/${id}/end`),
  remove: (id: number) => api.delete(`/meetings/${id}`),
}

export default api
