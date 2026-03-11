// Event Types
export type EventState = 'OPEN' | 'CLOSED' | string

export interface Event {
  eventId: number
  topic: string
  coreSummary?: string
  actors?: Record<string, unknown>
  startTime?: string // "yyyy-MM-dd HH:mm:ss"
  endTime?: string
  state: EventState
  articleCount?: number
  sourceCount?: number
  hotness?: number
  stanceDiversity?: number
  updatedAt?: string
  createdAt?: string
  keyPoints?: string[]
  blindspotLabel?: string
  locationTag?: string
  published?: boolean
  headline?: boolean
  publishedAt?: string
  imageUrl?: string
}

export interface EventCreateRequest {
  topic: string
  coreSummary?: string | null
  actors?: Record<string, unknown> | null
  startTime?: string | null // ISO format: YYYY-MM-DDTHH:mm:ss
  endTime?: string | null
  state?: EventState | null
  articleIds?: number[] | null
  keyPoints?: string[] | null
  blindspotLabel?: string | null
  locationTag?: string | null
}

export interface EventSuggestRequest {
  articleIds: number[]
}

export interface EventSuggestResponse {
  topic: string
  coreSummary: string
  actors: string[]
  keyPoints?: string[]
}

// Article Types
export type ProcessingStatus = 'PENDING' | 'PROCESSING' | 'DONE' | 'ERROR' | string

export interface MediaSource {
  id?: number // /sources may return virtual source, id may not exist
  name: string
  code: string
  homeUrl?: string
  defaultBiasScore?: number
  weight?: number
  createdAt?: string
  updatedAt?: string
  factuality?: 'HIGH' | 'MIXED' | 'LOW' | 'UNKNOWN' | string
  ownershipInfo?: string
  category?: 'TRADITIONAL' | 'ONLINE' | 'INDEPENDENT' | 'OTHER' | string
}

export interface Article {
  id: number
  mediaSource?: MediaSource | null // ManyToOne lazy
  sourceName?: string | null
  author?: string | null
  url: string
  publishedAt?: string
  title?: string | null
  cleanText?: string | null
  topic?: string | null
  actors?: Record<string, unknown> | null
  eventSummary?: string | null
  newsType?: string | null
  eventId?: number | null
  status?: ProcessingStatus
  createdAt?: string
  updatedAt?: string
}

// Spectrum Types
export interface SpectrumSourceStance {
  sourceName: string
  averageScore: number
  articleCount: number
  newsTypeCounts?: Record<string, number>
  factuality?: 'HIGH' | 'MIXED' | 'LOW' | 'UNKNOWN' | string
  ownershipInfo?: string
}

export interface SpectrumDTO {
  eventId?: number | null
  topic: string
  averageScore?: number | null
  totalArticles: number
  statsArticles?: number | null
  totalSources?: number | null
  leftWingRatio?: number | null
  centerRatio?: number | null
  rightWingRatio?: number | null
  proChinaRatio?: number | null
  proUsRatio?: number | null
  sourceDetails?: SpectrumSourceStance[]
  newsTypeStats?: Record<string, number>
  articles?: Article[]
  blindspotLabel?: string
  keyPoints?: string[]
  locationTag?: string
}

// Pagination Type
export interface Page<T> {
  content: T[]
  totalElements: number
  totalPages: number
  size: number
  number: number // 0-based
  // Other fields can be ignored
}

// Entity Alias Types
export type EntityType = 'PERSON' | 'ORGANIZATION' | 'LOCATION' | 'EVENT' | string

export interface EntityAlias {
  id?: number
  alias: string
  canonicalName: string
  entityType: EntityType
  active?: boolean
  source?: string | null
  createdAt?: string
  updatedAt?: string
}

// Admin User Types
export interface AdminUser {
  id: number
  email: string
  displayName: string | null
  avatarUrl: string | null
  role: string
  active: boolean
  onboarded: boolean
  interests: string[]
  gender: string | null
  birthYear: number | null
  createdAt: string
  lastLoginAt: string | null
}

export interface AdminUserStats {
  total: number
  active: number
  inactive: number
  onboarded: number
}

// API Request Types
export interface GetArticlesParams {
  sourceName?: string
  startDate?: string // ISO format: YYYY-MM-DDTHH:mm:ss
  endDate?: string // ISO format: YYYY-MM-DDTHH:mm:ss
  page?: number // 0-based
  size?: number
}

// Incitement Analysis Types (煽动指数分析)

/**
 * 证据摘要
 */
export interface IncitementEvidence {
  articleId: number
  title: string
  snippet: string // 相关文本片段
  score: number // 该文章的煽动分数
}

/**
 * 媒体煽动指数数据
 */
export interface OutletIncitement {
  outlet: string // 媒体名称
  incitementScore: number // 煽动分数 (0-100)
  stancePolarity: number // 立场极性 (-1 到 +1)
  stanceConfidence: number // 立场信心度 (0-1)
  confidence: number // 整体信心度 (0-1)
  articleCount: number // 参与计算的文章数量
  topEvidence?: IncitementEvidence[] // 证据摘要（仅当 includeEvidence=true 时）
}

/**
 * 煽动指数统计信息
 */
export interface IncitementStatistics {
  totalOutlets: number // 总媒体数
  totalArticles: number // 总文章数
  averageIncitement: number // 平均煽动分数
  averageStance: number // 平均立场极性
}

/**
 * 事件煽动指数数据（事件×媒体列表）
 */
export interface IncitementDTO {
  eventId: number
  topic: string
  stanceTarget: string // 立场针对的目标
  outlets: OutletIncitement[] // 各媒体的煽动指数数据列表
  statistics: IncitementStatistics // 统计资讯
}

/**
 * 光谱点（2D 图表用）
 */
export interface SpectrumPoint {
  outlet: string // 媒体名称
  stancePolarity: number // X 轴座标（立场，-1 到 +1）
  incitementScore: number // Y 轴座标（煽动分数，0-100）
  confidence: number // 信心度（可用于调整透明度）
  articleCount: number // 文章数量（可用于调整点的大小）
  category: string // 媒体类别（用于颜色分组）
}

/**
 * 煽动指数光谱（2D 图表）
 */
export interface IncitementSpectrumDTO {
  eventId: number
  topic: string
  stanceTarget: string // 立场目标
  points: SpectrumPoint[] // 光谱点集合（每个媒体一个点）
}

/**
 * 媒体煽动指数趋势数据点
 */
export interface IncitementTrendDataPoint {
  timestamp: string // ISO 格式时间
  rawScore: number // 原始煽动分数
  zScore?: number // z-score（相对于基线）
  articleCount: number // 该时间段的文章数
  eventCount?: number // 该时间段的事件数
}

/**
 * 媒体煽动指数趋势基线
 */
export interface IncitementBaseline {
  mean: number // 平均值
  stdDev: number // 标准差
  sampleSize: number // 样本数
}

/**
 * 媒体煽动指数趋势（时间序列）
 */
export interface IncitementTrendDTO {
  outlet: string
  window: 'day' | 'week' | 'month' // 聚合窗口
  dataPoints: IncitementTrendDataPoint[]
  baseline?: IncitementBaseline // 基线资讯
}

/**
 * 文章煽動指數分析（完整數據）
 */
export interface ArticleIncitationAnalysis {
  id: number
  articleId: number
  eventId?: number | null
  outlet: string

  // 煽動指數分數
  incitementScore: number // 0-100

  // 7 個維度分數 (0-5)
  dimA: number // 陣營化/二分對立
  dimB: number // 道德譴責與妖魔化
  dimC: number // 威脅放大
  dimD: number // 歸因與替罪羊
  dimE: number // 行動號召/懲罰正當化
  dimF: number // 未證實指控與陰謀化
  dimG: number // 武斷確定性

  // 立場分析（整合在煽動指數分析中）
  stanceTarget?: string | null // 立場針對的目標
  stancePolarity?: number | null // -1 到 +1（替代舊的 stanceScore）
  stanceConfidence?: number | null // 0.0 到 1.0

  confidence?: number | null // 整體分析信心度
  computedAt: string // 分析時間
  version: string // 模型版本
}

/**
 * 文章煽動指數證據片段
 */
export interface ArticleIncitationEvidence {
  id: number
  articleAnalysisId: number
  text: string
  attributionType: 'OUTLET_VOICE' | 'QUOTED_SOURCE' | 'OPPONENT_QUOTE'
  dimsJson: Record<string, number>
  targetsJson: string[]
  notes?: string | null
}
