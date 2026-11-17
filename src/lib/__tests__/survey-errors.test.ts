import { AxiosError } from 'axios'
import { describe, expect, it } from 'vitest'
import { getApiErrorMessage } from '../survey-errors'

describe('survey error messages', () => {
  it('uses an actionable server message', () => {
    const error = new AxiosError('failed')
    Object.defineProperty(error, 'response', {
      value: { data: { error: { message: '已有回應後無法修改題目' } } },
    })
    expect(getApiErrorMessage(error, '重試')).toBe('已有回應後無法修改題目')
  })
  it('uses a readable fallback for network, unknown and malformed errors', () => {
    expect(getApiErrorMessage(new Error('internal'), '重試')).toBe('重試')
    expect(getApiErrorMessage(new AxiosError('Network Error'), '重試')).toBe('重試')
  })
})
