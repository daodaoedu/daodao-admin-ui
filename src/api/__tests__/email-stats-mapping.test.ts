import { describe, expect, it } from 'vitest'
import { mapEmailHistory, mapEmailStats } from '../admin-system'

// daodao#294：統計把「略過」(skipped) 另外列出，不算進已發送
describe('mapEmailStats', () => {
  const base = {
    totalSent: 546,
    successRate: 100,
    bounceRate: 0,
    queueSize: 0,
    sentChange: 0,
    successRateChange: 0,
    bounceRateChange: 0,
  }

  it('帶出後端回傳的略過數量', () => {
    expect(mapEmailStats({ ...base, skippedCount: 11 }).skippedCount).toBe(11)
  })

  it('後端還沒部署 skippedCount 時顯示 0，不是 undefined', () => {
    expect(mapEmailStats(base).skippedCount).toBe(0)
  })
})

describe('mapEmailHistory', () => {
  it('summary 帶出略過數量', () => {
    const result = mapEmailHistory({
      records: [],
      pagination: {
        currentPage: 1,
        totalPages: 1,
        totalCount: 16,
        hasNext: false,
        hasPrev: false,
        limit: 20,
      },
      stats: { totalRecords: 16, sentCount: 8, failedCount: 2, skippedCount: 5, successRate: 80 },
    })
    expect(result.summary.skippedCount).toBe(5)
    expect(result.summary.successCount).toBe(8)
  })
})
