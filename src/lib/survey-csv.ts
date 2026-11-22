import type { AdminSurveyDetail, AdminSurveyResponseDetail } from '@/api/types'
import { formatAdminDateTime } from './date-format'

/** Quote every field and neutralize spreadsheet formulas, including leading controls. */
export function escapeSurveyCsvCell(value: unknown): string {
  const text = String(value ?? '')
  const first =
    [...text].find((character) => character.charCodeAt(0) > 32 && !/\s/u.test(character)) ?? ''
  const firstCode = text.charCodeAt(0)
  const unsafeString =
    typeof value === 'string' &&
    (/^[=+\-@]/u.test(first) || firstCode === 9 || firstCode === 10 || firstCode === 13)
  const safe = unsafeString ? `'${text}` : text
  return `"${safe.replace(/"/g, '""')}"`
}
/** Export option IDs as identities; duplicate option labels must remain distinguishable. */
export function buildSurveyCsv(
  survey: Pick<AdminSurveyDetail, 'questions'> &
    Partial<Pick<AdminSurveyDetail, 'is_anonymous' | 'managed_version'>>,
  responses: AdminSurveyResponseDetail[],
): string {
  type Answer = AdminSurveyResponseDetail['answers'][number]
  const columns: {
    header: string
    value: (answer: Answer | undefined) => unknown
    questionId: number
  }[] = []
  for (const question of [...survey.questions].sort((a, b) => a.position - b.position)) {
    const label = `Q${question.id}「${question.question_text}」[${question.question_type}]`
    const options = [...question.options].sort((a, b) => a.position - b.position)
    if (question.question_type === 'multiple_choice' || question.question_type === 'ranking') {
      const ranking = question.question_type === 'ranking'
      for (const option of options) {
        columns.push({
          header: `${label}[選項${option.id}:${option.option_text}][${ranking ? '名次' : '0/1'}]`,
          questionId: question.id,
          value: (answer) => {
            if (!answer?.selected_option_ids.length) return ''
            const rank = answer.selected_option_ids.indexOf(option.id)
            if (!ranking) return Number(rank >= 0)
            if (rank < 0) return ''
            return rank + 1
          },
        })
      }
      columns.push({
        header: `${label}[JSON選項ID${ranking ? '依排名' : ''}]`,
        questionId: question.id,
        value: (answer) =>
          answer?.selected_option_ids.length ? JSON.stringify(answer.selected_option_ids) : '',
      })
      continue
    }
    columns.push({
      header: label,
      questionId: question.id,
      value: (answer) => {
        if (!answer) return ''
        if (answer.rating_value !== null) return answer.rating_value
        if (answer.boolean_value !== null) return answer.boolean_value ? '是' : '否'
        if (answer.selected_options.length) return answer.selected_options.join('、')
        return answer.answer_text ?? ''
      },
    })
  }
  const headers = ['回應編號', '回應者', '完成時間', ...columns.map((column) => column.header)]
  const anonymous = survey.managed_version === 1 && survey.is_anonymous === true
  const rows = responses.map((response, index) => {
    const answers = new Map(response.answers.map((answer) => [answer.question_id, answer]))
    return [
      anonymous ? index + 1 : response.id,
      response.respondent_name ??
        (response.user_id === null ? '匿名' : `用戶 #${response.user_id}`),
      formatAdminDateTime(response.completed_at, !anonymous),
      ...columns.map((column) => column.value(answers.get(column.questionId))),
    ]
  })
  return `\ufeff${[headers, ...rows].map((row) => row.map(escapeSurveyCsvCell).join(',')).join('\r\n')}`
}
