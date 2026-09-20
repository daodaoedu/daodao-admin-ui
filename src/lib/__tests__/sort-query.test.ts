import { describe, expect, it } from 'vitest'
import { normalizeSortValue } from '../sort-query'

const OPTIONS = [{ value: 'lastActiveAt_desc' }, { value: 'createdAt_desc' }, { value: 'name_asc' }]

describe('normalizeSortValue (#218 legacy ?sort= regression)', () => {
  it('keeps a value that still exists', () => {
    expect(normalizeSortValue('name_asc', OPTIONS, 'lastActiveAt_desc')).toBe('name_asc')
  })
  it('falls back for removed onboarding sort values from old bookmarks', () => {
    for (const legacy of ['registrationFlow_asc', 'creationMethod_desc', 'daysToComplete_desc']) {
      expect(normalizeSortValue(legacy, OPTIONS, 'lastActiveAt_desc')).toBe('lastActiveAt_desc')
    }
  })
  it('falls back for null / empty', () => {
    expect(normalizeSortValue(null, OPTIONS, 'lastActiveAt_desc')).toBe('lastActiveAt_desc')
    expect(normalizeSortValue('', OPTIONS, 'lastActiveAt_desc')).toBe('lastActiveAt_desc')
  })
})
