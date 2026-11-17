import { isAxiosError } from 'axios'
/** Show the server's actionable validation message while keeping a readable fallback. */
export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (!isAxiosError(error)) return fallback
  const data: unknown = error.response?.data
  if (typeof data !== 'object' || data === null || !('error' in data)) return fallback
  const detail = data.error
  if (typeof detail !== 'object' || detail === null || !('message' in detail)) return fallback
  return typeof detail.message === 'string' ? detail.message : fallback
}
