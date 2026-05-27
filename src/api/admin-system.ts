import apiClient from './client'
import type { ApiResponse, EmailHistoryResponse } from './types'

// ── System Monitor ──────────────────────────────────────
export interface SystemMonitorData {
  cpu: { percent: number }
  memory: { percent: number; usedGb: number; totalGb: number }
  disk: { percent: number; usedGb: number; totalGb: number }
}

export interface DbInfo {
  status: 'connected' | 'disconnected'
  activeConnections: number
  maxConnections: number
  idleConnections: number
  totalQueries: number
  avgLatencyMs: number
}

export interface RedisInfo {
  status: 'connected' | 'disconnected'
  memoryUsedMb: number
  memoryMaxMb: number
  connections: number
  hitRate: number
}

export const getSystemMonitor = () =>
  apiClient.get<ApiResponse<SystemMonitorData>>('/api/v1/admin/system/monitor')

export const getDbInfo = () =>
  apiClient.get<ApiResponse<DbInfo>>('/api/v1/admin/system/db')

export const getRedisInfo = () =>
  apiClient.get<ApiResponse<RedisInfo>>('/api/v1/admin/system/redis')

// ── Email ────────────────────────────────────────────────
export interface EmailStats {
  totalSent: number
  successRate: number
  bounceRate: number
  queuePending: number
  sentChange: number
  successRateChange: number
  bounceRateChange: number
}

export interface EmailHealth {
  status: 'connected' | 'disconnected'
  provider: string
  lastChecked: string
}

export const getEmailHistory = (params?: { limit?: number; offset?: number; status?: string }) =>
  apiClient.get<ApiResponse<EmailHistoryResponse>>('/api/v1/admin/email/history', { params })

export const getEmailStats = () =>
  apiClient.get<ApiResponse<EmailStats>>('/api/v1/admin/email/stats')

export const getEmailHealth = () =>
  apiClient.get<ApiResponse<EmailHealth>>('/api/v1/admin/email/health')
