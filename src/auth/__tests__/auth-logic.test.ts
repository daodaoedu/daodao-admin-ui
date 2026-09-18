import { describe, expect, it } from 'vitest'

const ADMIN_ROLES = ['admin', 'superadmin', 'Admin', 'SuperAdmin']

function hasAdminRole(roles: string[]): boolean {
  return roles.some((r) => ADMIN_ROLES.includes(r))
}

describe('hasAdminRole', () => {
  it('accepts lowercase admin', () => {
    expect(hasAdminRole(['admin'])).toBe(true)
  })

  it('accepts PascalCase Admin', () => {
    expect(hasAdminRole(['Admin'])).toBe(true)
  })

  it('accepts superadmin variants', () => {
    expect(hasAdminRole(['superadmin'])).toBe(true)
    expect(hasAdminRole(['SuperAdmin'])).toBe(true)
  })

  it('rejects non-admin roles', () => {
    expect(hasAdminRole(['user', 'editor'])).toBe(false)
  })

  it('rejects empty roles', () => {
    expect(hasAdminRole([])).toBe(false)
  })

  it('finds admin among mixed roles', () => {
    expect(hasAdminRole(['user', 'moderator', 'admin'])).toBe(true)
  })
})
