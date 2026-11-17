import { describe, expect, it } from 'vitest'
import { surveyEditorQuestionType, surveyQuestionInputType } from '../survey-question'

describe('survey question text contract', () => {
  it('loads the persisted email and URL variants into the matching picker', () => {
    expect(surveyEditorQuestionType({ question_type: 'text', input_type: 'email' })).toBe('email')
    expect(surveyEditorQuestionType({ question_type: 'text', input_type: 'url' })).toBe('link')
    expect(surveyEditorQuestionType({ question_type: 'rating' })).toBe('rating')
  })
  it('persists short, long, email and URL variants and keeps nontext questions plain', () => {
    expect(surveyQuestionInputType({ question_type: 'email' })).toBe('email')
    expect(surveyQuestionInputType({ question_type: 'link' })).toBe('url')
    expect(surveyQuestionInputType({ question_type: 'text', text_response_length: 'long' })).toBe(
      'textarea',
    )
    expect(surveyQuestionInputType({ question_type: 'text', text_response_length: 'short' })).toBe(
      'text',
    )
    expect(surveyQuestionInputType({ question_type: 'scale', text_response_length: 'long' })).toBe(
      'text',
    )
  })
})
