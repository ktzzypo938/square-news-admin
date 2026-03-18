<template>
  <div class="event-aggregation-container">
    <n-space vertical size="large">
      <n-h2>事件聚合管理</n-h2>

      <n-alert type="info" title="功能說明">
        管理事件的聚合關係。可以刪除事件、解散事件（重新聚合文章）、移除或添加文章到事件。
      </n-alert>

      <!-- 搜尋和篩選 -->
      <n-card>
        <n-space>
          <n-input
            v-model:value="searchTopic"
            placeholder="搜尋事件主題..."
            clearable
            style="width: 300px"
            @keyup.enter="loadEvents"
          />
          <n-select
            v-model:value="stateFilter"
            :options="stateOptions"
            placeholder="狀態篩選"
            clearable
            style="width: 150px"
          />
          <n-button type="primary" @click="loadEvents">搜尋</n-button>
          <n-button @click="resetFilters">重置</n-button>
        </n-space>
      </n-card>

      <!-- 事件列表 -->
      <n-card title="事件列表">
        <n-data-table
          remote
          :columns="eventColumns"
          :data="events"
          :loading="loading"
          :pagination="pagination"
          :row-key="(row: Event) => row.eventId"
          @update:page="handlePageChange"
          @update:page-size="handlePageSizeChange"
        />
      </n-card>

      <!-- 批量重聚按鈕 -->
      <n-card title="批量操作">
        <n-space>
          <n-button type="warning" @click="showBatchReaggregateModal = true">
            批量重新聚合文章
          </n-button>
        </n-space>
      </n-card>
    </n-space>

    <!-- 事件詳情對話框 -->
    <n-modal v-model:show="showEventDetailModal" preset="card" style="width: 900px" title="事件詳情">
      <template v-if="selectedEvent">
        <n-descriptions :column="2" label-placement="left" bordered>
          <n-descriptions-item label="事件 ID">{{ selectedEvent.eventId }}</n-descriptions-item>
          <n-descriptions-item label="狀態">
            <n-tag :type="selectedEvent.state === 'OPEN' ? 'success' : 'default'">
              {{ selectedEvent.state }}
            </n-tag>
          </n-descriptions-item>
          <n-descriptions-item label="主題" :span="2">{{ selectedEvent.topic }}</n-descriptions-item>
          <n-descriptions-item label="文章數">{{ selectedEvent.articleCount || 0 }}</n-descriptions-item>
          <n-descriptions-item label="媒體數">{{ selectedEvent.sourceCount || 0 }}</n-descriptions-item>
        </n-descriptions>

        <n-divider>相關文章</n-divider>

        <n-data-table
          :columns="articleColumns"
          :data="eventArticles"
          :loading="loadingArticles"
          :pagination="{ pageSize: 10 }"
          :row-key="(row: Article) => row.id"
          v-model:checked-row-keys="selectedArticleIds"
          size="small"
        />

        <n-space justify="space-between" style="margin-top: 16px">
          <n-space>
            <n-text depth="3">已選 {{ selectedArticleIds.length }} 篇</n-text>
            <n-button
              type="warning"
              :disabled="selectedArticleIds.length === 0"
              :loading="removingArticles"
              @click="handleRemoveArticles"
            >
              從事件移除
            </n-button>
          </n-space>
          <n-space>
            <n-button @click="handleRecalculate" :loading="recalculating">重新計算統計</n-button>
            <n-button @click="handleRegenerate" :loading="regenerating">重新生成 AI 分析</n-button>
          </n-space>
        </n-space>
      </template>
    </n-modal>

    <!-- 刪除確認對話框 -->
    <n-modal v-model:show="showDeleteConfirm" preset="dialog" type="warning" title="確認刪除事件">
      <template v-if="eventToDelete">
        <n-text>確定要刪除事件「{{ eventToDelete.topic }}」嗎？</n-text>
        <n-text depth="3" tag="p">文章將保留，但會解除與此事件的關聯。</n-text>
      </template>
      <template #action>
        <n-space>
          <n-button @click="showDeleteConfirm = false">取消</n-button>
          <n-button type="error" :loading="deleting" @click="confirmDelete">確認刪除</n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- 解散確認對話框 -->
    <n-modal v-model:show="showDissolveConfirm" preset="dialog" type="warning" title="確認解散事件">
      <template v-if="eventToDissolve">
        <n-text>確定要解散事件「{{ eventToDissolve.topic }}」嗎？</n-text>
        <n-text depth="3" tag="p">
          事件將被刪除，{{ eventToDissolve.articleCount || 0 }} 篇文章將重新進入聚合流程。
        </n-text>
        <n-alert type="warning" style="margin-top: 12px" v-if="!dissolving">
          <template #header>處理時間提醒</template>
          為確保聚合準確性，每篇文章會依序處理（約 3-5 秒/篇）。
          預估需要 {{ Math.ceil((eventToDissolve.articleCount || 1) * 4 / 60) }} 分鐘，請耐心等待。
        </n-alert>
        <n-alert type="info" style="margin-top: 12px" v-if="dissolving">
          <template #header>正在處理中...</template>
          正在依序重新聚合 {{ eventToDissolve.articleCount || 0 }} 篇文章，請勿關閉此視窗。
        </n-alert>
      </template>
      <template #action>
        <n-space>
          <n-button @click="showDissolveConfirm = false" :disabled="dissolving">取消</n-button>
          <n-button type="warning" :loading="dissolving" @click="confirmDissolve">
            {{ dissolving ? '處理中...' : '確認解散' }}
          </n-button>
        </n-space>
      </template>
    </n-modal>

    <!-- 批量重聚對話框 -->
    <n-modal v-model:show="showBatchReaggregateModal" preset="card" style="width: 800px" title="批量重新聚合文章">
      <n-space vertical size="medium">
        <n-space>
          <n-input
            v-model:value="batchSearchQuery"
            placeholder="搜尋文章..."
            clearable
            style="width: 300px"
          />
          <n-button type="primary" :loading="batchSearching" @click="searchForBatchReaggregate">
            搜尋
          </n-button>
        </n-space>

        <n-data-table
          :columns="batchArticleColumns"
          :data="batchSearchResults"
          :loading="batchSearching"
          :pagination="{ pageSize: 10 }"
          :row-key="(row: Article) => row.id"
          v-model:checked-row-keys="batchSelectedIds"
          size="small"
        />

        <n-alert type="warning" style="margin-top: 8px" v-if="batchSelectedIds.length > 0 && !batchReaggregating">
          <template #header>處理時間提醒</template>
          為確保聚合準確性，每篇文章會依序處理（約 3-5 秒/篇）。
          已選 {{ batchSelectedIds.length }} 篇，預估需要 {{ Math.ceil(batchSelectedIds.length * 4 / 60) || 1 }} 分鐘。
        </n-alert>

        <n-alert type="info" style="margin-top: 8px" v-if="batchReaggregating">
          <template #header>正在處理中...</template>
          正在依序重新聚合 {{ batchSelectedIds.length }} 篇文章，請勿關閉此視窗。
        </n-alert>

        <n-space justify="space-between" style="margin-top: 12px">
          <n-text depth="3">已選 {{ batchSelectedIds.length }} 篇</n-text>
          <n-button
            type="warning"
            :disabled="batchSelectedIds.length === 0 || batchReaggregating"
            :loading="batchReaggregating"
            @click="handleBatchReaggregate"
          >
            {{ batchReaggregating ? '處理中...' : '重新聚合所選文章' }}
          </n-button>
        </n-space>
      </n-space>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, h, onMounted } from 'vue'
import {
  NH2,
  NSpace,
  NAlert,
  NCard,
  NInput,
  NSelect,
  NButton,
  NDataTable,
  NModal,
  NDescriptions,
  NDescriptionsItem,
  NDivider,
  NTag,
  NText,
  useMessage
} from 'naive-ui'
import type { DataTableColumns, DataTableRowKey, PaginationProps } from 'naive-ui'
import {
  getEvents,
  getEventArticles,
  deleteEvent,
  dissolveEvent,
  removeArticlesFromEvent,
  recalculateEvent,
  regenerateEvent
} from '@/api/events'
import { searchArticles, batchReaggregateArticles } from '@/api/articles'
import type { Event, Article } from '@/types'
import { formatDisplay } from '@/utils/date'

const message = useMessage()

// 狀態
const loading = ref(false)
const events = ref<Event[]>([])
const searchTopic = ref('')
const stateFilter = ref<string | null>(null)
const totalEvents = ref(0)

// 分頁
const pagination = ref<PaginationProps>({
  page: 1,
  pageSize: 20,
  showSizePicker: true,
  pageSizes: [10, 20, 50, 100],
  itemCount: 0
})

// 事件詳情
const showEventDetailModal = ref(false)
const selectedEvent = ref<Event | null>(null)
const eventArticles = ref<Article[]>([])
const loadingArticles = ref(false)
const selectedArticleIds = ref<DataTableRowKey[]>([])

// 刪除
const showDeleteConfirm = ref(false)
const eventToDelete = ref<Event | null>(null)
const deleting = ref(false)

// 解散
const showDissolveConfirm = ref(false)
const eventToDissolve = ref<Event | null>(null)
const dissolving = ref(false)

// 移除文章
const removingArticles = ref(false)

// 重新計算/生成
const recalculating = ref(false)
const regenerating = ref(false)

// 批量重聚
const showBatchReaggregateModal = ref(false)
const batchSearchQuery = ref('')
const batchSearchResults = ref<Article[]>([])
const batchSearching = ref(false)
const batchSelectedIds = ref<DataTableRowKey[]>([])
const batchReaggregating = ref(false)

const stateOptions = [
  { label: '開放', value: 'OPEN' },
  { label: '關閉', value: 'CLOSED' },
  { label: '審核中', value: 'REVIEW' }
]

// 事件表格列
const eventColumns: DataTableColumns<Event> = [
  { title: 'ID', key: 'eventId', width: 80 },
  {
    title: '主題',
    key: 'topic',
    ellipsis: { tooltip: true },
    render: (row) => h(NText, null, { default: () => row.topic || '(無主題)' })
  },
  {
    title: '狀態',
    key: 'state',
    width: 100,
    render: (row) =>
      h(NTag, { type: row.state === 'OPEN' ? 'success' : 'default', size: 'small' }, { default: () => row.state })
  },
  { title: '文章數', key: 'articleCount', width: 90 },
  { title: '媒體數', key: 'sourceCount', width: 90 },
  {
    title: '更新時間',
    key: 'updatedAt',
    width: 160,
    render: (row) => h(NText, { depth: 3 }, { default: () => formatDisplay(row.updatedAt) })
  },
  {
    title: '操作',
    key: 'actions',
    width: 280,
    render: (row) =>
      h(NSpace, { size: 'small' }, {
        default: () => [
          h(NButton, { size: 'small', onClick: () => viewEventDetail(row) }, { default: () => '查看' }),
          h(NButton, { size: 'small', type: 'error', onClick: () => promptDelete(row) }, { default: () => '刪除' }),
          h(NButton, { size: 'small', type: 'warning', onClick: () => promptDissolve(row) }, { default: () => '解散重聚' })
        ]
      })
  }
]

// 文章表格列（事件詳情）
const articleColumns: DataTableColumns<Article> = [
  { type: 'selection' },
  { title: 'ID', key: 'id', width: 80 },
  {
    title: '標題',
    key: 'title',
    ellipsis: { tooltip: true },
    render: (row) => h(NText, null, { default: () => row.title || '(無標題)' })
  },
  {
    title: '來源',
    key: 'sourceName',
    width: 120,
    render: (row) => h(NText, null, { default: () => row.sourceName || '-' })
  },
  {
    title: '發布時間',
    key: 'publishedAt',
    width: 140,
    render: (row) => h(NText, { depth: 3 }, { default: () => formatDisplay(row.publishedAt) })
  }
]

// 批量重聚文章表格列
const batchArticleColumns: DataTableColumns<Article> = [
  { type: 'selection' },
  { title: 'ID', key: 'id', width: 80 },
  {
    title: '標題',
    key: 'title',
    ellipsis: { tooltip: true },
    render: (row) => h(NText, null, { default: () => row.title || '(無標題)' })
  },
  {
    title: '來源',
    key: 'sourceName',
    width: 120
  },
  {
    title: '事件 ID',
    key: 'eventId',
    width: 90,
    render: (row) => h(NText, { depth: row.eventId ? 1 : 3 }, { default: () => row.eventId || '未分配' })
  }
]

// 載入事件列表
async function loadEvents() {
  try {
    loading.value = true
    const page = (pagination.value.page || 1) - 1
    const size = pagination.value.pageSize || 20
    const result = await getEvents(page, size, searchTopic.value || undefined, stateFilter.value || undefined)
    events.value = result.content
    totalEvents.value = result.totalElements
    pagination.value.itemCount = result.totalElements
  } catch (error: any) {
    message.error(error.message || '載入事件列表失敗')
  } finally {
    loading.value = false
  }
}

function handlePageChange(page: number) {
  pagination.value.page = page
  loadEvents()
}

function handlePageSizeChange(pageSize: number) {
  pagination.value.pageSize = pageSize
  pagination.value.page = 1
  loadEvents()
}

function resetFilters() {
  searchTopic.value = ''
  stateFilter.value = null
  pagination.value.page = 1
  loadEvents()
}

// 查看事件詳情
async function viewEventDetail(event: Event) {
  selectedEvent.value = event
  selectedArticleIds.value = []
  showEventDetailModal.value = true

  try {
    loadingArticles.value = true
    eventArticles.value = await getEventArticles(event.eventId)
  } catch (error: any) {
    message.error(error.message || '載入文章列表失敗')
  } finally {
    loadingArticles.value = false
  }
}

// 刪除事件
function promptDelete(event: Event) {
  eventToDelete.value = event
  showDeleteConfirm.value = true
}

async function confirmDelete() {
  if (!eventToDelete.value) return

  try {
    deleting.value = true
    await deleteEvent(eventToDelete.value.eventId)
    message.success('事件已刪除')
    showDeleteConfirm.value = false
    eventToDelete.value = null
    loadEvents()
  } catch (error: any) {
    message.error(error.message || '刪除事件失敗')
  } finally {
    deleting.value = false
  }
}

// 解散事件
function promptDissolve(event: Event) {
  eventToDissolve.value = event
  showDissolveConfirm.value = true
}

async function confirmDissolve() {
  if (!eventToDissolve.value) return

  try {
    dissolving.value = true
    const result = await dissolveEvent(eventToDissolve.value.eventId)
    message.success(`事件已解散，${result.reaggregated} 篇文章已進入重新聚合隊列`)
    showDissolveConfirm.value = false
    eventToDissolve.value = null
    loadEvents()
  } catch (error: any) {
    message.error(error.message || '解散事件失敗')
  } finally {
    dissolving.value = false
  }
}

// 從事件移除文章
async function handleRemoveArticles() {
  if (!selectedEvent.value || selectedArticleIds.value.length === 0) return

  try {
    removingArticles.value = true
    const articleIds = selectedArticleIds.value.map((id) => Number(id))
    const result = await removeArticlesFromEvent(selectedEvent.value.eventId, articleIds)
    message.success(`已從事件移除 ${result.updated} 篇文章`)
    selectedArticleIds.value = []
    // 重新載入文章
    eventArticles.value = await getEventArticles(selectedEvent.value.eventId)
    // 更新事件列表
    loadEvents()
  } catch (error: any) {
    message.error(error.message || '移除文章失敗')
  } finally {
    removingArticles.value = false
  }
}

// 重新計算統計
async function handleRecalculate() {
  if (!selectedEvent.value) return

  try {
    recalculating.value = true
    await recalculateEvent(selectedEvent.value.eventId)
    message.success('已重新計算事件統計')
    loadEvents()
  } catch (error: any) {
    message.error(error.message || '重新計算失敗')
  } finally {
    recalculating.value = false
  }
}

// 重新生成 AI 分析
async function handleRegenerate() {
  if (!selectedEvent.value) return

  try {
    regenerating.value = true
    await regenerateEvent(selectedEvent.value.eventId)
    message.success('已重新生成 AI 分析')
    loadEvents()
  } catch (error: any) {
    message.error(error.message || '重新生成失敗')
  } finally {
    regenerating.value = false
  }
}

// 批量重聚搜尋
async function searchForBatchReaggregate() {
  if (!batchSearchQuery.value.trim()) {
    message.warning('請輸入搜尋關鍵字')
    return
  }

  try {
    batchSearching.value = true
    const result = await searchArticles(batchSearchQuery.value, 0, 50)
    batchSearchResults.value = result.content
    batchSelectedIds.value = []
  } catch (error: any) {
    message.error(error.message || '搜尋文章失敗')
  } finally {
    batchSearching.value = false
  }
}

// 執行批量重聚
async function handleBatchReaggregate() {
  if (batchSelectedIds.value.length === 0) return

  try {
    batchReaggregating.value = true
    const articleIds = batchSelectedIds.value.map((id) => Number(id))
    const result = await batchReaggregateArticles(articleIds)
    message.success(`${result.processed} 篇文章已進入重新聚合隊列`)
    batchSelectedIds.value = []
    showBatchReaggregateModal.value = false
    loadEvents()
  } catch (error: any) {
    message.error(error.message || '批量重聚失敗')
  } finally {
    batchReaggregating.value = false
  }
}

onMounted(() => {
  loadEvents()
})
</script>

<style scoped>
.event-aggregation-container {
  max-width: 1400px;
}
</style>
