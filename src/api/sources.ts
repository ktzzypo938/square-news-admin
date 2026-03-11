import { publicApi, adminApi } from './client'
import type { MediaSource } from '@/types'

/**
 * Get all media sources (including virtual sources from articles)
 */
export async function getSources(): Promise<MediaSource[]> {
  const response = await publicApi.get<MediaSource[]>('/sources')
  return response.data
}

/**
 * Create or update media source (admin)
 */
export async function saveMediaSource(payload: MediaSource): Promise<MediaSource> {
  const response = await adminApi.post<MediaSource>('/admin/media-sources', payload)
  return response.data
}

/**
 * Update media source by ID (admin) - partial update
 */
export async function updateMediaSource(id: number, payload: Partial<MediaSource>): Promise<MediaSource> {
  const response = await adminApi.put<MediaSource>(`/admin/media-sources/${id}`, payload)
  return response.data
}

/**
 * Delete media source by ID (admin)
 */
export async function deleteMediaSource(id: number): Promise<void> {
  await adminApi.delete(`/admin/media-sources/${id}`)
}

export interface MediaArticleCount {
  sourceName: string
  articleCount: number
  biasScore: number | null
}

/**
 * Get article counts grouped by media source
 */
export async function getMediaArticleCounts(): Promise<MediaArticleCount[]> {
  const response = await publicApi.get<MediaArticleCount[]>('/stats/media-article-counts')
  return response.data
}
