import { AxiosError, type AxiosResponse } from 'axios'
import { describe, expect, it } from 'vitest'
import {
  canApproveOrganizationInvitation,
  organizationOperationError,
} from '../organization-invitation'

describe('organization invitation approval', () => {
  const now = Date.parse('2026-11-04T00:00:00Z')
  it('allows approval only while a pending invitation is still valid', () => {
    expect(
      canApproveOrganizationInvitation(
        { status: 'pending', expiresAt: '2026-11-05T00:00:00Z' },
        now,
      ),
    ).toBe(true)
    expect(
      canApproveOrganizationInvitation(
        { status: 'pending', expiresAt: '2026-11-04T00:00:00Z' },
        now,
      ),
    ).toBe(false)
    expect(
      canApproveOrganizationInvitation(
        { status: 'pending', expiresAt: '2026-11-03T00:00:00Z' },
        now,
      ),
    ).toBe(false)
  })
  it.each([
    'accepted',
    'revoked',
    'expired',
  ] as const)('never approves %s invitations', (status) => {
    expect(
      canApproveOrganizationInvitation({ status, expiresAt: '2026-11-05T00:00:00Z' }, now),
    ).toBe(false)
  })
  it('fails closed for an invalid expiry', () => {
    expect(canApproveOrganizationInvitation({ status: 'pending', expiresAt: 'invalid' }, now)).toBe(
      false,
    )
  })
})

describe('organization operation errors', () => {
  it('shows the server reason when the last owner cannot be removed', () => {
    const response = { data: { error: { message: '無法移除最後一位 owner' } } } as AxiosResponse
    const error = new AxiosError(
      'Request failed',
      'ERR_BAD_REQUEST',
      undefined,
      undefined,
      response,
    )
    expect(organizationOperationError(error, '操作失敗')).toBe('無法移除最後一位 owner')
  })
  it('uses the fallback for a connection error or malformed error response', () => {
    expect(organizationOperationError(new Error('Network error'), '操作失敗')).toBe('操作失敗')
    expect(organizationOperationError(new AxiosError('Network error'), '操作失敗')).toBe('操作失敗')
  })
})
