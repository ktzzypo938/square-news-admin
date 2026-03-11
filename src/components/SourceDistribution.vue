<template>
  <div ref="chartRef" style="width: 100%; height: 400px"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import * as echarts from 'echarts/core'
import { BarChart } from 'echarts/charts'
import {
  GridComponent,
  TooltipComponent,
  TitleComponent,
  LegendComponent
} from 'echarts/components'
import { CanvasRenderer } from 'echarts/renderers'
import type { ECharts } from 'echarts/core'
import type { SpectrumSourceStance } from '@/types'

echarts.use([BarChart, GridComponent, TooltipComponent, TitleComponent, LegendComponent, CanvasRenderer])

interface Props {
  sourceDetails: SpectrumSourceStance[]
}

const props = defineProps<Props>()
const chartRef = ref<HTMLElement>()
let chartInstance: ECharts | null = null

function getColor(score: number): string {
  if (score < -0.3) return '#3b82f6' // 藍色代表偏藍
  if (score > 0.3) return '#22c55e' // 綠色代表偏綠
  return '#9ca3af' // 灰色代表中立
}

function getGradientColor(score: number): any {
  if (score < -0.3) {
    return {
      type: 'linear',
      x: 0,
      y: 0,
      x2: 0,
      y2: 1,
      colorStops: [
        { offset: 0, color: '#60a5fa' },
        { offset: 1, color: '#3b82f6' }
      ]
    }
  }
  if (score > 0.3) {
    return {
      type: 'linear',
      x: 0,
      y: 0,
      x2: 0,
      y2: 1,
      colorStops: [
        { offset: 0, color: '#4ade80' },
        { offset: 1, color: '#22c55e' }
      ]
    }
  }
  return {
    type: 'linear',
    x: 0,
    y: 0,
    x2: 0,
    y2: 1,
    colorStops: [
      { offset: 0, color: '#d1d5db' },
      { offset: 1, color: '#9ca3af' }
    ]
  }
}

function initChart() {
  if (!chartRef.value) return

  chartInstance = echarts.init(chartRef.value)

  const sortedData = [...props.sourceDetails].sort((a, b) => a.averageScore - b.averageScore)

  const option = {
    title: {
      text: '各來源立場分佈（偏藍 ← → 偏綠）',
      subtext: '負分=偏藍立場 | 正分=偏綠立場',
      left: 'center',
      textStyle: {
        fontSize: 18,
        fontWeight: 600,
        color: '#1e293b'
      },
      subtextStyle: {
        fontSize: 13,
        color: '#64748b',
        fontWeight: 400
      }
    },
    tooltip: {
      trigger: 'axis',
      axisPointer: {
        type: 'shadow',
        shadowStyle: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      backgroundColor: 'rgba(255, 255, 255, 0.95)',
      borderColor: '#e2e8f0',
      borderWidth: 1,
      textStyle: {
        color: '#1e293b'
      },
      formatter: (params: any) => {
        const data = params[0]
        const detail = sortedData[data.dataIndex]
        const colorIndicator = `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${getColor(detail.averageScore)};margin-right:8px;"></span>`
        return `
          <div style="padding: 8px;">
            <div style="font-weight: 600; font-size: 14px; margin-bottom: 8px;">${colorIndicator}${detail.sourceName}</div>
            <div style="font-size: 13px; color: #64748b; margin-bottom: 4px;">平均分數: <span style="font-weight: 600; color: ${getColor(detail.averageScore)};">${detail.averageScore.toFixed(2)}</span></div>
            <div style="font-size: 13px; color: #64748b;">文章數: <span style="font-weight: 600; color: #1e293b;">${detail.articleCount}</span></div>
          </div>
        `
      }
    },
    grid: {
      left: '60px',
      right: '20px',
      bottom: '80px',
      top: '60px',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: sortedData.map((d) => d.sourceName),
      axisLabel: {
        rotate: 45,
        interval: 0,
        color: '#64748b',
        fontSize: 12,
        fontWeight: 500
      },
      axisLine: {
        lineStyle: {
          color: '#e2e8f0'
        }
      }
    },
    yAxis: {
      type: 'value',
      name: '立場分數',
      min: -1,
      max: 1,
      nameTextStyle: {
        color: '#64748b',
        fontSize: 13,
        fontWeight: 600
      },
      axisLabel: {
        color: '#64748b',
        fontSize: 12
      },
      axisLine: {
        show: true,
        lineStyle: {
          color: '#e2e8f0'
        }
      },
      splitLine: {
        lineStyle: {
          type: 'dashed',
          color: '#f1f5f9'
        }
      }
    },
    series: [
      {
        name: '立場分數',
        type: 'bar',
        data: sortedData.map((d) => ({
          value: d.averageScore,
          itemStyle: {
            color: getGradientColor(d.averageScore),
            borderRadius: [4, 4, 0, 0],
            shadowBlur: 4,
            shadowColor: 'rgba(0, 0, 0, 0.1)',
            shadowOffsetY: 2
          }
        })),
        barWidth: '50%',
        emphasis: {
          itemStyle: {
            shadowBlur: 8,
            shadowColor: 'rgba(0, 0, 0, 0.2)'
          }
        }
      }
    ]
  }

  chartInstance.setOption(option)
}

onMounted(() => {
  initChart()

  window.addEventListener('resize', () => {
    chartInstance?.resize()
  })
})

watch(
  () => props.sourceDetails,
  () => {
    initChart()
  },
  { deep: true }
)
</script>
