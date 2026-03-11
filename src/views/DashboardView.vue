<template>
  <div class="dashboard-container">
    <n-h1>Square News 儀表板</n-h1>

    <n-space vertical size="large">
      <!-- Quick Spectrum Search -->
      <n-card title="快速光譜查詢">
        <n-space vertical>
          <n-input-group>
            <n-input
              v-model:value="searchQuery"
              placeholder="輸入關鍵字查詢光譜分佈"
              @keyup.enter="handleSearch"
            />
            <n-button type="primary" :loading="searchLoading" @click="handleSearch">
              搜尋
            </n-button>
          </n-input-group>

          <div v-if="spectrumData">
            <n-h3>{{ spectrumData.topic }}</n-h3>
            <BiasBar
              :left-wing-ratio="spectrumData.leftWingRatio"
              :center-ratio="spectrumData.centerRatio"
              :right-wing-ratio="spectrumData.rightWingRatio"
              :total-articles="spectrumData.totalArticles"
            />
            <div v-if="spectrumData.sourceDetails && spectrumData.sourceDetails.length > 0">
              <n-divider />
              <SourceDistribution :source-details="spectrumData.sourceDetails" />
            </div>
          </div>
        </n-space>
      </n-card>

      <!-- Media Article Counts -->
      <n-card title="媒體文章數量">
        <n-spin :show="mediaCountsLoading">
          <n-empty v-if="!mediaCountsLoading && mediaCounts.length === 0" description="暫無媒體統計資料" />
          <div v-else ref="mediaChartRef" style="width: 100%; height: 500px"></div>
        </n-spin>
      </n-card>

      <!-- Trending Events -->
      <n-card title="熱門事件">
        <n-spin :show="eventsLoading">
          <n-empty v-if="!eventsLoading && events.length === 0" description="暫無熱門事件" />
          <n-grid v-else :cols="1" :x-gap="16" :y-gap="16" :md="2" :lg="3">
            <n-grid-item v-for="event in events" :key="event.eventId">
              <EventCard :event="event" />
            </n-grid-item>
          </n-grid>
        </n-spin>
      </n-card>
    </n-space>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, onUnmounted } from 'vue'
import {
  NH1,
  NH3,
  NCard,
  NSpace,
  NInput,
  NInputGroup,
  NButton,
  NGrid,
  NGridItem,
  NSpin,
  NEmpty,
  NDivider,
  useMessage
} from 'naive-ui'
import * as echarts from 'echarts/core'
import { BarChart } from 'echarts/charts'
import { GridComponent, TooltipComponent } from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { ECharts } from 'echarts/core'
import { getTrendingEvents } from '@/api/events'
import { searchSpectrum } from '@/api/spectrum'
import { getMediaArticleCounts, type MediaArticleCount } from '@/api/sources'
import type { Event, SpectrumDTO } from '@/types'
import EventCard from '@/components/EventCard.vue'
import BiasBar from '@/components/BiasBar.vue'
import SourceDistribution from '@/components/SourceDistribution.vue'

echarts.use([BarChart, GridComponent, TooltipComponent, CanvasRenderer])

const message = useMessage()

// Trending events
const events = ref<Event[]>([])
const eventsLoading = ref(false)

// Spectrum search
const searchQuery = ref('')
const spectrumData = ref<SpectrumDTO | null>(null)
const searchLoading = ref(false)

// Media article counts
const mediaCounts = ref<MediaArticleCount[]>([])
const mediaCountsLoading = ref(false)
const mediaChartRef = ref<HTMLElement>()
let mediaChartInstance: ECharts | null = null

async function loadTrendingEvents() {
  try {
    eventsLoading.value = true
    events.value = await getTrendingEvents(10)
  } catch (error: any) {
    message.error(error.message || '載入熱門事件失敗')
  } finally {
    eventsLoading.value = false
  }
}

async function handleSearch() {
  if (!searchQuery.value.trim()) {
    message.warning('請輸入搜尋關鍵字')
    return
  }

  try {
    searchLoading.value = true
    spectrumData.value = await searchSpectrum(searchQuery.value, 20)
  } catch (error: any) {
    message.error(error.message || '搜尋失敗')
    spectrumData.value = null
  } finally {
    searchLoading.value = false
  }
}

/**
 * 依據偏向分數回傳顏色
 * biasScore < -0.3 偏藍 → 藍色
 * biasScore > 0.3 偏綠 → 綠色
 * 其餘中立 → 灰色
 * null → 預設灰色
 */
function biasColor(score: number | null): string {
  if (score == null) return '#9ca3af'
  if (score < -0.3) return '#3b82f6'
  if (score > 0.3) return '#22c55e'
  return '#9ca3af'
}

async function loadMediaCounts() {
  try {
    mediaCountsLoading.value = true
    mediaCounts.value = await getMediaArticleCounts()
    await nextTick()
    renderMediaChart()
  } catch (error: any) {
    message.error(error.message || '載入媒體統計失敗')
  } finally {
    mediaCountsLoading.value = false
  }
}

function renderMediaChart() {
  if (!mediaChartRef.value || mediaCounts.value.length === 0) return

  mediaChartInstance = echarts.init(mediaChartRef.value)

  // 橫向長條圖：y 軸是媒體名稱，x 軸是文章數量，由下而上遞增
  const sorted = [...mediaCounts.value].sort((a, b) => a.articleCount - b.articleCount)

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: any) => {
        const d = params[0]
        const item = sorted[d.dataIndex]
        const bias = item.biasScore != null ? item.biasScore.toFixed(2) : '未設定'
        return `<b>${item.sourceName}</b><br/>文章數: ${item.articleCount}<br/>偏向分數: ${bias}`
      }
    },
    grid: {
      left: '20px',
      right: '40px',
      bottom: '20px',
      top: '20px',
      containLabel: true
    },
    xAxis: {
      type: 'value',
      name: '文章數',
      nameTextStyle: { color: '#64748b', fontSize: 12 },
      axisLabel: { color: '#64748b' },
      splitLine: { lineStyle: { type: 'dashed', color: '#f1f5f9' } }
    },
    yAxis: {
      type: 'category',
      data: sorted.map((d) => d.sourceName),
      axisLabel: { color: '#1e293b', fontSize: 12, width: 120, overflow: 'truncate' },
      axisLine: { lineStyle: { color: '#e2e8f0' } }
    },
    series: [
      {
        type: 'bar',
        data: sorted.map((d) => ({
          value: d.articleCount,
          itemStyle: {
            color: biasColor(d.biasScore),
            borderRadius: [0, 4, 4, 0]
          }
        })),
        barMaxWidth: 24,
        emphasis: {
          itemStyle: { shadowBlur: 6, shadowColor: 'rgba(0,0,0,0.15)' }
        }
      }
    ]
  }

  mediaChartInstance.setOption(option)
}

function handleResize() {
  mediaChartInstance?.resize()
}

onMounted(() => {
  loadTrendingEvents()
  loadMediaCounts()
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  mediaChartInstance?.dispose()
})
</script>

<style scoped>
.dashboard-container {
  max-width: 1400px;
  margin: 0 auto;
}
</style>
