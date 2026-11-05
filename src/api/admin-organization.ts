import apiClient from './client'
import type {
  ApiResponse,
  Organization,
  OrganizationCreate,
  OrganizationInvitation,
  OrganizationMember,
  OrganizationUpdate,
} from './types'

const BASE_PATH = '/daodao-server/api/v1/lighthouse'

export const listOrganizations = () =>
  apiClient.get<ApiResponse<Organization[]>>(`${BASE_PATH}/admin/organizations`)

export const createOrganization = (data: OrganizationCreate) =>
  apiClient.post<ApiResponse<Organization>>(`${BASE_PATH}/admin/organizations`, data)

export const updateOrganization = (organizationId: number, data: OrganizationUpdate) =>
  apiClient.patch<ApiResponse<Organization>>(
    `${BASE_PATH}/admin/organizations/${organizationId}`,
    data,
  )

export const listOrganizationMembers = (organizationId: number) =>
  apiClient.get<ApiResponse<OrganizationMember[]>>(
    `${BASE_PATH}/admin/organizations/${organizationId}/members`,
  )

export const addOrganizationMember = (organizationId: number, userId: number) =>
  apiClient.post<ApiResponse<OrganizationMember>>(
    `${BASE_PATH}/admin/organizations/${organizationId}/members`,
    { userId, role: 'owner' },
  )

export const removeOrganizationMember = (organizationId: number, userId: number) =>
  apiClient.delete(`${BASE_PATH}/admin/organizations/${organizationId}/members/${userId}`)

export const listOrganizationInvitations = (organizationId: number) =>
  apiClient.get<ApiResponse<OrganizationInvitation[]>>(
    `${BASE_PATH}/admin/organizations/${organizationId}/invitations`,
  )

export const inviteOrganizationOwner = (organizationId: number, email: string) =>
  apiClient.post<ApiResponse<OrganizationInvitation>>(
    `${BASE_PATH}/admin/organizations/${organizationId}/invitations`,
    { email },
  )

export const resendOrganizationInvitation = (organizationId: number, invitationId: number) =>
  apiClient.post<ApiResponse<OrganizationInvitation>>(
    `${BASE_PATH}/admin/organizations/${organizationId}/invitations/${invitationId}/resend`,
  )

export const revokeOrganizationInvitation = (organizationId: number, invitationId: number) =>
  apiClient.post<ApiResponse<OrganizationInvitation>>(
    `${BASE_PATH}/admin/organizations/${organizationId}/invitations/${invitationId}/revoke`,
  )

export const approveOrganizationInvitation = (
  organizationId: number,
  invitationId: number,
  requestId: number,
) =>
  apiClient.post<ApiResponse<OrganizationInvitation>>(
    `${BASE_PATH}/admin/organizations/${organizationId}/invitations/${invitationId}/requests/${requestId}/approve`,
  )
