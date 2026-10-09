/**
 * 郵件發送紀錄（email_logs.status）的顯示對照。
 * skipped：後台停用該類型模板，信沒寄出但留紀錄（server EMAIL_STATUS.SKIPPED，daodao#236／#292）。
 */
export const EMAIL_HISTORY_STATUSES = ['sent', 'failed', 'pending', 'skipped'] as const

export type EmailHistoryStatus = (typeof EMAIL_HISTORY_STATUSES)[number]

const STATUS_LABEL: Record<EmailHistoryStatus, string> = {
  sent: '已發送',
  failed: '失敗',
  pending: '待發送',
  skipped: '略過',
}

const STATUS_BADGE: Record<EmailHistoryStatus, string> = {
  sent: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
  pending: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  skipped: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-300',
}

const FALLBACK_BADGE = 'bg-gray-100 text-gray-700'

function isKnownStatus(status: string): status is EmailHistoryStatus {
  return (EMAIL_HISTORY_STATUSES as readonly string[]).includes(status)
}

/** 狀態欄顯示文字；未知狀態原樣顯示，不吞掉資料 */
export function emailHistoryStatusLabel(status: string): string {
  return isKnownStatus(status) ? STATUS_LABEL[status] : status
}

export function emailHistoryStatusBadge(status: string): string {
  return isKnownStatus(status) ? STATUS_BADGE[status] : FALLBACK_BADGE
}

/** 狀態篩選選項；value 空字串代表不篩選 */
export const EMAIL_HISTORY_STATUS_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  { value: '', label: '全部狀態' },
  ...EMAIL_HISTORY_STATUSES.map((status) => ({ value: status, label: STATUS_LABEL[status] })),
]
