import { describe, expect, it } from 'vitest'
import { clampPercent, safeNumber } from '../number'

describe('safeNumber', () => {
  it('returns fallback for missing and invalid API values', () => {
    expect(safeNumber(undefined)).toBe(0)
    expect(safeNumber(null)).toBe(0)
    expect(safeNumber(Number.NaN)).toBe(0)
    expect(safeNumber('')).toBe(0)
    expect(safeNumber('12')).toBe(12)
  })
})

describe('clampPercent', () => {
  it('keeps rendered percentages in the visible range', () => {
    expect(clampPercent(undefined)).toBe(0)
    expect(clampPercent(-10)).toBe(0)
    expect(clampPercent(42)).toBe(42)
    expect(clampPercent(120)).toBe(100)
  })
})
