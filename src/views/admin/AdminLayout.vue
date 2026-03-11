<template>
  <n-layout has-sider class="admin-layout">
    <n-layout-sider
      bordered
      show-trigger
      collapse-mode="width"
      :collapsed-width="64"
      :width="240"
      class="admin-sider"
    >
      <n-menu
        v-model:value="activeKey"
        :collapsed-width="64"
        :options="menuOptions"
        @update:value="handleMenuSelect"
      />
    </n-layout-sider>
    <n-layout-content class="admin-content" :native-scrollbar="false">
      <div class="admin-view-container">
        <router-view />
      </div>
    </n-layout-content>
  </n-layout>
</template>

<script setup lang="ts">
import { computed, h } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { NLayout, NLayoutSider, NLayoutContent, NMenu, NIcon } from 'naive-ui'
import type { MenuOption } from 'naive-ui'
import {
  GitMergeOutline as MergeIcon,
  SettingsOutline as SettingsIcon,
  LayersOutline as LayersIcon,
  AnalyticsOutline as AnalyticsIcon,
  TerminalOutline as TerminalIcon,
  PeopleOutline as PeopleIcon
} from '@vicons/ionicons5'

const router = useRouter()
const route = useRoute()

// 使用 computed 讓 activeKey 隨路由自動更新
const activeKey = computed(() => route.name as string)

function renderIcon(icon: any) {
  return () => h(NIcon, null, { default: () => h(icon) })
}

const menuOptions: MenuOption[] = [
  {
    label: '會員管理',
    key: 'AdminMembers',
    icon: renderIcon(PeopleIcon)
  },
  {
    label: '事件聚合管理',
    key: 'AdminEventAggregation',
    icon: renderIcon(LayersIcon)
  },
  {
    label: '煽動指數管理',
    key: 'AdminIncitementManagement',
    icon: renderIcon(AnalyticsIcon)
  },
  {
    label: '媒體字典管理',
    key: 'AdminMediaSources',
    icon: renderIcon(SettingsIcon)
  },
  {
    label: '實體別名管理',
    key: 'AdminEntityAliases',
    icon: renderIcon(MergeIcon)
  },
  {
    label: '操作面板',
    key: 'AdminOperations',
    icon: renderIcon(TerminalIcon)
  }
]

function handleMenuSelect(key: string) {
  router.push({ name: key })
}
</script>

<style scoped>
.admin-layout {
  min-height: calc(100vh - 72px);
  background-color: transparent;
}

.admin-sider {
  background-color: white;
  box-shadow: 2px 0 8px 0 rgb(29 33 41 / 4%);
}

.admin-content {
  background-color: #f8fafc;
}

.admin-view-container {
  padding: 24px;
}
</style>
