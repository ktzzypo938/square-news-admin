<template>
  <div class="operations-container">
    <n-space vertical size="large">
      <n-h2>操作面板</n-h2>

      <n-alert type="info" title="API Key">
        請先在登入頁設定 API Key，否則無法呼叫管理 API。
      </n-alert>

      <n-card title="搜尋新聞並產生事件建議">
        <n-space vertical size="medium">
          <n-space>
            <n-input v-model:value="searchQuery" placeholder="輸入關鍵字或句子" clearable style="width: 360px" />
            <n-button type="primary" :loading="searchLoading" @click="searchNews">搜尋</n-button>
            <n-button :disabled="searchLoading" @click="clearSearch">清空</n-button>
          </n-space>

          <n-text depth="3">搜尋後勾選文章，再按「AI 產生建議」</n-text>

          <n-data-table
            :columns="searchColumns"
            :data="searchResults"
            :loading="searchLoading"
            :pagination="false"
            :row-key="rowKey"
            v-model:checked-row-keys="checkedRowKeys"
            :scroll-x="900"
          />

          <n-space justify="space-between">
            <n-text>已選 {{ checkedRowKeys.length }} 篇</n-text>
            <n-space>
              <n-button :disabled="checkedRowKeys.length === 0" @click="applySelectedArticleIds">
                套用到文章 IDs
              </n-button>
              <n-button type="primary" :loading="suggesting" :disabled="checkedRowKeys.length === 0" @click="generateSuggestion">
                AI 產生建議
              </n-button>
            </n-space>
          </n-space>
        </n-space>
      </n-card>

      <n-card title="手動建立事件">
        <n-space vertical size="medium">
          <n-input v-model:value="topic" placeholder="事件主題 (必填)" />

          <!-- New Fields -->
          <n-input v-model:value="locationTag" placeholder="地點標籤 (例如: Syria, Middle East)" />

          <n-select v-model:value="blindspotLabel" :options="blindspotOptions" placeholder="觀點盲區標籤" />

          <n-space vertical>
            <n-text strong>重點摘要 (Key Points)</n-text>
            <div v-for="(_, index) in keyPoints" :key="index" style="display: flex; gap: 8px; margin-bottom: 8px;">
              <n-input v-model:value="keyPoints[index]" placeholder="輸入重點..." />
              <n-button type="error" ghost @click="removeKeyPoint(index)">移除</n-button>
            </div>
            <n-button dashed block @click="addKeyPoint">新增重點</n-button>
          </n-space>

          <n-input
            v-model:value="coreSummary"
            type="textarea"
            placeholder="詳細摘要 / 核心內容 (選填)"
            :autosize="{ minRows: 3, maxRows: 6 }"
          />

          <n-input
            v-model:value="actorsJson"
            type="textarea"
            placeholder='Actors JSON (選填)，例如 {"entities":["A","B"]}'
            :autosize="{ minRows: 3, maxRows: 6 }"
          />

          <n-space>
            <n-input v-model:value="startTime" placeholder="開始時間 (ISO: YYYY-MM-DDTHH:mm:ss)" />
            <n-input v-model:value="endTime" placeholder="結束時間 (ISO: YYYY-MM-DDTHH:mm:ss)" />
            <n-select v-model:value="state" :options="stateOptions" placeholder="事件狀態" />
          </n-space>

          <n-input
            v-model:value="articleIdsText"
            placeholder="文章 IDs (逗號分隔，例如 1,2,3)"
          />

          <n-button type="primary" :loading="submitting" @click="submitCreateEvent">
            建立事件
          </n-button>
        </n-space>
      </n-card>

      <n-card title="建立說明">
        <n-space vertical size="small">
          <n-text>1. 請先在登入頁設定 API Key。</n-text>
          <n-text>2. 事件主題必填，其他欄位可留空。</n-text>
          <n-text>3. Actors JSON 請填合法 JSON，例如 {"entities":["人物A","人物B"]}。</n-text>
          <n-text>4. 時間格式使用 ISO：YYYY-MM-DDTHH:mm:ss（可留空）。</n-text>
          <n-text>5. 文章 IDs 使用逗號分隔，例如 12, 15, 18。</n-text>
          <n-text>6. 建立後會回傳事件 ID，可到事件列表查看。</n-text>
        </n-space>
      </n-card>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, h } from 'vue'
import {
  NH2,
  NSpace,
  NAlert,
  NCard,
  NInput,
  NSelect,
  NButton,
  NDataTable,
  NText,
  useMessage
} from 'naive-ui'
import type { DataTableColumns, DataTableRowKey } from 'naive-ui'
import { createEvent, suggestEventDraft } from '@/api/events'
import { searchArticles } from '@/api/articles'
import type { Article, EventCreateRequest, EventState } from '@/types'
import { formatDisplay } from '@/utils/date'

const message = useMessage()
const submitting = ref(false)
const searchLoading = ref(false)
const suggesting = ref(false)

const topic = ref('')
const coreSummary = ref('')
const actorsJson = ref('')
const startTime = ref('')
const endTime = ref('')
const state = ref<EventState | null>('OPEN')
const articleIdsText = ref('')

// New fields
const locationTag = ref('')
const blindspotLabel = ref<string | null>(null)
const keyPoints = ref<string[]>([])

const searchQuery = ref('')
const searchResults = ref<Article[]>([])
const checkedRowKeys = ref<DataTableRowKey[]>([])

const selectedArticleIds = computed(() =>
  checkedRowKeys.value
    .map((key) => Number(key))
    .filter((value) => !Number.isNaN(value))
)

const stateOptions = [
  { label: '開放', value: 'OPEN' },
  { label: '關閉', value: 'CLOSED' },
  { label: '審核中', value: 'REVIEW' }
]

const blindspotOptions = [
  { label: '平衡 (Balanced)', value: 'BALANCED' },
  { label: '偏綠盲區 (Green Blindspot)', value: 'PRO_US_BLINDSPOT' },
  { label: '偏藍盲區 (Blue Blindspot)', value: 'PRO_CHINA_BLINDSPOT' },
  { label: '左翼盲區 (Left Blindspot)', value: 'LEFT_BLINDSPOT' },
  { label: '右翼盲區 (Right Blindspot)', value: 'RIGHT_BLINDSPOT' }
]

const searchColumns: DataTableColumns<Article> = [
  {
    type: 'selection'
  },
  {
    title: '標題',
    key: 'title',
    width: 360,
    ellipsis: {
      tooltip: true
    },
    render: (row) => {
      return h(NText, null, { default: () => row.title || '(無標題)' })
    }
  },
  {
    title: '來源',
    key: 'sourceName',
    width: 160,
    render: (row) => {
      return h(NText, null, { default: () => row.sourceName || '-' })
    }
  },
  {
    title: '發布時間',
    key: 'publishedAt',
    width: 180,
    render: (row) => {
      return h(NText, { depth: 3 }, { default: () => formatDisplay(row.publishedAt) })
    }
  }
]

function rowKey(row: Article) {
  return row.id
}

function parseArticleIds(value: string): number[] {
  if (!value.trim()) return []
  return value
    .split(/[,\s]+/)
    .map((item) => Number(item.trim()))
    .filter((item) => !Number.isNaN(item))
}

function parseActorsJson(value: string): Record<string, unknown> | null {
  if (!value.trim()) return null
  return JSON.parse(value)
}

function addKeyPoint() {
  keyPoints.value.push('')
}

function removeKeyPoint(index: number) {
  keyPoints.value.splice(index, 1)
}

async function searchNews() {
  try {
    const query = searchQuery.value.trim()
    if (!query) {
      message.warning('請輸入搜尋關鍵字')
      return
    }
    searchLoading.value = true
    const result = await searchArticles(query, 0, 20)
    searchResults.value = result.content
    checkedRowKeys.value = []
  } catch (error: any) {
    message.error(error.message || '搜尋新聞失敗')
  } finally {
    searchLoading.value = false
  }
}

function clearSearch() {
  searchQuery.value = ''
  searchResults.value = []
  checkedRowKeys.value = []
}

function applySelectedArticleIds() {
  if (selectedArticleIds.value.length === 0) {
    message.warning('請先勾選文章')
    return
  }
  articleIdsText.value = selectedArticleIds.value.join(',')
  message.success('已套用文章 IDs')
}

async function generateSuggestion() {
  try {
    if (selectedArticleIds.value.length === 0) {
      message.warning('請先勾選文章')
      return
    }
    suggesting.value = true
    const suggestion = await suggestEventDraft({ articleIds: selectedArticleIds.value })
    topic.value = suggestion.topic || topic.value
    coreSummary.value = suggestion.coreSummary || coreSummary.value
    actorsJson.value = JSON.stringify({ entities: suggestion.actors || [] }, null, 2)
    
    // Fill key points if available
    if (suggestion.keyPoints && Array.isArray(suggestion.keyPoints)) {
      keyPoints.value = [...suggestion.keyPoints]
    }

    articleIdsText.value = selectedArticleIds.value.join(',')
    message.success('已產生事件建議內容')
  } catch (error: any) {
    message.error(error.message || 'AI 產生建議失敗')
  } finally {
    suggesting.value = false
  }
}

async function submitCreateEvent() {
  try {
    if (!topic.value.trim()) {
      message.warning('請輸入事件主題')
      return
    }

    submitting.value = true

    const payload: EventCreateRequest = {
      topic: topic.value.trim(),
      coreSummary: coreSummary.value.trim() || null,
      actors: parseActorsJson(actorsJson.value),
      startTime: startTime.value.trim() || null,
      endTime: endTime.value.trim() || null,
      state: state.value || null,
      articleIds: parseArticleIds(articleIdsText.value),
      // New fields
      locationTag: locationTag.value.trim() || null,
      blindspotLabel: blindspotLabel.value || null,
      keyPoints: keyPoints.value.filter(k => k.trim())
    }

    const created = await createEvent(payload)
    message.success(`事件已建立，ID: ${created.eventId}`)

    topic.value = ''
    coreSummary.value = ''
    actorsJson.value = ''
    startTime.value = ''
    endTime.value = ''
    state.value = 'OPEN'
    articleIdsText.value = ''
    locationTag.value = ''
    blindspotLabel.value = null
    keyPoints.value = []
  } catch (error: any) {
    message.error(error.message || '建立事件失敗')
  } finally {
    submitting.value = false
  }
}
</script>

<style scoped>
.operations-container {
  max-width: 1400px;
}
</style>
