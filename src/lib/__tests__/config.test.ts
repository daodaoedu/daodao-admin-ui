import { describe, expect, it } from 'vitest'
import { APP_BASE_URL, SURVEY_PUBLIC_BASE, getPracticePublicUrl } from '@/config'

describe('config', () => {
  it('APP_BASE_URL is a valid https URL without trailing slash', () => {
    expect(APP_BASE_URL).toMatch(/^https:\/\//)
    expect(APP_BASE_URL).not.toMatch(/\/$/)
  })

  it('SURVEY_PUBLIC_BASE derives from APP_BASE_URL', () => {
    expect(SURVEY_PUBLIC_BASE).toBe(`${APP_BASE_URL}/survey/r`)
  })

  it('getPracticePublicUrl builds a valid practice URL', () => {
    const url = getPracticePublicUrl('abc-123')
    expect(url).toBe(`${APP_BASE_URL}/practices/abc-123`)
  })
})
