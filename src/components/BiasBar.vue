<template>
  <div class="bias-bar-container">
    <div v-if="totalArticles === 0" class="empty-state">
      <n-text depth="3">數據不足 / 計算中</n-text>
    </div>
    <div v-else>
      <div class="bias-bar">
        <div
          class="bar-segment pro-china"
          :style="{ width: `${(leftWingRatio || 0) * 100}%` }"
          @mouseenter="showTooltip('china')"
          @mouseleave="hideTooltip"
        >
          <span v-if="(leftWingRatio || 0) > 0.1" class="segment-label">
            偏藍 {{ ((leftWingRatio || 0) * 100).toFixed(1) }}%
          </span>
        </div>
        <div
          class="bar-segment neutral"
          :style="{ width: `${(centerRatio || 0) * 100}%` }"
          @mouseenter="showTooltip('neutral')"
          @mouseleave="hideTooltip"
        >
          <span v-if="(centerRatio || 0) > 0.1" class="segment-label">
            中立 {{ ((centerRatio || 0) * 100).toFixed(1) }}%
          </span>
        </div>
        <div
          class="bar-segment pro-us"
          :style="{ width: `${(rightWingRatio || 0) * 100}%` }"
          @mouseenter="showTooltip('us')"
          @mouseleave="hideTooltip"
        >
          <span v-if="(rightWingRatio || 0) > 0.1" class="segment-label">
            偏綠 {{ ((rightWingRatio || 0) * 100).toFixed(1) }}%
          </span>
        </div>
      </div>
      <div class="legend-bar">
        <div class="legend-item">
          <span class="legend-dot pro-china-dot"></span>
          <span class="legend-text">偏藍立場（負分）</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot neutral-dot"></span>
          <span class="legend-text">中立立場（±0.3內）</span>
        </div>
        <div class="legend-item">
          <span class="legend-dot pro-us-dot"></span>
          <span class="legend-text">偏綠立場（正分）</span>
        </div>
      </div>
    </div>
    <div v-if="totalArticles > 0" class="bar-info">
      <n-text depth="3">總文章數: {{ totalArticles }}</n-text>
      <n-text v-if="statsArticles !== undefined && statsArticles !== null" depth="3">
        (統計採用事實報導: {{ statsArticles }})
      </n-text>
    </div>
  </div>
</template>

<script setup lang="ts">
import { NText } from 'naive-ui'

interface Props {
  leftWingRatio?: number | null
  centerRatio?: number | null
  rightWingRatio?: number | null
  totalArticles: number
  statsArticles?: number | null
}

withDefaults(defineProps<Props>(), {
  leftWingRatio: 0,
  centerRatio: 0,
  rightWingRatio: 0,
  totalArticles: 0,
  statsArticles: null
})

function showTooltip(segment: string) {
  // Future: Could show detailed tooltip with source information
  console.log('Hovering over:', segment)
}

function hideTooltip() {
  // Future: Hide tooltip
}
</script>

<style scoped>
.bias-bar-container {
  width: 100%;
}

.empty-state {
  padding: 32px;
  text-align: center;
  background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
  border-radius: 12px;
  border: 2px dashed #cbd5e1;
}

.bias-bar {
  display: flex;
  width: 100%;
  height: 56px;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  position: relative;
}

.bias-bar::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 12px;
  padding: 2px;
  background: linear-gradient(90deg, #3b82f6, #9ca3af, #22c55e);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0.5;
}

.bar-segment {
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: pointer;
  position: relative;
}

.bar-segment:hover {
  filter: brightness(1.15);
  transform: scaleY(1.05);
}

.bar-segment::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(255, 255, 255, 0.2) 0%, rgba(0, 0, 0, 0.1) 100%);
}

.pro-china {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.neutral {
  background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
}

.pro-us {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
}

/* 圖例樣式 */
.legend-bar {
  display: flex;
  justify-content: center;
  gap: 24px;
  margin-top: 16px;
  padding: 12px;
  background: #f8fafc;
  border-radius: 8px;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  gap: 8px;
}

.legend-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  flex-shrink: 0;
}

.pro-china-dot {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.neutral-dot {
  background: linear-gradient(135deg, #9ca3af 0%, #6b7280 100%);
}

.pro-us-dot {
  background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
}

.legend-text {
  font-size: 13px;
  color: #64748b;
  font-weight: 500;
}

.segment-label {
  color: white;
  font-size: 13px;
  font-weight: 600;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  z-index: 1;
  position: relative;
}

.bar-info {
  margin-top: 12px;
  text-align: center;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
}

.bar-info::before {
  content: '📊';
  font-size: 16px;
}
</style>
