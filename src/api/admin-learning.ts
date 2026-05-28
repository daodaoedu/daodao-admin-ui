import apiClient from './client'
import type { ApiResponse } from './types'

// ── Types ─────────────────────────────────────────────────

export interface LearningCourse {
  id: string
  name: string
  enrolled: number
  completionRate: number
  avgProgress: number
  stuckLesson: string
}

export interface CourseDropOff {
  lesson: string
  dropOffRate: number
  count: number
}

export interface StalledUser {
  user: string
  course: string
  progress: number
  stalledDays: number
}

export interface CohortComparison {
  cohort: string
  avgProgress: number
  completionRate: number
}

export interface DripSchedule {
  id: string
  course: string
  module: string
  condition: string
  conditionType: 'days' | 'date'
  unlocked: number
  waiting: number
}

export interface DripScheduleCreate {
  course: string
  module: string
  condition: string
  conditionType: 'days' | 'date'
}

export interface Quiz {
  id: string
  name: string
  course: string
  questions: number
  passingScore: number
  avgScore: number
  passRate: number
}

export interface QuizCreate {
  name: string
  course: string
  passingScore: number
}

export interface QuizQuestion {
  id: string
  question: string
  type: string
  correctRate: number
  commonWrong: string
}

export interface QuizQuestionCreate {
  question: string
  type: string
  options?: string[]
  answer: string
}

export interface QuizStats {
  totalAttempts: number
  avgScore: number
  passRate: number
  questions: QuizQuestion[]
}

export interface CertificateTemplate {
  id: string
  name: string
  criteria: string
  issued: number
  color: string
}

export interface CertificateTemplateCreate {
  name: string
  criteria: string
  color?: string
}

export interface IssuedCertificate {
  id: string
  cert: string
  user: string
  date: string
  link: string
  status: 'active' | 'revoked'
}

export interface CertificateIssueRequest {
  templateId: string
  userId: string
}

export interface CertificateBulkIssueRequest {
  templateId: string
  userIds: string[]
}

export interface LearningPath {
  id: string
  name: string
  description: string
  courses: string[]
  enrolled: number
  completionRate: number
}

export interface LearningPathCreate {
  name: string
  description: string
  courses: string[]
}

export interface LearningPathUpdate {
  name?: string
  description?: string
  courses?: string[]
}

export interface LearningPathAnalytics {
  enrolled: number
  completionRate: number
  avgProgress: number
  dropOffStage: string
}

// ── Courses / Progress ────────────────────────────────────

export function listLearningCourses() {
  return apiClient.get<ApiResponse<LearningCourse[]>>(
    '/daodao-server/api/v1/admin/learning/courses',
  )
}

export function getCourseDropOff(courseId: string) {
  return apiClient.get<ApiResponse<CourseDropOff[]>>(
    `/daodao-server/api/v1/admin/learning/courses/${courseId}/drop-off`,
  )
}

export function getCoursesStalledUsers(courseId: string) {
  return apiClient.get<ApiResponse<StalledUser[]>>(
    `/daodao-server/api/v1/admin/learning/courses/${courseId}/stalled-users`,
  )
}

export function getCourseCohortComparison() {
  return apiClient.get<ApiResponse<CohortComparison[]>>(
    '/daodao-server/api/v1/admin/learning/courses/cohort-comparison',
  )
}

// ── Drip Schedules ────────────────────────────────────────

export function listDripSchedules() {
  return apiClient.get<ApiResponse<DripSchedule[]>>(
    '/daodao-server/api/v1/admin/learning/drip-schedules',
  )
}

export function createDripSchedule(data: DripScheduleCreate) {
  return apiClient.post<ApiResponse<DripSchedule>>(
    '/daodao-server/api/v1/admin/learning/drip-schedules',
    data,
  )
}

export function deleteDripSchedule(id: string) {
  return apiClient.delete<ApiResponse<null>>(
    `/daodao-server/api/v1/admin/learning/drip-schedules/${id}`,
  )
}

export function manualUnlockDripSchedule(id: string, userId: string) {
  return apiClient.post<ApiResponse<null>>(
    `/daodao-server/api/v1/admin/learning/drip-schedules/${id}/manual-unlock`,
    { userId },
  )
}

// ── Quizzes ───────────────────────────────────────────────

export function listQuizzes() {
  return apiClient.get<ApiResponse<Quiz[]>>('/daodao-server/api/v1/admin/learning/quizzes')
}

export function createQuiz(data: QuizCreate) {
  return apiClient.post<ApiResponse<Quiz>>('/daodao-server/api/v1/admin/learning/quizzes', data)
}

export function deleteQuiz(quizId: string) {
  return apiClient.delete<ApiResponse<null>>(
    `/daodao-server/api/v1/admin/learning/quizzes/${quizId}`,
  )
}

export function listQuizQuestions(quizId: string) {
  return apiClient.get<ApiResponse<QuizQuestion[]>>(
    `/daodao-server/api/v1/admin/learning/quizzes/${quizId}/questions`,
  )
}

export function addQuizQuestion(quizId: string, data: QuizQuestionCreate) {
  return apiClient.post<ApiResponse<QuizQuestion>>(
    `/daodao-server/api/v1/admin/learning/quizzes/${quizId}/questions`,
    data,
  )
}

export function deleteQuizQuestion(questionId: string) {
  return apiClient.delete<ApiResponse<null>>(
    `/daodao-server/api/v1/admin/learning/quizzes/questions/${questionId}`,
  )
}

export function getQuizStats(quizId: string) {
  return apiClient.get<ApiResponse<QuizStats>>(
    `/daodao-server/api/v1/admin/learning/quizzes/${quizId}/stats`,
  )
}

// ── Certificates ──────────────────────────────────────────

export function listCertificateTemplates() {
  return apiClient.get<ApiResponse<CertificateTemplate[]>>(
    '/daodao-server/api/v1/admin/learning/certificates/templates',
  )
}

export function createCertificateTemplate(data: CertificateTemplateCreate) {
  return apiClient.post<ApiResponse<CertificateTemplate>>(
    '/daodao-server/api/v1/admin/learning/certificates/templates',
    data,
  )
}

export function deleteCertificateTemplate(id: string) {
  return apiClient.delete<ApiResponse<null>>(
    `/daodao-server/api/v1/admin/learning/certificates/templates/${id}`,
  )
}

export function issueCertificate(data: CertificateIssueRequest) {
  return apiClient.post<ApiResponse<IssuedCertificate>>(
    '/daodao-server/api/v1/admin/learning/certificates/issue',
    data,
  )
}

export function bulkIssueCertificates(data: CertificateBulkIssueRequest) {
  return apiClient.post<ApiResponse<IssuedCertificate[]>>(
    '/daodao-server/api/v1/admin/learning/certificates/bulk-issue',
    data,
  )
}

export function listIssuedCertificates() {
  return apiClient.get<ApiResponse<IssuedCertificate[]>>(
    '/daodao-server/api/v1/admin/learning/certificates',
  )
}

// ── Learning Paths ────────────────────────────────────────

export function listLearningPaths() {
  return apiClient.get<ApiResponse<LearningPath[]>>('/daodao-server/api/v1/admin/learning/paths')
}

export function createLearningPath(data: LearningPathCreate) {
  return apiClient.post<ApiResponse<LearningPath>>(
    '/daodao-server/api/v1/admin/learning/paths',
    data,
  )
}

export function updateLearningPath(id: string, data: LearningPathUpdate) {
  return apiClient.put<ApiResponse<LearningPath>>(
    `/daodao-server/api/v1/admin/learning/paths/${id}`,
    data,
  )
}

export function deleteLearningPath(id: string) {
  return apiClient.delete<ApiResponse<null>>(`/daodao-server/api/v1/admin/learning/paths/${id}`)
}

export function getLearningPathAnalytics(id: string) {
  return apiClient.get<ApiResponse<LearningPathAnalytics>>(
    `/daodao-server/api/v1/admin/learning/paths/${id}/analytics`,
  )
}
