<template>
  <div class="incitement-management-container">
    <n-space vertical size="large">
      <!-- Header -->
      <n-page-header>
        <template #title>
          <span>煽動指數分析管理</span>
        </template>
        <template #subtitle>
          <span>管理事件的煽動指數分析狀態</span>
        </template>
        <template #extra>
          <n-space>
            <n-button @click="loadEvents" :loading="loading">
              <template #icon>
                <n-icon><RefreshOutline /></n-icon>
              </template>
              刷新
            </n-button>
            <n-button type="primary" @click="showBatchAnalyzeModal = true">
              <template #icon>
                <n-icon><AnalyticsOutline /></n-icon>
              </template>
              批量分析
            </n-button>
          </n-space>
        </template>
      </n-page-header>

      <!-- Statistics Cards -->
      <n-grid :cols="4" :x-gap="16">
        <n-grid-item>
          <n-statistic label="總事件數" :value="stats.total" />
        </n-grid-item>
        <n-grid-item>
          <n-statistic label="已分析" :value="stats.analyzed">
            <template #suffix>
              <n-text depth="3" style="font-size: 14px;">
                ({{ ((stats.analyzed / stats.total) * 100).toFixed(1) }}%)
              </n-text>
            </template>
          </n-statistic>
        </n-grid-item>
        <n-grid-item>
          <n-statistic label="未分析" :value="stats.notAnalyzed">
            <template #suffix>
              <n-text type="warning" style="font-size: 14px;">
                ({{ ((stats.notAnalyzed / stats.total) * 100).toFixed(1) }}%)
              </n-text>
            </template>
          </n-statistic>
        </n-grid-item>
        <n-grid-item>
          <n-statistic label="部分分析" :value="stats.partial">
            <template #suffix>
              <n-text type="info" style="font-size: 14px;">
                ({{ ((stats.partial / stats.total) * 100).toFixed(1) }}%)
              </n-text>
            </template>
          </n-statistic>
        </n-grid-item>
      </n-grid>

      <!-- Filters -->
      <n-card size="small">
        <n-space align="center">
          <span>篩選：</span>
          <n-select
            v-model:value="filterStatus"
            :options="statusOptions"
            placeholder="分析狀態"
            clearable
            style="width: 150px;"
            @update:value="loadEvents"
          />
          <n-input
            v-model:value="searchTopic"
            placeholder="搜尋事件主題"
            clearable
            style="width: 300px;"
            @input="handleSearch"
          >
            <template #prefix>
              <n-icon><SearchOutline /></n-icon>
            </template>
          </n-input>
        </n-space>
      </n-card>

      <!-- Events Table -->
      <n-card>
        <n-data-table
          :columns="columns"
          :data="filteredEvents"
          :loading="loading"
          :pagination="pagination"
          :row-key="(row: EventAnalysisStatus) => row.eventId"
        />
      </n-card>
    </n-space>

    <!-- Batch Analyze Modal -->
    <n-modal
      v-model:show="showBatchAnalyzeModal"
      preset="dialog"
      title="批量分析事件"
      positive-text="開始分析"
      negative-text="取消"
      :loading="batchAnalyzing"
      @positive-click="handleBatchAnalyze"
    >
      <n-space vertical>
        <n-alert type="info" title="提示">
          <ul style="margin: 8px 0; padding-left: 20px;">
            <li>批量分析將為選中的事件執行煽動指數分析</li>
            <li>已有分析的文章會自動跳過</li>
            <li>每篇文章約需 5-10 秒</li>
            <li>建議在低峰時段執行</li>
          </ul>
        </n-alert>

        <n-radio-group v-model:value="batchAnalyzeMode">
          <n-space vertical>
            <n-radio value="unanalyzed">
              只分析未分析的事件 ({{ stats.notAnalyzed }} 個)
            </n-radio>
            <n-radio value="partial">
              只分析部分分析的事件 ({{ stats.partial }} 個)
            </n-radio>
            <n-radio value="all">
              分析所有事件 ({{ stats.total }} 個)
            </n-radio>
            <n-radio value="selected">
              分析選中的事件
              <n-transfer
                v-if="batchAnalyzeMode === 'selected'"
                v-model:value="selectedEventIds"
                :options="transferOptions"
                style="margin-top: 8px;"
              />
            </n-radio>
          </n-space>
        </n-radio-group>

        <!-- Progress -->
        <div v-if="batchProgress.total > 0">
          <n-progress
            type="line"
            :percentage="(batchProgress.completed / batchProgress.total) * 100"
            :status="batchProgress.completed === batchProgress.total ? 'success' : 'info'"
          />
          <n-text depth="3" style="font-size: 12px;">
            進度: {{ batchProgress.completed }} / {{ batchProgress.total }}
            (成功: {{ batchProgress.success }}, 失敗: {{ batchProgress.failed }})
          </n-text>
        </div>
      </n-space>
    </n-modal>

    <!-- Analyze Single Event Modal -->
    <n-modal
      v-model:show="showAnalyzeModal"
      preset="dialog"
      title="分析事件"
      :positive-text="analyzing ? '分析中...' : '開始分析'"
      negative-text="取消"
      :loading="analyzing"
      @positive-click="handleAnalyze"
    >
      <n-space vertical v-if="currentEvent">
        <n-descriptions :column="1" bordered size="small">
          <n-descriptions-item label="事件 ID">
            {{ currentEvent.eventId }}
          </n-descriptions-item>
          <n-descriptions-item label="主題">
            {{ currentEvent.topic }}
          </n-descriptions-item>
          <n-descriptions-item label="文章數">
            {{ currentEvent.articleCount }}
          </n-descriptions-item>
          <n-descriptions-item label="已分析文章">
            {{ currentEvent.analyzedArticles }}
          </n-descriptions-item>
          <n-descriptions-item label="未分析文章">
            {{ currentEvent.articleCount - currentEvent.analyzedArticles }}
          </n-descriptions-item>
        </n-descriptions>

        <n-alert v-if="currentEvent.analyzedArticles === currentEvent.articleCount" type="success">
          此事件的所有文章都已分析完成
        </n-alert>
        <n-alert v-else type="warning">
          將分析 {{ currentEvent.articleCount - currentEvent.analyzedArticles }} 篇未分析的文章
        </n-alert>
      </n-space>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, h } from 'vue'
import {
  NSpace,
  NPageHeader,
  NButton,
  NIcon,
  NGrid,
  NGridItem,
  NStatistic,
  NCard,
  NSelect,
  NInput,
  NDataTable,
  NModal,
  NAlert,
  NRadioGroup,
  NRadio,
  NTransfer,
  NProgress,
  NDescriptions,
  NDescriptionsItem,
  NTag,
  NText,
  useMessage,
  type DataTableColumns,
  type TransferOption
} from 'naive-ui'
import {
  RefreshOutline,
  AnalyticsOutline,
  SearchOutline,
  CheckmarkCircleOutline,
  AlertCircleOutline,
  TimeOutline
} from '@vicons/ionicons5'
import { publicApi, adminApi } from '@/api/client'

interface EventAnalysisStatus {
  eventId: number
  topic: string
  articleCount: number
  analyzedArticles: number
  outletCount: number
  state: string
  updatedAt: string
  status: 'analyzed' | 'partial' | 'not-analyzed'
}

const message = useMessage()
const loading = ref(false)
const events = ref<EventAnalysisStatus[]>([])
const filterStatus = ref<string>('')
const searchTopic = ref('')

// Statistics
const stats = computed(() => {
  const total = events.value.length
  const analyzed = events.value.filter((e) => e.status === 'analyzed').length
  const notAnalyzed = events.value.filter((e) => e.status === 'not-analyzed').length
  const partial = events.value.filter((e) => e.status === 'partial').length

  return { total, analyzed, notAnalyzed, partial }
})

// Filter options
const statusOptions = [
  { label: '全部', value: '' },
  { label: '已分析', value: 'analyzed' },
  { label: '未分析', value: 'not-analyzed' },
  { label: '部分分析', value: 'partial' }
]

// Filtered events
const filteredEvents = computed(() => {
  let result = events.value

  if (filterStatus.value) {
    result = result.filter((e) => e.status === filterStatus.value)
  }

  if (searchTopic.value) {
    const keyword = searchTopic.value.toLowerCase()
    result = result.filter((e) => e.topic.toLowerCase().includes(keyword))
  }

  return result
})

// Pagination
const pagination = ref({
  page: 1,
  pageSize: 20,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100]
})

// Table columns
const columns: DataTableColumns<EventAnalysisStatus> = [
  {
    title: 'ID',
    key: 'eventId',
    width: 80,
    sorter: (a, b) => a.eventId - b.eventId
  },
  {
    title: '主題',
    key: 'topic',
    ellipsis: {
      tooltip: true
    }
  },
  {
    title: '狀態',
    key: 'status',
    width: 120,
    render: (row) => {
      const statusConfig = {
        analyzed: { type: 'success' as const, icon: CheckmarkCircleOutline, text: '已分析' },
        partial: { type: 'warning' as const, icon: TimeOutline, text: '部分分析' },
        'not-analyzed': { type: 'error' as const, icon: AlertCircleOutline, text: '未分析' }
      }
      const config = statusConfig[row.status]
      return h(
        NTag,
        { type: config.type, size: 'small' },
        {
          default: () => config.text,
          icon: () => h(NIcon, { component: config.icon })
        }
      )
    }
  },
  {
    title: '文章數',
    key: 'articleCount',
    width: 100,
    sorter: (a, b) => a.articleCount - b.articleCount
  },
  {
    title: '已分析',
    key: 'analyzedArticles',
    width: 100,
    render: (row) => {
      const percent = row.articleCount > 0 
        ? ((row.analyzedArticles / row.articleCount) * 100).toFixed(0) 
        : 0
      return h(
        NText,
        { type: row.analyzedArticles === row.articleCount ? 'success' : 'warning' },
        { default: () => `${row.analyzedArticles} (${percent}%)` }
      )
    }
  },
  {
    title: '媒體數',
    key: 'outletCount',
    width: 100
  },
  {
    title: '更新時間',
    key: 'updatedAt',
    width: 180,
    render: (row) => new Date(row.updatedAt).toLocaleString('zh-TW')
  },
  {
    title: '操作',
    key: 'actions',
    width: 180,
    render: (row) => {
      return h(
        NSpace,
        {},
        {
          default: () => [
            h(
              NButton,
              {
                size: 'small',
                type: 'primary',
                onClick: () => analyzeEvent(row)
              },
              { default: () => '分析' }
            ),
            h(
              NButton,
              {
                size: 'small',
                onClick: () => viewSpectrum(row.eventId)
              },
              { default: () => '查看光譜' }
            )
          ]
        }
      )
    }
  }
]

// Batch analyze
const showBatchAnalyzeModal = ref(false)
const batchAnalyzing = ref(false)
const batchAnalyzeMode = ref<'unanalyzed' | 'partial' | 'all' | 'selected'>('unanalyzed')
const selectedEventIds = ref<number[]>([])
const batchProgress = ref({
  total: 0,
  completed: 0,
  success: 0,
  failed: 0
})

const transferOptions = computed<TransferOption[]>(() => {
  return events.value.map((e) => ({
    label: `#${e.eventId} - ${e.topic}`,
    value: e.eventId
  }))
})

// Single analyze
const showAnalyzeModal = ref(false)
const analyzing = ref(false)
const currentEvent = ref<EventAnalysisStatus | null>(null)

// Load events
async function loadEvents() {
  loading.value = true
  try {
    // Fetch all events
    const eventsRes = await publicApi.get('/events', {
      params: { size: 1000 }
    })
    const allEvents = eventsRes.data.content || []

    // For each event, check analysis status
    const statusPromises = allEvents.map(async (event: any) => {
      const articleCount = event.articleCount || 0
      try {
        // Get analyzed articles count from incitement endpoint
        const analysisRes = await publicApi.get(`/events/${event.eventId}/incitement`)
        const analyzedArticles = analysisRes.data?.statistics?.totalArticles || 0
        const outletCount = analysisRes.data?.statistics?.totalOutlets || 0

        let status: 'analyzed' | 'partial' | 'not-analyzed'
        if (analyzedArticles === 0) {
          status = 'not-analyzed'
        } else if (analyzedArticles < articleCount) {
          status = 'partial'
        } else {
          status = 'analyzed'
        }

        return {
          eventId: event.eventId,
          topic: event.topic,
          articleCount,
          analyzedArticles,
          outletCount,
          state: event.state,
          updatedAt: event.updatedAt,
          status
        }
      } catch (error: any) {
        // 404 means no incitement analysis exists yet（error interceptor 已轉換成 Error）
        if (error.message === '查無資料') {
          return {
            eventId: event.eventId,
            topic: event.topic,
            articleCount,
            analyzedArticles: 0,
            outletCount: 0,
            state: event.state,
            updatedAt: event.updatedAt,
            status: 'not-analyzed' as const
          }
        }
        throw error
      }
    })

    events.value = await Promise.all(statusPromises)
  } catch (error: any) {
    message.error('載入事件失敗: ' + (error.message || '未知錯誤'))
  } finally {
    loading.value = false
  }
}

function handleSearch() {
  // Debounce search
  // Search is handled by computed property
}

// Analyze single event
function analyzeEvent(event: EventAnalysisStatus) {
  currentEvent.value = event
  showAnalyzeModal.value = true
}

async function handleAnalyze() {
  if (!currentEvent.value) return

  analyzing.value = true
  try {
    const response = await adminApi.post(
      `/admin/events/${currentEvent.value.eventId}/analyze-incitement`
    )

    message.success(response.data.message || '分析完成')
    showAnalyzeModal.value = false

    // Reload events
    await loadEvents()
  } catch (error: any) {
    message.error('分析失敗: ' + (error.message || '未知錯誤'))
    return false
  } finally {
    analyzing.value = false
  }
}

// Batch analyze
async function handleBatchAnalyze() {
  const eventsToAnalyze = getEventsToAnalyze()

  if (eventsToAnalyze.length === 0) {
    message.warning('沒有需要分析的事件')
    return false
  }

  batchAnalyzing.value = true
  batchProgress.value = {
    total: eventsToAnalyze.length,
    completed: 0,
    success: 0,
    failed: 0
  }

  for (const event of eventsToAnalyze) {
    try {
      await adminApi.post(`/admin/events/${event.eventId}/analyze-incitement`)
      batchProgress.value.success++
      message.success(`事件 #${event.eventId} 分析完成`)
    } catch (error: any) {
      batchProgress.value.failed++
      message.error(`事件 #${event.eventId} 分析失敗: ${error.message}`)
    } finally {
      batchProgress.value.completed++
    }

    // Small delay to avoid overloading
    await new Promise((resolve) => setTimeout(resolve, 1000))
  }

  batchAnalyzing.value = false
  showBatchAnalyzeModal.value = false
  message.success(
    `批量分析完成！成功: ${batchProgress.value.success}, 失敗: ${batchProgress.value.failed}`
  )

  // Reload events
  await loadEvents()
}

function getEventsToAnalyze(): EventAnalysisStatus[] {
  switch (batchAnalyzeMode.value) {
    case 'unanalyzed':
      return events.value.filter((e) => e.status === 'not-analyzed')
    case 'partial':
      return events.value.filter((e) => e.status === 'partial')
    case 'all':
      return events.value
    case 'selected':
      return events.value.filter((e) => selectedEventIds.value.includes(e.eventId))
    default:
      return []
  }
}

function viewSpectrum(eventId: number) {
  window.open(`/events/${eventId}/incitement`, '_blank')
}

onMounted(() => {
  loadEvents()
})
</script>

<style scoped>
.incitement-management-container {
  max-width: 1600px;
  margin: 0 auto;
  padding: 24px;
}
</style>
