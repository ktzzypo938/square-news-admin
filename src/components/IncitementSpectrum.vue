<template>
  <div class="incitement-spectrum">
    <n-spin :show="loading">
      <div v-if="data">
        <n-space vertical size="large">
          <!-- Chart Container -->
          <div class="chart-wrapper">
            <svg :width="chartWidth" :height="chartHeight" class="spectrum-chart">
              <!-- Background Grid -->
              <g class="grid">
                <!-- Vertical lines -->
                <line
                  v-for="i in 5"
                  :key="`v-${i}`"
                  :x1="margin.left + ((i - 1) * chartInnerWidth) / 4"
                  :y1="margin.top"
                  :x2="margin.left + ((i - 1) * chartInnerWidth) / 4"
                  :y2="chartHeight - margin.bottom"
                  stroke="#e8e8e8"
                  stroke-width="1"
                />
                <!-- Horizontal lines -->
                <line
                  v-for="i in 5"
                  :key="`h-${i}`"
                  :x1="margin.left"
                  :y1="margin.top + ((i - 1) * chartInnerHeight) / 4"
                  :x2="chartWidth - margin.right"
                  :y2="margin.top + ((i - 1) * chartInnerHeight) / 4"
                  stroke="#e8e8e8"
                  stroke-width="1"
                />
              </g>

              <!-- Axes -->
              <g class="axes">
                <!-- X axis -->
                <line
                  :x1="margin.left"
                  :y1="chartHeight - margin.bottom"
                  :x2="chartWidth - margin.right"
                  :y2="chartHeight - margin.bottom"
                  stroke="#333"
                  stroke-width="2"
                />
                <!-- Y axis (center vertical line) -->
                <line
                  :x1="margin.left + chartInnerWidth / 2"
                  :y1="margin.top"
                  :x2="margin.left + chartInnerWidth / 2"
                  :y2="chartHeight - margin.bottom"
                  stroke="#333"
                  stroke-width="2"
                />
              </g>

              <!-- Axis Labels -->
              <g class="labels">
                <!-- X axis labels -->
                <text
                  :x="margin.left"
                  :y="chartHeight - margin.bottom + 30"
                  text-anchor="middle"
                  font-size="12"
                  fill="#666"
                >
                  偏藍
                </text>
                <text
                  :x="margin.left + chartInnerWidth / 2"
                  :y="chartHeight - margin.bottom + 30"
                  text-anchor="middle"
                  font-size="12"
                  fill="#666"
                >
                  中立
                </text>
                <text
                  :x="chartWidth - margin.right"
                  :y="chartHeight - margin.bottom + 30"
                  text-anchor="middle"
                  font-size="12"
                  fill="#666"
                >
                  偏綠
                </text>

                <!-- Y axis labels -->
                <text
                  :x="margin.left - 40"
                  :y="margin.top"
                  text-anchor="middle"
                  font-size="12"
                  fill="#666"
                  dominant-baseline="middle"
                >
                  100
                </text>
                <text
                  :x="margin.left - 40"
                  :y="margin.top + chartInnerHeight / 2"
                  text-anchor="middle"
                  font-size="12"
                  fill="#666"
                  dominant-baseline="middle"
                >
                  50
                </text>
                <text
                  :x="margin.left - 40"
                  :y="chartHeight - margin.bottom"
                  text-anchor="middle"
                  font-size="12"
                  fill="#666"
                  dominant-baseline="middle"
                >
                  0
                </text>

                <!-- Axis titles -->
                <text
                  :x="chartWidth / 2"
                  :y="chartHeight - 5"
                  text-anchor="middle"
                  font-size="14"
                  font-weight="600"
                  fill="#333"
                >
                  立場極性 (Stance Polarity)
                </text>
                <text
                  :x="margin.left - 60"
                  :y="chartHeight / 2"
                  text-anchor="middle"
                  font-size="14"
                  font-weight="600"
                  fill="#333"
                  transform="rotate(-90, 20, 200)"
                >
                  煽動指數 (Incitement Score)
                </text>
              </g>

              <!-- Data Points -->
              <g class="data-points">
                <circle
                  v-for="outlet in data.outlets"
                  :key="outlet.outlet"
                  :cx="getX(outlet.stancePolarity || 0)"
                  :cy="getY(outlet.incitementScore)"
                  :r="getRadius(outlet.articleCount)"
                  :fill="getColor(outlet.stancePolarity || 0)"
                  :opacity="0.7"
                  class="data-point"
                  @mouseenter="handlePointHover(outlet)"
                  @mouseleave="hoveredOutlet = null"
                >
                  <title>{{ outlet.outlet }}</title>
                </circle>
              </g>
            </svg>

            <!-- Tooltip -->
            <div v-if="hoveredOutlet" class="tooltip">
              <h4>{{ hoveredOutlet.outlet }}</h4>
              <p>煽動指數: <strong>{{ hoveredOutlet.incitementScore.toFixed(1) }}</strong></p>
              <p>立場極性: <strong>{{ (hoveredOutlet.stancePolarity || 0).toFixed(2) }}</strong></p>
              <p>文章數量: <strong>{{ hoveredOutlet.articleCount }}</strong></p>
              <p v-if="hoveredOutlet.confidence">
                信心度: <strong>{{ (hoveredOutlet.confidence * 100).toFixed(1) }}%</strong>
              </p>
            </div>
          </div>

          <!-- Legend -->
          <n-card title="圖例" size="small">
            <n-space>
              <div v-for="outlet in data.outlets" :key="outlet.outlet" class="legend-item">
                <span
                  class="color-dot"
                  :style="{ backgroundColor: getColor(outlet.stancePolarity || 0) }"
                />
                <span class="outlet-name">{{ outlet.outlet }}</span>
                <span class="stats">
                  煽動: {{ outlet.incitementScore.toFixed(1) }} |
                  立場: {{ (outlet.stancePolarity || 0).toFixed(2) }} |
                  文章: {{ outlet.articleCount }}
                </span>
              </div>
            </n-space>
          </n-card>
        </n-space>
      </div>

      <n-empty v-else description="暫無數據" />
    </n-spin>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { NSpin, NSpace, NCard, NEmpty, useMessage } from 'naive-ui'
import { getEventIncitement } from '@/api/incitement'
import type { EventIncitementData, OutletIncitement } from '@/api/incitement'

interface Props {
  eventId: number
  includeEvidence?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  includeEvidence: false
})

const message = useMessage()
const data = ref<EventIncitementData | null>(null)
const loading = ref(false)
const hoveredOutlet = ref<OutletIncitement | null>(null)

// Chart dimensions
const chartWidth = 800
const chartHeight = 500
const margin = { top: 30, right: 30, bottom: 60, left: 80 }
const chartInnerWidth = chartWidth - margin.left - margin.right
const chartInnerHeight = chartHeight - margin.top - margin.bottom

// Computed values for scaling
function getX(stancePolarity: number): number {
  // stancePolarity: -1 到 +1
  // Map to pixel position
  return margin.left + ((stancePolarity + 1) / 2) * chartInnerWidth
}

function getY(incitementScore: number): number {
  // incitementScore: 0 到 100
  // Map to pixel position (inverted because SVG Y increases downward)
  return chartHeight - margin.bottom - (incitementScore / 100) * chartInnerHeight
}

function getRadius(articleCount: number): number {
  // Scale radius based on article count
  const minRadius = 6
  const maxRadius = 20
  const maxArticles = Math.max(...(data.value?.outlets.map((o) => o.articleCount) || [1]))
  return minRadius + ((articleCount / maxArticles) * (maxRadius - minRadius))
}

function getColor(stancePolarity: number): string {
  if (stancePolarity < -0.3) return '#3b82f6' // 藍色（偏藍）
  if (stancePolarity > 0.3) return '#22c55e' // 綠色（偏綠）
  return '#9ca3af' // 灰色（中立）
}

function handlePointHover(outlet: OutletIncitement) {
  hoveredOutlet.value = outlet
}

async function loadData() {
  try {
    loading.value = true
    data.value = await getEventIncitement(props.eventId, props.includeEvidence)
  } catch (error: any) {
    message.error(error.message || '載入煽動指數數據失敗')
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped>
.incitement-spectrum {
  width: 100%;
}

.chart-wrapper {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
}

.spectrum-chart {
  border: 1px solid #e8e8e8;
  border-radius: 4px;
  background-color: #fafafa;
}

.data-point {
  cursor: pointer;
  transition: all 0.2s ease;
}

.data-point:hover {
  opacity: 1 !important;
  stroke: #333;
  stroke-width: 2;
}

.tooltip {
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: white;
  border: 1px solid #d9d9d9;
  border-radius: 4px;
  padding: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  z-index: 10;
}

.tooltip h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
}

.tooltip p {
  margin: 4px 0;
  font-size: 12px;
  color: #666;
}

.tooltip strong {
  color: #333;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
  font-size: 12px;
}

.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  display: inline-block;
}

.outlet-name {
  font-weight: 600;
  min-width: 80px;
}

.stats {
  color: #666;
  font-size: 11px;
}
</style>
