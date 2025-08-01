import { api } from './api'

export interface User {
  id: string
  email: string
  first_name: string
  last_name: string
  username: string
  is_active: boolean
  is_staff: boolean
  is_superuser: boolean
  date_joined: string
  last_login: string | null
  groups: UserGroup[]
  user_permissions: string[]
  profile?: UserProfile
}

export interface UserGroup {
  id: string
  name: string
  permissions: string[]
}

export interface UserProfile {
  phone_number: string
  organization: string
  role: string
  timezone: string
  preferences: Record<string, any>
}

export interface CreateUserData {
  email: string
  first_name: string
  last_name: string
  username: string
  password: string
  groups: string[]
  is_staff?: boolean
  is_superuser?: boolean
  profile?: Partial<UserProfile>
}

export interface AuditLogEntry {
  id: string
  user: {
    id: string
    email: string
    first_name: string
    last_name: string
  }
  action: string
  content_type: string
  object_id: string
  object_repr: string
  changes: Record<string, any>
  timestamp: string
  ip_address: string
  user_agent: string
}

export interface ImpersonationSession {
  id: string
  admin_user: {
    id: string
    email: string
  }
  target_user: {
    id: string
    email: string
  }
  started_at: string
  ended_at: string | null
  is_active: boolean
  reason: string
}

export interface SystemStats {
  total_users: number
  active_users: number
  staff_users: number
  superusers: number
  user_registrations_today: number
  user_registrations_this_week: number
  user_registrations_this_month: number
  active_sessions: number
  recent_logins: number
  failed_login_attempts: number
}

// User Management
export const getUsers = async (): Promise<User[]> => {
  const response = await api.get('/users/')
  return response.data
}

export const getUser = async (id: string): Promise<User> => {
  const response = await api.get(`/users/${id}/`)
  return response.data
}

export const createUser = async (data: CreateUserData): Promise<User> => {
  const response = await api.post('/users/', data)
  return response.data
}

export const updateUser = async (id: string, data: Partial<User>): Promise<User> => {
  const response = await api.patch(`/users/${id}/`, data)
  return response.data
}

export const deleteUser = async (id: string): Promise<void> => {
  await api.delete(`/users/${id}/`)
}

export const activateUser = async (id: string): Promise<User> => {
  const response = await api.post(`/users/${id}/activate/`)
  return response.data
}

export const deactivateUser = async (id: string): Promise<User> => {
  const response = await api.post(`/users/${id}/deactivate/`)
  return response.data
}

export const resetUserPassword = async (id: string): Promise<{ temporary_password: string }> => {
  const response = await api.post(`/users/${id}/reset-password/`)
  return response.data
}

// Group Management
export const getUserGroups = async (): Promise<UserGroup[]> => {
  const response = await api.get('/auth/groups/')
  return response.data
}

export const createUserGroup = async (data: Partial<UserGroup>): Promise<UserGroup> => {
  const response = await api.post('/auth/groups/', data)
  return response.data
}

export const updateUserGroup = async (id: string, data: Partial<UserGroup>): Promise<UserGroup> => {
  const response = await api.patch(`/auth/groups/${id}/`, data)
  return response.data
}

export const deleteUserGroup = async (id: string): Promise<void> => {
  await api.delete(`/auth/groups/${id}/`)
}

// Role switching
export const switchToRole = async (roleId: string): Promise<{ token: string; role: string }> => {
  const response = await api.post('/admin/switch-role/', { role_id: roleId })
  return response.data
}

export const getCurrentRole = async (): Promise<{ role: string; permissions: string[] }> => {
  const response = await api.get('/admin/current-role/')
  return response.data
}

// User Impersonation
export const getImpersonationSessions = async (): Promise<ImpersonationSession[]> => {
  const response = await api.get('/admin/impersonation-sessions/')
  return response.data
}

export const startImpersonation = async (userId: string, reason: string): Promise<ImpersonationSession> => {
  const response = await api.post('/admin/impersonate/', {
    user_id: userId,
    reason
  })
  return response.data
}

export const endImpersonation = async (sessionId: string): Promise<void> => {
  await api.post(`/admin/impersonation-sessions/${sessionId}/end/`)
}

export const getCurrentImpersonation = async (): Promise<ImpersonationSession | null> => {
  try {
    const response = await api.get('/admin/current-impersonation/')
    return response.data
  } catch (error) {
    if ((error as any)?.response?.status === 404) {
      return null
    }
    throw error
  }
}

// Audit Logs
export const getAuditLogs = async (filters?: {
  user_id?: string
  action?: string
  start_date?: string
  end_date?: string
  limit?: number
}): Promise<AuditLogEntry[]> => {
  const response = await api.get('/dashboards/audit-logs/', { params: filters })
  return response.data
}

export const getAuditLog = async (id: string): Promise<AuditLogEntry> => {
  const response = await api.get(`/dashboards/audit-logs/${id}/`)
  return response.data
}

// System Statistics
export const getSystemStats = async (): Promise<SystemStats> => {
  const response = await api.get('/admin/system-stats/')
  return response.data
}

export const getUserRegistrationStats = async (period: 'daily' | 'weekly' | 'monthly' = 'daily'): Promise<any[]> => {
  const response = await api.get('/admin/user-registration-stats/', { params: { period } })
  return response.data
}

export const getActiveUserStats = async (): Promise<any[]> => {
  const response = await api.get('/admin/active-user-stats/')
  return response.data
}

// Permissions
export const getAllPermissions = async (): Promise<string[]> => {
  const response = await api.get('/auth/permissions/')
  return response.data
}

export const getUserPermissions = async (userId: string): Promise<string[]> => {
  const response = await api.get(`/users/${userId}/permissions/`)
  return response.data
}

export const grantUserPermission = async (userId: string, permission: string): Promise<void> => {
  await api.post(`/users/${userId}/permissions/`, { permission })
}

export const revokeUserPermission = async (userId: string, permission: string): Promise<void> => {
  await api.delete(`/users/${userId}/permissions/${permission}/`)
}

// Bulk operations
export const bulkActivateUsers = async (userIds: string[]): Promise<void> => {
  await api.post('/admin/bulk-activate-users/', { user_ids: userIds })
}

export const bulkDeactivateUsers = async (userIds: string[]): Promise<void> => {
  await api.post('/admin/bulk-deactivate-users/', { user_ids: userIds })
}

export const bulkAssignGroup = async (userIds: string[], groupId: string): Promise<void> => {
  await api.post('/admin/bulk-assign-group/', { user_ids: userIds, group_id: groupId })
}

export const exportUsers = async (format: 'csv' | 'xlsx' = 'csv'): Promise<string> => {
  const response = await api.get('/admin/export-users/', {
    params: { format },
    responseType: 'blob'
  })
  
  // Create download URL
  const url = window.URL.createObjectURL(new Blob([response.data]))
  return url
}