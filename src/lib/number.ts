export function safeNumber(value: unknown, fallback = 0) {
  if (value === null || value === undefined || value === '') return fallback

  const numberValue = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(numberValue) ? numberValue : fallback
}

export function clampPercent(value: unknown) {
  return Math.min(100, Math.max(0, safeNumber(value)))
}
