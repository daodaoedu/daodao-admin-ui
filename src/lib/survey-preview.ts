import { z } from 'zod'

interface PreviewQuestion {
  _key: string
  question_type: string
  is_required: boolean
  scale_min: number
  scale_max: number
}
/** Mirror format and required checks for the editor's local, non-persisted preview. */
export function invalidPreviewQuestions(
  questions: PreviewQuestion[],
  answers: Record<string, string | string[]>,
): string[] {
  return questions
    .filter((question) => {
      const answer = answers[question._key]
      const empty = Array.isArray(answer) ? answer.length === 0 : !answer?.trim()
      if (empty) return question.is_required
      if (typeof answer !== 'string') return false
      const value = answer.trim()
      if (['text', 'email', 'link'].includes(question.question_type) && value.length > 10000)
        return true
      if (question.question_type === 'email') return !z.string().email().safeParse(value).success
      if (question.question_type === 'link') {
        try {
          const url = new URL(value)
          return !['http:', 'https:'].includes(url.protocol) || !url.hostname
        } catch {
          return true
        }
      }
      if (question.question_type === 'rating' || question.question_type === 'scale') {
        const number = Number(value)
        const min = question.question_type === 'rating' ? 1 : question.scale_min
        const max = question.question_type === 'rating' ? 5 : question.scale_max
        return !Number.isInteger(number) || number < min || number > max
      }
      return false
    })
    .map((question) => question._key)
}
