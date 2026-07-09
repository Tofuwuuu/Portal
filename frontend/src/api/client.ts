import axios from 'axios'
import type { Activity, Assignment, TokenResponse, User, UserRole } from '../types'

const api = axios.create({
  baseURL: '/api',
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
  list: () => api.get<Activity[]>('/activities'),
  create: (data: { title: string; description: string; date: string }) =>
    api.post<Activity>('/activities', data),
}

export const assignmentsApi = {
  list: () => api.get<Assignment[]>('/assignments'),
  create: (data: { title: string; description: string; due_date: string }) =>
    api.post<Assignment>('/assignments', data),
}

export default api
