import { describe, expect, it } from 'vitest'
import { copySurveyTitle } from '../survey-copy'

describe('survey copy title', () => {
  it('keeps a short source title and appends the visible copy suffix', () => {
    expect(copySurveyTitle('中文問卷')).toBe('中文問卷（副本）')
  })
  it('keeps exactly the available196 ASCII units before the suffix', () => {
    expect(copySurveyTitle('A'.repeat(196))).toBe(`${'A'.repeat(196)}（副本）`)
    expect(copySurveyTitle('A'.repeat(200))).toBe(`${'A'.repeat(196)}（副本）`)
  })
  it('counts emoji by UTF16 units and never emits half of a surrogate pair', () => {
    const emoji = copySurveyTitle('😀'.repeat(100))
    expect(emoji).toBe(`${'😀'.repeat(98)}（副本）`)
    expect(emoji.length).toBe(200)
    const boundary = copySurveyTitle(`${'A'.repeat(195)}😀BBB`)
    expect(boundary).toBe(`${'A'.repeat(195)}（副本）`)
    expect(boundary.length).toBe(199)
    expect(Array.from(boundary).some((character) => /^[\uD800-\uDFFF]$/.test(character))).toBe(
      false,
    )
  })
})
