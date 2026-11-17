import { describe, expect, it } from 'vitest'
import { invalidPreviewQuestions } from '../survey-preview'

const questions = [
  { _key: 'email', question_type: 'email', is_required: true, scale_min: 1, scale_max: 5 },
  { _key: 'link', question_type: 'link', is_required: false, scale_min: 1, scale_max: 5 },
  { _key: 'scale', question_type: 'scale', is_required: true, scale_min: -2, scale_max: 10 },
]
describe('local survey preview validation', () => {
  it('accepts valid email and HTTPS URL and a zero scale value', () => {
    expect(
      invalidPreviewQuestions(questions, {
        email: 'TEST@example.com',
        link: 'https://example.com/a',
        scale: '0',
      }),
    ).toEqual([])
  })
  it('rejects empty required, malformed email, nonweb URL and scale outside configured range', () => {
    expect(
      invalidPreviewQuestions(questions, {
        email: 'no email',
        link: 'javascript:alert(1)',
        scale: '11',
      }),
    ).toEqual(['email', 'link', 'scale'])
    expect(invalidPreviewQuestions(questions, {})).toEqual(['email', 'scale'])
  })
  it('permits unanswered optional fields and rejects fractional scale values', () => {
    expect(invalidPreviewQuestions(questions, { email: 'a@b.com', scale: '1.5' })).toEqual([
      'scale',
    ])
  })
})
it('matches server email and text-length validation', () => {
  expect(invalidPreviewQuestions(questions, { email: 'a@b.c', scale: '0' })).toEqual(['email'])
  expect(
    invalidPreviewQuestions(
      [{ _key: 'text', question_type: 'text', is_required: false, scale_min: 1, scale_max: 5 }],
      { text: '文'.repeat(10001) },
    ),
  ).toEqual(['text'])
})
