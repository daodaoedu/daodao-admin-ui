import apiClient from './client'
import type { ApiResponse } from './types'

// ── User Management, Tags, Analytics ─────────────────────

export const getAdminOverview = () =>
  apiClient.get<ApiResponse<unknown>>('/api/v1/admin/dashboard/overview')

export const getAdminActiveUsers = () =>
  apiClient.get<ApiResponse<unknown>>('/api/v1/admin/dashboard/active-users')

// TODO: implement remaining user management endpoints
