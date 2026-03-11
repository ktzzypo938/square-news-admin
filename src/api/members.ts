import { adminApi } from './client'
import type { AdminUser, AdminUserStats, Page } from '@/types'

export async function getUsers(params: {
  page?: number
  size?: number
  search?: string
  role?: string
  active?: boolean
}): Promise<Page<AdminUser>> {
  const response = await adminApi.get<Page<AdminUser>>('/admin/users', { params })
  return response.data
}

export async function getUserStats(): Promise<AdminUserStats> {
  const response = await adminApi.get<AdminUserStats>('/admin/users/stats')
  return response.data
}

export async function updateUserStatus(id: number, active: boolean): Promise<AdminUser> {
  const response = await adminApi.patch<AdminUser>(`/admin/users/${id}/status`, { active })
  return response.data
}
