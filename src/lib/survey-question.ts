/** Decode the canonical text configuration into the editor's type picker. */
export function surveyEditorQuestionType(question: {
  question_type: string
  input_type?: string
}): string {
  if (question.input_type === 'email') return 'email'
  if (question.input_type === 'url') return 'link'
  return question.question_type
}
/** Encode the editor's text variants without expanding the database question enum. */
export function surveyQuestionInputType(question: {
  question_type: string
  text_response_length?: 'short' | 'long'
}): 'text' | 'email' | 'url' | 'textarea' {
  if (question.question_type === 'email') return 'email'
  if (question.question_type === 'link') return 'url'
  if (question.question_type === 'text' && question.text_response_length === 'long')
    return 'textarea'
  return 'text'
}
