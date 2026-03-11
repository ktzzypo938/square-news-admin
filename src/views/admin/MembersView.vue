<template>
  <div class="members-container">
    <n-space vertical size="large">
      <!-- Header -->
      <n-page-header title="會員管理" subtitle="查看與管理前台註冊會員">
        <template #extra>
          <n-button @click="loadData" :loading="loading">
            <template #icon><n-icon><RefreshOutline /></n-icon></template>
            刷新
          </n-button>
        </template>
      </n-page-header>

      <!-- 統計卡片 -->
      <n-grid :cols="4" :x-gap="16">
        <n-grid-item>
          <n-card size="small">
            <n-statistic label="總會員數" :value="stats.total" />
          </n-card>
        </n-grid-item>
        <n-grid-item>
          <n-card size="small">
            <n-statistic label="啟用中" :value="stats.active">
              <template #suffix>
                <n-text type="success" style="font-size:13px">
                  {{ stats.total ? ((stats.active / stats.total) * 100).toFixed(0) : 0 }}%
                </n-text>
              </template>
            </n-statistic>
          </n-card>
        </n-grid-item>
        <n-grid-item>
          <n-card size="small">
            <n-statistic label="已停用" :value="stats.inactive">
              <template #suffix>
                <n-text type="error" style="font-size:13px" v-if="stats.inactive > 0">
                  停用中
                </n-text>
              </template>
            </n-statistic>
          </n-card>
        </n-grid-item>
        <n-grid-item>
          <n-card size="small">
            <n-statistic label="已完成 Onboarding" :value="stats.onboarded" />
          </n-card>
        </n-grid-item>
      </n-grid>

      <!-- 篩選列 -->
      <n-card size="small">
        <n-space align="center" wrap>
          <n-input
            v-model:value="filters.search"
            placeholder="搜尋姓名或 Email"
            clearable
            style="width: 280px"
            @keyup.enter="handleSearch"
            @clear="handleSearch"
          >
            <template #prefix><n-icon><SearchOutline /></n-icon></template>
          </n-input>
          <n-select
            v-model:value="filters.role"
            :options="roleOptions"
            placeholder="角色"
            clearable
            style="width: 130px"
            @update:value="handleSearch"
          />
          <n-select
            v-model:value="filters.active"
            :options="statusOptions"
            placeholder="狀態"
            clearable
            style="width: 130px"
            @update:value="handleSearch"
          />
          <n-button type="primary" @click="handleSearch">搜尋</n-button>
          <n-button @click="resetFilters">重置</n-button>
        </n-space>
      </n-card>

      <!-- 表格 -->
      <n-card>
        <n-data-table
          :columns="columns"
          :data="users"
          :loading="loading"
          :pagination="pagination"
          :remote="true"
          :row-key="(row: AdminUser) => row.id"
          @update:page="handlePageChange"
          @update:page-size="handlePageSizeChange"
        />
      </n-card>
    </n-space>

    <!-- 詳情 Modal -->
    <n-modal
      v-model:show="showDetail"
      preset="card"
      style="max-width: 560px"
      :title="selectedUser?.displayName || selectedUser?.email || '會員詳情'"
    >
      <template v-if="selectedUser">
        <n-space align="center" style="margin-bottom: 20px">
          <n-avatar
            round
            size="large"
            :src="selectedUser.avatarUrl || undefined"
            :style="{ backgroundColor: '#2563eb', fontSize: '20px' }"
          >
            {{ (selectedUser.displayName || selectedUser.email).substring(0, 1).toUpperCase() }}
          </n-avatar>
          <div>
            <div style="font-size: 18px; font-weight: 600">{{ selectedUser.displayName || '未設定' }}</div>
            <n-text depth="3">{{ selectedUser.email }}</n-text>
          </div>
        </n-space>

        <n-descriptions :column="2" bordered size="small">
          <n-descriptions-item label="ID">{{ selectedUser.id }}</n-descriptions-item>
          <n-descriptions-item label="角色">
            <n-tag :type="selectedUser.role === 'ADMIN' ? 'error' : 'info'" size="small">
              {{ selectedUser.role }}
            </n-tag>
          </n-descriptions-item>
          <n-descriptions-item label="狀態">
            <n-tag :type="selectedUser.active ? 'success' : 'error'" size="small">
              {{ selectedUser.active ? '啟用' : '停用' }}
            </n-tag>
          </n-descriptions-item>
          <n-descriptions-item label="Onboarding">
            <n-tag :type="selectedUser.onboarded ? 'success' : 'default'" size="small">
              {{ selectedUser.onboarded ? '已完成' : '未完成' }}
            </n-tag>
          </n-descriptions-item>
          <n-descriptions-item label="性別">{{ genderLabel(selectedUser.gender) }}</n-descriptions-item>
          <n-descriptions-item label="出生年">{{ selectedUser.birthYear || '未設定' }}</n-descriptions-item>
          <n-descriptions-item label="興趣" :span="2">
            <n-space v-if="selectedUser.interests?.length">
              <n-tag v-for="i in selectedUser.interests" :key="i" size="small">{{ interestLabel(i) }}</n-tag>
            </n-space>
            <n-text v-else depth="3">未設定</n-text>
          </n-descriptions-item>
          <n-descriptions-item label="加入時間" :span="2">
            {{ formatDate(selectedUser.createdAt) }}
          </n-descriptions-item>
          <n-descriptions-item label="最後登入" :span="2">
            {{ selectedUser.lastLoginAt ? formatDate(selectedUser.lastLoginAt) : '從未登入' }}
          </n-descriptions-item>
        </n-descriptions>
      </template>
    </n-modal>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted, h } from 'vue'
import {
  NSpace, NPageHeader, NButton, NIcon, NGrid, NGridItem, NCard, NStatistic, NText,
  NInput, NSelect, NDataTable, NModal, NAvatar, NDescriptions, NDescriptionsItem,
  NTag, NTime, useMessage, type DataTableColumns, type SelectOption, type PaginationProps
} from 'naive-ui'
import { RefreshOutline, SearchOutline } from '@vicons/ionicons5'
import { getUsers, getUserStats, updateUserStatus } from '@/api/members'
import type { AdminUser, AdminUserStats } from '@/types'

const message = useMessage()
const loading = ref(false)
const users = ref<AdminUser[]>([])
const stats = ref<AdminUserStats>({ total: 0, active: 0, inactive: 0, onboarded: 0 })
const showDetail = ref(false)
const selectedUser = ref<AdminUser | null>(null)

const filters = reactive({
  search: '',
  role: null as string | null,
  active: null as string | null
})

const pagination = reactive<PaginationProps>({
  page: 1,
  pageSize: 20,
  itemCount: 0,
  showSizePicker: true,
  pageSizes: [10, 20, 50],
  prefix: ({ itemCount }) => `共 ${itemCount ?? 0} 筆`
})

const roleOptions: SelectOption[] = [
  { label: '一般會員 (USER)', value: 'USER' },
  { label: '管理員 (ADMIN)', value: 'ADMIN' }
]

const statusOptions: SelectOption[] = [
  { label: '啟用中', value: 'true' },
  { label: '已停用', value: 'false' }
]

const columns: DataTableColumns<AdminUser> = [
  {
    title: '會員',
    key: 'user',
    render: (row) => h('div', { style: 'display:flex;align-items:center;gap:10px;cursor:pointer', onClick: () => openDetail(row) }, [
      h(NAvatar, {
        round: true,
        size: 'small',
        src: row.avatarUrl || undefined,
        style: { backgroundColor: '#2563eb', flexShrink: 0 }
      }, { default: () => (row.displayName || row.email).substring(0, 1).toUpperCase() }),
      h('div', {}, [
        h('div', { style: 'font-weight:500;font-size:14px' }, row.displayName || '未設定'),
        h('div', { style: 'color:#94a3b8;font-size:12px' }, row.email)
      ])
    ])
  },
  {
    title: '角色',
    key: 'role',
    width: 110,
    render: (row) => h(NTag, {
      type: row.role === 'ADMIN' ? 'error' : 'info',
      size: 'small'
    }, { default: () => row.role })
  },
  {
    title: '狀態',
    key: 'active',
    width: 90,
    render: (row) => h(NTag, {
      type: row.active ? 'success' : 'error',
      size: 'small'
    }, { default: () => row.active ? '啟用' : '停用' })
  },
  {
    title: 'Onboarding',
    key: 'onboarded',
    width: 110,
    render: (row) => h(NTag, {
      type: row.onboarded ? 'success' : 'default',
      size: 'small'
    }, { default: () => row.onboarded ? '已完成' : '未完成' })
  },
  {
    title: '最後登入',
    key: 'lastLoginAt',
    width: 160,
    render: (row) => row.lastLoginAt
      ? h(NTime, { time: new Date(row.lastLoginAt), type: 'relative' })
      : h(NText, { depth: 3 }, { default: () => '從未登入' })
  },
  {
    title: '加入時間',
    key: 'createdAt',
    width: 160,
    render: (row) => h(NTime, { time: new Date(row.createdAt) })
  },
  {
    title: '操作',
    key: 'actions',
    width: 130,
    render: (row) => h(NSpace, { size: 'small' }, {
      default: () => [
        h(NButton, {
          size: 'small',
          onClick: () => openDetail(row)
        }, { default: () => '詳情' }),
        h(NButton, {
          size: 'small',
          type: row.active ? 'error' : 'success',
          ghost: true,
          onClick: () => toggleStatus(row)
        }, { default: () => row.active ? '停用' : '啟用' })
      ]
    })
  }
]

function openDetail(user: AdminUser) {
  selectedUser.value = user
  showDetail.value = true
}

async function toggleStatus(user: AdminUser) {
  try {
    const updated = await updateUserStatus(user.id, !user.active)
    const idx = users.value.findIndex(u => u.id === user.id)
    if (idx !== -1) users.value[idx] = updated
    message.success(`已${updated.active ? '啟用' : '停用'} ${user.email}`)
    if (selectedUser.value?.id === user.id) selectedUser.value = updated
    await loadStats()
  } catch (e: any) {
    message.error(e.message || '操作失敗')
  }
}

async function loadUsers() {
  loading.value = true
  try {
    const res = await getUsers({
      page: (pagination.page ?? 1) - 1,
      size: pagination.pageSize ?? 20,
      search: filters.search || undefined,
      role: filters.role || undefined,
      active: filters.active != null ? filters.active === 'true' : undefined
    })
    users.value = res.content
    pagination.itemCount = res.totalElements
  } catch (e: any) {
    message.error(e.message || '載入失敗')
  } finally {
    loading.value = false
  }
}

async function loadStats() {
  try {
    stats.value = await getUserStats()
  } catch { /* 統計失敗不影響主功能 */ }
}

async function loadData() {
  await Promise.all([loadUsers(), loadStats()])
}

function handleSearch() {
  pagination.page = 1
  loadUsers()
}

function resetFilters() {
  filters.search = ''
  filters.role = null
  filters.active = null
  handleSearch()
}

function handlePageChange(page: number) {
  pagination.page = page
  loadUsers()
}

function handlePageSizeChange(size: number) {
  pagination.pageSize = size
  pagination.page = 1
  loadUsers()
}

function formatDate(iso: string) {
  return new Date(iso).toLocaleString('zh-TW', {
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit'
  })
}

const INTEREST_LABELS: Record<string, string> = {
  CROSS_STRAIT: '兩岸關係',
  ECONOMY: '經濟財經',
  INTERNATIONAL: '國際情勢',
  US_CHINA_TAIWAN: '美中台關係',
  ENVIRONMENT: '環境生態',
  JUSTICE: '司法人權',
  EDUCATION: '教育文化',
  SOCIAL_ISSUES: '社會議題',
  TECH_INDUSTRY: '科技產業',
  REAL_ESTATE: '房地產',
  LEGISLATURE: '立法院',
  ELECTION: '選舉政治'
}

function interestLabel(key: string) {
  return INTEREST_LABELS[key] ?? key
}

function genderLabel(g: string | null) {
  if (g === 'MALE') return '男'
  if (g === 'FEMALE') return '女'
  return '未設定'
}

onMounted(loadData)
</script>

<style scoped>
.members-container {
  max-width: 1400px;
  margin: 0 auto;
}
</style>
