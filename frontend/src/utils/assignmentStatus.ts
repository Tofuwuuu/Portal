import type { Assignment, Submission } from '../types'

export type AssignmentSubmissionStatus = 'not_submitted' | 'submitted' | 'graded'

export function getAssignmentStatus(assignment: Assignment): AssignmentSubmissionStatus {
  const submission = assignment.my_submission
  if (!submission) return 'not_submitted'
  if (submission.grade != null) return 'graded'
  return 'submitted'
}

export function getStatusLabel(status: AssignmentSubmissionStatus): string {
  switch (status) {
    case 'not_submitted':
      return 'Not submitted'
    case 'submitted':
      return 'Submitted'
    case 'graded':
      return 'Graded'
  }
}

export function getStatusBadgeClass(status: AssignmentSubmissionStatus): string {
  switch (status) {
    case 'not_submitted':
      return 'bg-slate-100 text-slate-600'
    case 'submitted':
      return 'bg-emerald-50 text-emerald-700'
    case 'graded':
      return 'bg-blue-50 text-blue-700'
  }
}

export function getTurnInLabel(status: AssignmentSubmissionStatus): string {
  switch (status) {
    case 'not_submitted':
      return 'Turn in'
    case 'submitted':
      return 'Update submission'
    case 'graded':
      return 'View submission'
  }
}

export function matchesStatusFilter(
  assignment: Assignment,
  filter: AssignmentSubmissionStatus | 'all'
): boolean {
  if (filter === 'all') return true
  return getAssignmentStatus(assignment) === filter
}

export function countByStatus(
  assignments: Assignment[],
  status: AssignmentSubmissionStatus
): number {
  return assignments.filter((a) => getAssignmentStatus(a) === status).length
}

export function hasSubmission(submission?: Submission | null): boolean {
  return Boolean(submission)
}
