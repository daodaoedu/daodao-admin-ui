import { isAxiosError } from 'axios'
import type { OrganizationInvitation } from '@/api/types'

/** An expired invitation must not expose approval even before the next server refresh. */
export function canApproveOrganizationInvitation(
  invitation: Pick<OrganizationInvitation, 'status' | 'expiresAt'>,
  now = Date.now(),
): boolean {
  return invitation.status === 'pending' && Date.parse(invitation.expiresAt) > now
}

/** Preserve server rejection details while keeping non-API errors understandable. */
export function organizationOperationError(error: unknown, fallback: string): string {
  if (!isAxiosError<{ error?: { message?: unknown } }>(error)) return fallback
  const message = error.response?.data?.error?.message
  return typeof message === 'string' && message.trim() ? message : fallback
}
