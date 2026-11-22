import { describe, expect, it } from 'vitest'
import type { AdminSurveyResponse } from '@/api/types'
import { loadAllSurveyResponses } from '../survey-pagination'

const response = (id: number): AdminSurveyResponse => ({
  id,
  user_id: null,
  respondent_name: null,
  completed_at: '2026-11-17T00:00:00Z',
  answer_count: 1,
})
describe('survey response pagination', () => {
  it('collects all101 rows using the real total/hasMore contract', async () => {
    const offsets: number[] = []
    const rows = await loadAllSurveyResponses(async (offset) => {
      offsets.push(offset)
      return {
        data: Array.from({ length: offset === 0 ? 100 : 1 }, (_, index) =>
          response(offset + index + 1),
        ),
        pagination: { total: 101, limit: 100, offset, hasMore: offset === 0 },
      }
    })
    expect(offsets).toEqual([0, 100])
    expect(rows).toHaveLength(101)
    expect(rows.map((row) => row.id)).toEqual(Array.from({ length: 101 }, (_, index) => index + 1))
  })
  it('does not return partial data when a later page fails', async () => {
    const failure = new Error('第二頁讀取失敗')
    await expect(
      loadAllSurveyResponses(async (offset) => {
        if (offset !== 0) throw failure
        return { data: [response(1)], pagination: { total: 2, limit: 1, offset: 0, hasMore: true } }
      }),
    ).rejects.toBe(failure)
  })
  it('handles an empty completed result without requesting another page', async () => {
    let calls = 0
    const rows = await loadAllSurveyResponses(async (offset) => {
      calls++
      return { data: [], pagination: { total: 0, limit: 100, offset, hasMore: false } }
    })
    expect(calls).toBe(1)
    expect(rows).toEqual([])
  })
})
