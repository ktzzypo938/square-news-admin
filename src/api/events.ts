import { publicApi, adminApi } from './client'
import type { Event, Article, SpectrumDTO, IncitementSpectrumDTO, EventCreateRequest, EventSuggestRequest, EventSuggestResponse, Page } from '@/types'

/**
 * Get all events
 */
export async function getEvents(
  page: number = 0,
  size: number = 20,
  topic?: string,
  state?: string,
  published?: boolean
): Promise<Page<Event>> {
  const params: any = { page, size, sort: 'updated_at,desc' }
  if (topic) params.topic = topic
  if (state) params.state = state
  if (published !== undefined) params.published = published

  const response = await publicApi.get<Page<Event>>('/events', { params })
  return response.data
}

/**
 * Get trending events
 * @param limit Number of events to fetch (default: 10)
 */
export async function getTrendingEvents(limit: number = 10): Promise<Event[]> {
  const response = await publicApi.get<Event[]>('/events/trending', {
    params: { limit }
  })
  return response.data
}

/**
 * Get recent events (sorted by updatedAt)
 * @param limit Number of events to fetch (default: 10)
 */
export async function getRecentEvents(limit: number = 10): Promise<Event[]> {
  const response = await publicApi.get<Event[]>('/events/recent', {
    params: { limit }
  })
  return response.data
}

/**
 * Get event by ID
 * @param eventId Event ID
 */
export async function getEventById(eventId: number): Promise<Event> {
  const response = await publicApi.get<Event>(`/events/${eventId}`)
  return response.data
}

/**
 * Get articles for a specific event
 * @param eventId Event ID
 */
export async function getEventArticles(eventId: number): Promise<Article[]> {
  const response = await publicApi.get(`/events/${eventId}/articles`, {
    params: { page: 0, size: 500 }
  })
  // API 回傳分頁物件 {content: [...], ...}，取出 content
  const data = response.data
  return data.content ?? data
}

/**
 * Get event spectrum (bias bar data) - DEPRECATED
 * @deprecated Use getEventIncitementSpectrum from incitement.ts for new incitement-based spectrum
 * @param eventId Event ID
 */
export async function getEventSpectrum(eventId: number): Promise<SpectrumDTO> {
  const response = await publicApi.get<SpectrumDTO>(`/events/${eventId}/spectrum`)
  return response.data
}

/**
 * Get event incitement spectrum (2D scatter plot data)
 * 获取事件煽动指数光谱（2D 图表数据）
 * @param eventId Event ID
 */
export async function getEventIncitementSpectrum(eventId: number): Promise<IncitementSpectrumDTO> {
  const response = await publicApi.get<IncitementSpectrumDTO>(`/events/${eventId}/spectrum`)
  return response.data
}

/**
 * Create event (admin)
 */
export async function createEvent(payload: EventCreateRequest): Promise<Event> {
  const response = await adminApi.post<Event>('/admin/events', payload)
  return response.data
}

/**
 * Suggest event draft (admin)
 */
export async function suggestEventDraft(payload: EventSuggestRequest): Promise<EventSuggestResponse> {
  const response = await adminApi.post<EventSuggestResponse>('/admin/events/suggest', payload)
  return response.data
}

/**
 * Delete event (admin)
 * Articles will be preserved but their event_id will be cleared
 */
export async function deleteEvent(eventId: number): Promise<{ eventId: number; message: string }> {
  const response = await adminApi.delete<{ eventId: number; message: string }>(`/admin/events/${eventId}`)
  return response.data
}

/**
 * Dissolve event and reaggregate all articles (admin)
 * The event will be deleted and all its articles will be reprocessed
 */
export async function dissolveEvent(eventId: number): Promise<{ eventId: number; reaggregated: number; message: string }> {
  const response = await adminApi.post<{ eventId: number; reaggregated: number; message: string }>(`/admin/events/${eventId}/dissolve`)
  return response.data
}

/**
 * Add articles to event (admin)
 */
export async function addArticlesToEvent(eventId: number, articleIds: number[]): Promise<{ updated: number }> {
  const response = await adminApi.post<{ updated: number }>(`/admin/events/${eventId}/articles`, { articleIds })
  return response.data
}

/**
 * Remove articles from event (admin)
 */
export async function removeArticlesFromEvent(eventId: number, articleIds: number[]): Promise<{ updated: number }> {
  const response = await adminApi.delete<{ updated: number }>(`/admin/events/${eventId}/articles`, { data: { articleIds } })
  return response.data
}

/**
 * Recalculate event statistics (admin)
 */
export async function recalculateEvent(eventId: number): Promise<void> {
  await adminApi.post(`/admin/events/${eventId}/recalculate`)
}

/**
 * Regenerate event AI analysis (admin)
 */
export async function regenerateEvent(eventId: number): Promise<void> {
  await adminApi.post(`/admin/events/${eventId}/regenerate`)
}

/**
 * Publish or unpublish an event (admin)
 * @param eventId Event ID
 * @param publish true to publish, false to unpublish
 */
export async function publishEvent(eventId: number, publish: boolean): Promise<Event> {
  const response = await adminApi.post<Event>(`/admin/events/${eventId}/publish`, {
    published: publish
  })
  return response.data
}

/**
 * Set or unset event as headline (admin)
 * @param eventId Event ID
 * @param headline true to set as headline, false to remove
 */
export async function setEventHeadline(eventId: number, headline: boolean): Promise<Event> {
  const response = await adminApi.post<Event>(`/admin/events/${eventId}/headline`, {
    headline
  })
  return response.data
}
