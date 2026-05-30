import apiClient from './client'
import type {
  ApiResponse,
  EmailHistoryResponse,
  EmailTemplate,
  EmailTemplateCreate,
  EmailTemplateUpdate,
} from './types'

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

interface SystemMonitorBackendData {
  cpu: { usage: number; cores: number }
  memory: { used: number; total: number; usagePercent: number }
  disk: { used: number; total: number; usagePercent: number }
  uptime: number
}

interface DbInfoBackendData {
  activeConnections: number
  maxConnections: number
  idleConnections: number
  totalQueries: number
  avgLatencyMs: number
}

interface RedisInfoBackendData {
  memoryUsed: number
  memoryTotal: number
  connectedClients: number
  hitRate: number
}

function mbToGb(value: number) {
  return Math.round((value / 1024) * 10) / 10
}

function mapSystemMonitor(data: SystemMonitorBackendData): SystemMonitorData {
  return {
    cpu: { percent: data.cpu.usage },
    memory: {
      percent: data.memory.usagePercent,
      usedGb: mbToGb(data.memory.used),
      totalGb: mbToGb(data.memory.total),
    },
    disk: {
      percent: data.disk.usagePercent,
      usedGb: mbToGb(data.disk.used),
      totalGb: mbToGb(data.disk.total),
    },
  }
}

function mapDbInfo(data: DbInfoBackendData): DbInfo {
  return {
    status: 'connected',
    activeConnections: data.activeConnections,
    maxConnections: data.maxConnections,
    idleConnections: data.idleConnections,
    totalQueries: data.totalQueries,
    avgLatencyMs: data.avgLatencyMs,
  }
}

function mapRedisInfo(data: RedisInfoBackendData): RedisInfo {
  return {
    status: data.memoryTotal > 0 || data.connectedClients > 0 ? 'connected' : 'disconnected',
    memoryUsedMb: data.memoryUsed,
    memoryMaxMb: data.memoryTotal,
    connections: data.connectedClients,
    hitRate: data.hitRate,
  }
}

export const getSystemMonitor = () =>
  apiClient
    .get<ApiResponse<SystemMonitorBackendData>>('/daodao-server/api/v1/admin/system/monitor')
    .then((res) => ({
      ...res,
      data: { ...res.data, data: mapSystemMonitor(res.data.data) },
    }))

export const getDbInfo = () =>
  apiClient
    .get<ApiResponse<DbInfoBackendData>>('/daodao-server/api/v1/admin/system/db-info')
    .then((res) => ({
      ...res,
      data: { ...res.data, data: mapDbInfo(res.data.data) },
    }))

export const getRedisInfo = () =>
  apiClient
    .get<ApiResponse<RedisInfoBackendData>>('/daodao-server/api/v1/admin/system/redis-info')
    .then((res) => ({
      ...res,
      data: { ...res.data, data: mapRedisInfo(res.data.data) },
    }))

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

interface EmailStatsBackendData {
  totalSent: number
  successRate: number
  bounceRate: number
  queueSize: number
}

interface EmailHealthBackendData {
  status: 'healthy' | 'degraded' | 'down'
  smtpConnection: boolean
  queueSize: number
  lastError: string | null
}

interface EmailHistoryBackendRecord {
  id: number
  recipientEmail: string | null
  recipientName: string | null
  emailType: string
  subject: string | null
  status: 'sent' | 'failed' | 'pending'
  sentAt: string | null
}

interface EmailHistoryBackendResponse {
  records: EmailHistoryBackendRecord[]
  pagination: {
    currentPage: number
    totalPages: number
    totalCount: number
    hasNext: boolean
    hasPrev: boolean
    limit: number
  }
  stats: {
    totalRecords: number
    sentCount: number
    failedCount: number
    successRate: number
  }
}

function mapEmailStats(data: EmailStatsBackendData): EmailStats {
  return {
    totalSent: data.totalSent,
    successRate: data.successRate,
    bounceRate: data.bounceRate,
    queuePending: data.queueSize,
    sentChange: 0,
    successRateChange: 0,
    bounceRateChange: 0,
  }
}

function mapEmailHealth(data: EmailHealthBackendData): EmailHealth {
  return {
    status: data.status === 'healthy' && data.smtpConnection ? 'connected' : 'disconnected',
    provider: 'SMTP',
    lastChecked: data.lastError ?? '剛剛',
  }
}

function mapEmailHistory(data: EmailHistoryBackendResponse): EmailHistoryResponse {
  return {
    items: data.records.map((record) => ({
      id: record.id,
      recipient: record.recipientEmail ?? '—',
      recipientName: record.recipientName ?? null,
      subject: record.subject ?? '—',
      status: record.status,
      sentAt: record.sentAt ?? '',
      type: record.emailType,
    })),
    summary: {
      totalSent: data.stats.totalRecords,
      successCount: data.stats.sentCount,
      failedCount: data.stats.failedCount,
      successRate: data.stats.successRate,
    },
    pagination: {
      total_count: data.pagination.totalCount,
      limit: data.pagination.limit,
      offset: (data.pagination.currentPage - 1) * data.pagination.limit,
      has_next: data.pagination.hasNext,
    },
  }
}

export const getEmailHistory = (params?: { limit?: number; offset?: number; status?: string }) =>
  apiClient
    .get<ApiResponse<EmailHistoryBackendResponse>>('/daodao-server/api/v1/admin/email/history', {
      params,
    })
    .then((res) => ({
      ...res,
      data: { ...res.data, data: mapEmailHistory(res.data.data) },
    }))

export const getEmailStats = () =>
  apiClient
    .get<ApiResponse<EmailStatsBackendData>>('/daodao-server/api/v1/admin/email/stats')
    .then((res) => ({
      ...res,
      data: { ...res.data, data: mapEmailStats(res.data.data) },
    }))

export const getEmailHealth = () =>
  apiClient
    .get<ApiResponse<EmailHealthBackendData>>('/daodao-server/api/v1/admin/email/health')
    .then((res) => ({
      ...res,
      data: { ...res.data, data: mapEmailHealth(res.data.data) },
    }))

export interface SendCustomEmailPayload {
  to: string
  subject: string
  htmlContent: string
}

export const sendCustomEmail = (data: SendCustomEmailPayload) =>
  apiClient.post<ApiResponse<{ sent: boolean; to: string }>>(
    '/daodao-server/api/v1/admin/email/send',
    {
      to: data.to,
      subject: data.subject,
      body: data.htmlContent,
    },
  )

export interface RetryFailedEmailsResult {
  retried: number
  failed: number
}

export const retryFailedEmails = (limit?: number) =>
  apiClient.post<ApiResponse<RetryFailedEmailsResult>>('/daodao-server/api/v1/email/retry-failed', {
    limit,
  })

export const retrySingleEmail = (logId: number) =>
  apiClient.post<ApiResponse<{ retried: boolean }>>(`/daodao-server/api/v1/email/retry/${logId}`)

export interface EmailHistoryParams {
  status?: string
  emailType?: string
  recipient?: string
  startDate?: string
  endDate?: string
  page?: number
  limit?: number
  sortBy?: 'sentAt' | 'createdAt'
  sortOrder?: 'asc' | 'desc'
}

export const getEmailHistoryFiltered = (params: EmailHistoryParams) =>
  apiClient
    .get<ApiResponse<EmailHistoryBackendResponse>>('/daodao-server/api/v1/admin/email/history', {
      params,
    })
    .then((res) => ({
      ...res,
      data: { ...res.data, data: mapEmailHistory(res.data.data) },
    }))

// ── Email Templates ──────────────────────────────────────────────────────────
export const listEmailTemplates = () =>
  apiClient.get<ApiResponse<EmailTemplate[]>>('/daodao-server/api/v1/admin/email-templates')

export const createEmailTemplate = (data: EmailTemplateCreate) =>
  apiClient.post<ApiResponse<EmailTemplate>>('/daodao-server/api/v1/admin/email-templates', data)

export const updateEmailTemplate = (id: number, data: EmailTemplateUpdate) =>
  apiClient.put<ApiResponse<EmailTemplate>>(
    `/daodao-server/api/v1/admin/email-templates/${id}`,
    data,
  )

export const deleteEmailTemplate = (id: number) =>
  apiClient.delete<ApiResponse<{ deleted: boolean; id: number }>>(
    `/daodao-server/api/v1/admin/email-templates/${id}`,
  )

export const getEmailTemplate = (id: number) =>
  apiClient.get<ApiResponse<EmailTemplate>>(`/daodao-server/api/v1/admin/email-templates/${id}`)
