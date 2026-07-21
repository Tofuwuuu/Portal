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

export interface Submission {
  id: number
  assignment_id: number
  student_id: number
  student_name?: string
  note: string
  is_done: boolean
  file_name?: string | null
  has_file?: boolean
  grade?: number | null
  feedback?: string | null
  graded_at?: string | null
  submitted_at: string
  updated_at: string
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
  submission_count?: number
  my_submission?: Submission | null
}

export interface TokenResponse {
  access_token: string
  token_type: string
}

export interface Meeting {
  id: number
  title: string
  description: string
  starts_at: string
  duration_minutes: number
  room_slug: string
  created_by: number
  created_at: string
  is_active: boolean
  time_status: 'upcoming' | 'live' | 'ended'
  creator_name?: string
}

