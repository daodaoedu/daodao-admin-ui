import apiClient from './client'
import type { ApiResponse } from './types'

// ── Events ────────────────────────────────────────────────

export interface AdminEvent {
  id: number
  name: string
  date: string
  time: string
  location: string
  locationType: 'online' | 'offline'
  rsvp: number
  capacity: number | null
  waitlist: number
  status?: 'upcoming' | 'past'
}

export interface AdminEventCreate {
  name: string
  date: string
  time: string
  location: string
  locationType: 'online' | 'offline'
  capacity?: number | null
}

export interface AdminEventUpdate {
  name?: string
  date?: string
  time?: string
  location?: string
  locationType?: 'online' | 'offline'
  capacity?: number | null
}

export const listEvents = (params?: { status?: string; limit?: number; offset?: number }) =>
  apiClient.get<ApiResponse<AdminEvent[]>>('/daodao-server/api/v1/admin/events', { params })

export const createEvent = (data: AdminEventCreate) =>
  apiClient.post<ApiResponse<AdminEvent>>('/daodao-server/api/v1/admin/events', data)

export const updateEvent = (id: number, data: AdminEventUpdate) =>
  apiClient.put<ApiResponse<AdminEvent>>(`/daodao-server/api/v1/admin/events/${id}`, data)

export const deleteEvent = (id: number) =>
  apiClient.delete<ApiResponse<{ deleted: boolean }>>(`/daodao-server/api/v1/admin/events/${id}`)

// ── RSVPs ─────────────────────────────────────────────────

export interface RSVPEntry {
  id: number
  user: string
  status: 'registered' | 'waitlist' | 'attended' | 'no-show'
  time: string
}

export const getEventRSVPs = (id: number) =>
  apiClient.get<ApiResponse<RSVPEntry[]>>(`/daodao-server/api/v1/admin/events/${id}/rsvps`)

export const checkinUser = (id: number, data: { userId: number }) =>
  apiClient.post<ApiResponse<{ success: boolean }>>(
    `/daodao-server/api/v1/admin/events/${id}/checkin`,
    data,
  )

// ── Analytics ─────────────────────────────────────────────

export interface EventAnalytics {
  rsvpCount: number
  attendedCount: number
  noShowCount: number
  waitlistCount: number
  [key: string]: unknown
}

export const getEventAnalytics = (id: number) =>
  apiClient.get<ApiResponse<EventAnalytics>>(`/daodao-server/api/v1/admin/events/${id}/analytics`)

// ── Templates ─────────────────────────────────────────────

export interface EventTemplate {
  id: number
  name: string
  frequency: string
  nextSession: string
  totalGenerated: number
}

export interface EventTemplateCreate {
  name: string
  frequency: string
  baseEvent: Omit<AdminEventCreate, 'date'>
}

export const listEventTemplates = () =>
  apiClient.get<ApiResponse<EventTemplate[]>>('/daodao-server/api/v1/admin/events/templates')

export const createEventTemplate = (data: EventTemplateCreate) =>
  apiClient.post<ApiResponse<EventTemplate>>('/daodao-server/api/v1/admin/events/templates', data)

export const generateFromTemplate = (id: number, data: { date: string }) =>
  apiClient.post<ApiResponse<AdminEvent>>(
    `/daodao-server/api/v1/admin/events/templates/${id}/generate`,
    data,
  )

// ── Recordings ────────────────────────────────────────────

export interface EventRecording {
  id: number
  eventId: number
  url: string
  uploadedAt: string
  duration?: number
}

export const getEventRecordings = (id: number) =>
  apiClient.get<ApiResponse<EventRecording[]>>(
    `/daodao-server/api/v1/admin/events/${id}/recordings`,
  )

export const uploadEventRecording = (id: number, data: FormData) =>
  apiClient.post<ApiResponse<EventRecording>>(
    `/daodao-server/api/v1/admin/events/${id}/recordings`,
    data,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  )

export const deleteEventRecording = (id: number) =>
  apiClient.delete<ApiResponse<{ deleted: boolean }>>(
    `/daodao-server/api/v1/admin/events/recordings/${id}`,
  )

// ── Reminders ─────────────────────────────────────────────

export const sendEventReminder = (id: number, data?: { message?: string }) =>
  apiClient.post<ApiResponse<{ sent: number }>>(
    `/daodao-server/api/v1/admin/events/${id}/remind`,
    data ?? {},
  )
