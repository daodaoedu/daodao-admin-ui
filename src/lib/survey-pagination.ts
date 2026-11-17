import type { SurveyOffsetPagination } from '@/api/admin-survey'
import type { AdminSurveyResponse } from '@/api/types'

/** Fetch complete survey response summaries before navigation or CSV detail loading. */
export async function loadAllSurveyResponses(
  fetchPage: (offset: number) => Promise<{
    data: AdminSurveyResponse[]
    pagination: SurveyOffsetPagination
  }>,
): Promise<AdminSurveyResponse[]> {
  const responses: AdminSurveyResponse[] = []
  let offset = 0
  for (;;) {
    const page = await fetchPage(offset)
    responses.push(...page.data)
    offset += page.data.length
    if (page.data.length === 0 || !page.pagination.hasMore || offset >= page.pagination.total) {
      return responses
    }
  }
}
