import { useQuery } from '@tanstack/react-query'
import {
  getEventAnalytics,
  getEventRecordings,
  getEventRSVPs,
  listEvents,
  listEventTemplates,
} from '@/api/admin-events'

export function useEvents(params?: { status?: string; limit?: number; offset?: number }) {
  return useQuery({
    queryKey: ['admin', 'events', params],
    queryFn: () => listEvents(params).then((r) => r.data.data),
  })
}

export function useEventRSVPs(eventId: number | null) {
  return useQuery({
    queryKey: ['admin', 'events', eventId, 'rsvps'],
    queryFn: () => getEventRSVPs(eventId as number).then((r) => r.data.data),
    enabled: eventId !== null,
  })
}

export function useEventAnalytics(eventId: number | null) {
  return useQuery({
    queryKey: ['admin', 'events', eventId, 'analytics'],
    queryFn: () => getEventAnalytics(eventId as number).then((r) => r.data.data),
    enabled: eventId !== null,
  })
}

export function useEventTemplates() {
  return useQuery({
    queryKey: ['admin', 'events', 'templates'],
    queryFn: () => listEventTemplates().then((r) => r.data.data),
  })
}

export function useEventRecordings(eventId: number | null) {
  return useQuery({
    queryKey: ['admin', 'events', eventId, 'recordings'],
    queryFn: () => getEventRecordings(eventId as number).then((r) => r.data.data),
    enabled: eventId !== null,
  })
}
