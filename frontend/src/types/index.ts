export type UserRole = 'student' | 'teacher'

export interface User {
  id: number
  email: string
  full_name: string
  role: UserRole
  created_at: string
}

export interface Activity {
  id: number
  title: string
  description: string
  date: string
  created_by: number
  created_at: string
  is_published: boolean
  is_archived: boolean
  creator_name?: string
}

export interface Assignment {
  id: number
  title: string
  description: string
  due_date: string
  created_by: number
  created_at: string
  is_published: boolean
  is_archived: boolean
  creator_name?: string
}

export interface TokenResponse {
  access_token: string
  token_type: string
}
