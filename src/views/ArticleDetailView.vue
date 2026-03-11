<template>
  <div class="article-detail-container">
    <n-space vertical size="large">
      <!-- Back Button -->
      <n-button @click="router.back()">← 返回</n-button>

      <!-- Loading -->
      <n-spin :show="loading">
        <div v-if="article">
          <!-- Basic Info -->
          <n-card title="文章資訊">
            <n-descriptions :column="1" bordered>
              <n-descriptions-item label="標題">
                {{ article.title || '(無標題)' }}
              </n-descriptions-item>
              <n-descriptions-item label="作者">
                {{ article.author || '-' }}
              </n-descriptions-item>
              <n-descriptions-item label="來源">
                {{ article.sourceName || '-' }}
              </n-descriptions-item>
              <n-descriptions-item label="網址">
                <n-a :href="article.url" target="_blank">{{ article.url }}</n-a>
              </n-descriptions-item>
              <n-descriptions-item label="發布時間">
                {{ formatDisplay(article.publishedAt) }}
              </n-descriptions-item>
              <n-descriptions-item label="狀態">
                <n-tag :type="getStatusType(article.status || 'PENDING')" size="small">
                  {{ article.status }}
                </n-tag>
              </n-descriptions-item>
            </n-descriptions>
          </n-card>

          <!-- Content -->
          <n-card title="文章內容">
            <div v-if="article.cleanText">
              <n-collapse-transition :show="showFullText">
                <div style="white-space: pre-wrap; line-height: 1.8">
                  {{ showFullText ? article.cleanText : truncateText(article.cleanText) }}
                </div>
              </n-collapse-transition>
              <n-button v-if="article.cleanText.length > 500" text @click="showFullText = !showFullText">
                {{ showFullText ? '收起' : '展開全文' }}
              </n-button>
            </div>
            <n-empty v-else description="無文章內容" />
          </n-card>

          <!-- Analysis -->
          <n-card title="分析結果">
            <n-descriptions :column="2" bordered>
              <n-descriptions-item label="主題">
                {{ article.topic || '-' }}
              </n-descriptions-item>
              <n-descriptions-item label="新聞類型">
                <n-tag v-if="article.newsType" :type="getNewsTypeTag(article.newsType)" size="small">
                  {{ getNewsTypeText(article.newsType) }}
                </n-tag>
                <span v-else>-</span>
              </n-descriptions-item>
              <n-descriptions-item label="事件 ID" :span="2">
                <n-button
                  v-if="article.eventId"
                  text
                  type="primary"
                  @click="router.push(`/events/${article.eventId}`)"
                >
                  {{ article.eventId }}（查看事件）
                </n-button>
                <span v-else>-</span>
              </n-descriptions-item>
              <n-descriptions-item label="事件摘要" :span="2">
                {{ article.eventSummary || '-' }}
              </n-descriptions-item>
              <n-descriptions-item v-if="article.actors" label="參與者" :span="2">
                <pre>{{ JSON.stringify(article.actors, null, 2) }}</pre>
              </n-descriptions-item>
            </n-descriptions>
          </n-card>

          <!-- Incitation Analysis -->
          <n-card v-if="incitationAnalysis" title="煽動指數分析">
            <n-space vertical size="large">
              <!-- Overall Score -->
              <n-descriptions :column="2" bordered>
                <n-descriptions-item label="煽動指數">
                  <span :style="{ 
                    color: getIncitementColor(incitationAnalysis.incitementScore), 
                    fontWeight: '600', 
                    fontSize: '18px' 
                  }">
                    {{ incitationAnalysis.incitementScore.toFixed(1) }}
                  </span>
                  <n-tag 
                    :type="incitationAnalysis.incitementScore > 70 ? 'error' : incitationAnalysis.incitementScore > 40 ? 'warning' : 'success'" 
                    size="small" 
                    style="margin-left: 8px"
                  >
                    {{ getIncitementLevel(incitationAnalysis.incitementScore) }}
                  </n-tag>
                </n-descriptions-item>
                <n-descriptions-item label="分析信心度">
                  {{ incitationAnalysis.confidence ? (incitationAnalysis.confidence * 100).toFixed(1) + '%' : '-' }}
                </n-descriptions-item>
              </n-descriptions>

              <!-- Stance Analysis -->
              <n-descriptions v-if="incitationAnalysis.stancePolarity !== null && incitationAnalysis.stancePolarity !== undefined" :column="2" bordered>
                <n-descriptions-item label="立場傾向">
                  <span :style="{ 
                    color: getStanceColor(incitationAnalysis.stancePolarity), 
                    fontWeight: '600', 
                    fontSize: '16px' 
                  }">
                    {{ getStanceLabel(incitationAnalysis.stancePolarity) }}
                  </span>
                  <span style="margin-left: 8px; color: #8c8c8c;">
                    ({{ incitationAnalysis.stancePolarity.toFixed(2) }})
                  </span>
                </n-descriptions-item>
                <n-descriptions-item label="立場目標">
                  {{ incitationAnalysis.stanceTarget || '-' }}
                </n-descriptions-item>
                <n-descriptions-item label="立場信心度" :span="2">
                  {{ incitationAnalysis.stanceConfidence ? (incitationAnalysis.stanceConfidence * 100).toFixed(1) + '%' : '-' }}
                </n-descriptions-item>
              </n-descriptions>

              <!-- 7 Dimensions -->
              <div>
                <h3 style="margin-bottom: 16px;">詳細維度分析</h3>
                <n-space vertical>
                  <div v-for="dim in dimensions" :key="dim.key" style="margin-bottom: 12px;">
                    <div style="display: flex; justify-content: space-between; margin-bottom: 4px;">
                      <span style="font-weight: 500;">{{ dim.label }}</span>
                      <span style="font-weight: 600; color: #1890ff;">{{ getDimValue(dim.key) }}/5</span>
                    </div>
                    <n-progress 
                      :percentage="(getDimValue(dim.key) / 5) * 100" 
                      :color="getDimValue(dim.key) > 3 ? '#ff4d4f' : getDimValue(dim.key) > 2 ? '#faad14' : '#52c41a'"
                      :show-indicator="false"
                    />
                  </div>
                </n-space>
              </div>

              <!-- Metadata -->
              <n-descriptions :column="2" bordered>
                <n-descriptions-item label="分析時間">
                  {{ formatDisplay(incitationAnalysis.computedAt) }}
                </n-descriptions-item>
                <n-descriptions-item label="模型版本">
                  {{ incitationAnalysis.version }}
                </n-descriptions-item>
              </n-descriptions>

              <!-- Evidence Fragments -->
              <div v-if="evidenceFragments && evidenceFragments.length > 0">
                <h3 style="margin-bottom: 16px;">🔍 分析證據片段</h3>
                <n-collapse>
                  <n-collapse-item title="查看詳細證據" name="evidence">
                    <n-space vertical>
                      <n-card
                        v-for="(evidence, index) in evidenceFragments"
                        :key="evidence.id"
                        size="small"
                        :title="`證據 ${index + 1}`"
                      >
                        <p style="white-space: pre-wrap; line-height: 1.6; color: #333;">
                          {{ evidence.text }}
                        </p>
                        
                        <!-- 分析原因 -->
                        <n-alert v-if="evidence.notes" type="info" style="margin-top: 12px;" :bordered="false">
                          <template #header>
                            <span style="font-weight: 600;">💡 分析理由</span>
                          </template>
                          {{ evidence.notes }}
                        </n-alert>
                        
                        <template #footer>
                          <n-space>
                            <n-tag size="small" :type="getAttributionTypeTag(evidence.attributionType)">
                              {{ getAttributionTypeText(evidence.attributionType) }}
                            </n-tag>
                            <span v-if="evidence.targetsJson.length > 0" style="font-size: 12px; color: #666;">
                              目標: {{ evidence.targetsJson.join(', ') }}
                            </span>
                            <span v-if="evidence.dimsJson && Object.keys(evidence.dimsJson).length > 0" style="font-size: 12px; color: #999;">
                              維度: {{ Object.entries(evidence.dimsJson).map(([k, v]) => `${k}:${v}`).join(', ') }}
                            </span>
                          </n-space>
                        </template>
                      </n-card>
                    </n-space>
                  </n-collapse-item>
                </n-collapse>
              </div>
            </n-space>
          </n-card>

          <!-- No Analysis Message -->
          <n-card v-else title="煽動指數分析">
            <n-empty description="此文章暫無煽動指數分析">
              <template #extra>
                <n-text depth="3" style="font-size: 12px;">
                  可能是低價值新聞（娛樂、體育等）或尚未分配事件
                </n-text>
              </template>
            </n-empty>
          </n-card>

          <!-- Metadata -->
          <n-card title="元數據">
            <n-descriptions :column="2" bordered>
              <n-descriptions-item label="文章 ID">
                {{ article.id }}
              </n-descriptions-item>
              <n-descriptions-item label="建立時間">
                {{ formatDisplay(article.createdAt) }}
              </n-descriptions-item>
              <n-descriptions-item label="更新時間" :span="2">
                {{ formatDisplay(article.updatedAt) }}
              </n-descriptions-item>
            </n-descriptions>
          </n-card>
        </div>
      </n-spin>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  NSpace,
  NButton,
  NSpin,
  NCard,
  NDescriptions,
  NDescriptionsItem,
  NTag,
  NA,
  NEmpty,
  NCollapseTransition,
  NCollapse,
  NCollapseItem,
  NAlert,
  NProgress,
  NText,
  useMessage
} from 'naive-ui'
import { getArticleById, getArticleIncitationAnalysis, getArticleIncitationEvidence } from '@/api/articles'
import type { Article, ArticleIncitationAnalysis, ArticleIncitationEvidence } from '@/types'
import { formatDisplay } from '@/utils/date'

interface Props {
  id: string
}

const props = defineProps<Props>()
const router = useRouter()
const message = useMessage()

const article = ref<Article | null>(null)
const incitationAnalysis = ref<ArticleIncitationAnalysis | null>(null)
const evidenceFragments = ref<ArticleIncitationEvidence[]>([])
const loading = ref(false)
const showFullText = ref(false)

// 7 個維度的定義
const dimensions = [
  { key: 'dimA', label: 'A. 陣營化/二分對立' },
  { key: 'dimB', label: 'B. 道德譴責與妖魔化' },
  { key: 'dimC', label: 'C. 威脅放大' },
  { key: 'dimD', label: 'D. 歸因與替罪羊' },
  { key: 'dimE', label: 'E. 行動號召/懲罰正當化' },
  { key: 'dimF', label: 'F. 未證實指控與陰謀化' },
  { key: 'dimG', label: 'G. 武斷確定性' }
]

function getStatusType(status: string): any {
  const map: Record<string, string> = {
    DONE: 'success',
    PENDING: 'warning',
    PROCESSING: 'info',
    ERROR: 'error'
  }
  return map[status] || 'default'
}

function getNewsTypeTag(type: string): any {
  const map: Record<string, string> = {
    FACTUAL: 'success',
    REPOST: 'warning',
    COMMENTARY: 'info',
    NARRATIVE: 'error'
  }
  return map[type] || 'default'
}

function getNewsTypeText(type: string): string {
  const map: Record<string, string> = {
    FACTUAL: '事實報導',
    REPOST: '轉述引述',
    COMMENTARY: '網紅評論',
    NARRATIVE: '帶風向',
    UNKNOWN: '未知'
  }
  return map[type] || type
}

function getStanceColor(polarity: number): string {
  if (polarity < -0.3) return '#3b82f6'   // 藍色（偏藍）
  if (polarity > 0.3) return '#22c55e'   // 綠色（偏綠）
  return '#9ca3af'                       // 灰色（中立）
}

function getStanceLabel(polarity: number): string {
  if (polarity > 0.5) return '偏綠'
  if (polarity > 0.2) return '略偏綠'
  if (polarity < -0.5) return '偏藍'
  if (polarity < -0.2) return '略偏藍'
  return '中立'
}

function getIncitementColor(score: number): string {
  if (score > 70) return '#ff4d4f'   // 紅色（高煽動）
  if (score > 40) return '#faad14'   // 橙色（中等）
  return '#52c41a'                   // 綠色（低煽動）
}

function getIncitementLevel(score: number): string {
  if (score > 70) return '高'
  if (score > 40) return '中'
  return '低'
}

function getDimValue(key: string): number {
  if (!incitationAnalysis.value) return 0
  const value = incitationAnalysis.value[key as keyof ArticleIncitationAnalysis]
  return typeof value === 'number' ? value : 0
}

function getAttributionTypeTag(type: string): 'default' | 'error' | 'warning' | 'success' | 'primary' | 'info' {
  const map: Record<string, 'default' | 'error' | 'warning' | 'success' | 'primary' | 'info'> = {
    OUTLET_VOICE: 'error',      // 紅色 - 媒體自身聲音
    QUOTED_SOURCE: 'warning',   // 橙色 - 引述消息來源
    OPPONENT_QUOTE: 'info'      // 藍色 - 引述對手陣營
  }
  return map[type] || 'default'
}

function getAttributionTypeText(type: string): string {
  const map: Record<string, string> = {
    OUTLET_VOICE: '媒體論述',
    QUOTED_SOURCE: '引述來源',
    OPPONENT_QUOTE: '對手言論'
  }
  return map[type] || type
}

function truncateText(text: string, maxLength: number = 500): string {
  if (text.length <= maxLength) return text
  return text.substring(0, maxLength) + '...'
}

async function loadArticle() {
  try {
    loading.value = true
    const articleId = parseInt(props.id)
    
    // 獲取文章基本資訊
    article.value = await getArticleById(articleId)
    
    // 獲取煽動指數分析（可能為 null）
    incitationAnalysis.value = await getArticleIncitationAnalysis(articleId)
    
    // 如果有煽動指數分析，則獲取證據片段
    if (incitationAnalysis.value) {
      try {
        evidenceFragments.value = await getArticleIncitationEvidence(articleId)
      } catch (error) {
        console.warn('Failed to load evidence fragments:', error)
        evidenceFragments.value = []
      }
    }
  } catch (error: any) {
    message.error(error.message || '載入文章詳情失敗')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadArticle()
})
</script>

<style scoped>
.article-detail-container {
  max-width: 1400px;
  margin: 0 auto;
}

pre {
  margin: 0;
  font-size: 12px;
  background-color: #f5f5f5;
  padding: 8px;
  border-radius: 4px;
  overflow-x: auto;
}
</style>
