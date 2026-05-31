import type { RoadmapStatus, WishCategory, WishStatus } from '@/api/types'

export const CATEGORY_LABELS: Record<WishCategory, string> = {
  operation: '營運',
  practice: '實踐',
  social: '社群',
  explore: '探索',
  challenge: '挑戰',
  ai: 'AI',
  profile: '個人檔案',
  other: '其他',
}

export const WISH_STATUS_LABELS: Record<WishStatus, string> = {
  pending: '待處理',
  linked: '已歸併',
  archived: '已封存',
}

export const ROADMAP_STATUS_LABELS: Record<RoadmapStatus, string> = {
  collected: '已收集',
  discussing: '討論中',
  planned: '已排程',
  in_progress: '進行中',
  done: '已完成',
  parked: '暫不考慮',
}

export const CATEGORY_OPTIONS = (Object.keys(CATEGORY_LABELS) as WishCategory[]).map((value) => ({
  value,
  label: CATEGORY_LABELS[value],
}))

export const WISH_STATUS_OPTIONS = (Object.keys(WISH_STATUS_LABELS) as WishStatus[]).map(
  (value) => ({ value, label: WISH_STATUS_LABELS[value] }),
)

export const ROADMAP_STATUS_OPTIONS = (Object.keys(ROADMAP_STATUS_LABELS) as RoadmapStatus[]).map(
  (value) => ({ value, label: ROADMAP_STATUS_LABELS[value] }),
)
