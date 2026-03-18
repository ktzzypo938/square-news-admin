# Square News Admin — 架構概覽

> 本文件供外部顧問快速掌握系統架構，預計閱讀時間 5–10 分鐘。

---

## 1. 系統定位

Square News Admin 是一套**新聞分析後台管理系統**，主要功能包括：
- 媒體煽動指數分析（7 維度評分）
- 新聞事件聚合與管理
- 媒體偏向光譜視覺化（藍／中立／綠）
- 會員管理與後台操作

---

## 2. 技術棧

| 層級 | 技術 |
|------|------|
| 前端框架 | Vue 3 (Composition API) + TypeScript 5.4 |
| 建置工具 | Vite 5.0 |
| UI 元件庫 | Naive UI 2.38 |
| 狀態管理 | Pinia 2.1 |
| 路由 | Vue Router 4.2（含路由守衛） |
| HTTP 客戶端 | Axios 1.6（雙實例，含攔截器） |
| 圖表 | ECharts 5.5 + Vue ECharts |
| 日期處理 | dayjs 1.11 |
| 圖示 | Ionicons 5 (`@vicons/ionicons5`) |

---

## 3. 部署架構

```
使用者瀏覽器
     │
     ▼
Cloudflare Pages (靜態 SPA)
     │  HTTPS
     ▼
Google Cloud Run (asia-east1)  ←── 後端 API
     │
     ▼
Cloud SQL (PostgreSQL)  ←── 主要資料庫
```

- **前端**：`npm run build` → `dist/` → `wrangler pages deploy` 部署至 Cloudflare Pages
- **後端 API**：`https://square-news-632027619686.asia-east1.run.app`
- **開發環境**：`npm run dev`，預設 port 5173

---

## 4. 目錄結構

```
src/
├── api/              # API 服務層（按功能模組拆分）
│   ├── client.ts     # Axios 實例設定、攔截器
│   ├── events.ts     # 事件相關 API
│   ├── articles.ts   # 文章相關 API
│   ├── sources.ts    # 媒體來源 API
│   └── incitement.ts # 煽動指數 API
├── components/       # 可重用 Vue 元件
│   ├── BiasBar.vue               # 政治偏向條
│   ├── IncitementSpectrum.vue    # 煽動光譜散佈圖
│   └── ...
├── views/            # 頁面元件（一頁一檔）
│   ├── DashboardView.vue
│   ├── EventListView.vue
│   ├── ArticleListView.vue
│   └── admin/        # 需驗證的後台頁面
│       ├── AdminLayout.vue
│       ├── MediaSourcesView.vue
│       ├── MembersView.vue
│       └── ...
├── stores/
│   └── auth.ts       # JWT 認證狀態（Pinia）
├── router/
│   └── index.ts      # 路由定義 + 路由守衛
├── types/
│   └── index.ts      # TypeScript 介面定義（~250 行）
└── utils/            # 日期等工具函數
```

---

## 5. 認證流程

```
1. 使用者在 /login 點擊 Google 登入按鈕
2. Google OAuth 2.0 回傳 ID Token
3. 前端 POST /admin/auth/google { idToken }
4. 後端驗證後回傳 { accessToken, email, name, avatarUrl }
5. accessToken (JWT) 存入 localStorage (key: adminAuth)
6. adminApi 的 request interceptor 自動附加 Authorization: Bearer <token>
7. 路由守衛檢查 meta.requiresAuth，未驗證者導向 /login
```

**限制**：僅接受 `@square.news` 網域的 Google 帳號

---

## 6. API 層設計

系統使用**兩個獨立的 Axios 實例**：

| 實例 | 用途 | Timeout | Auth |
|------|------|---------|------|
| `publicApi` | 公開查詢（文章、事件、統計） | 30 秒 | 無 |
| `adminApi` | 後台操作（新增/修改/刪除） | 300 秒 | Bearer JWT |

**主要端點分類：**
```
GET  /articles, /articles/search, /articles/:id
GET  /events, /events/trending, /events/:id
GET  /sources, /stats/media-article-counts
GET  /spectrum/search, /incitement/spectrum

POST /admin/auth/google
POST /admin/events, /admin/events/suggest
POST /admin/events/:id/[dissolve|recalculate|regenerate|publish]
PUT  /admin/media-sources/:id
GET  /admin/users, PATCH /admin/users/:id/status
```

---

## 7. 資料流示意

```
使用者操作
    │
    ▼
Vue 元件 (views/)
    │ 呼叫
    ▼
API 模組 (api/*.ts)
    │ Axios
    ▼
後端 Cloud Run API
    │
    ▼
PostgreSQL (Cloud SQL)
    │
    └─ 非同步分析任務（事件聚合、煽動指數計算）
```

狀態管理僅用於**認證（auth store）**，其餘資料採元件內 `ref/reactive` 管理，不走 Pinia。

---

## 8. 關鍵設計決策

| 決策 | 說明 |
|------|------|
| 純 SPA | 無 SSR，所有路由由前端處理，後端僅提供 API |
| 雙 Axios 實例 | 清楚分離公開與需授權的端點，避免誤用 |
| Pinia 僅管理 Auth | 降低全域狀態複雜度，資料狀態局部化 |
| 路由 Lazy Load | 所有頁面元件均為動態載入，減少初始 bundle 大小 |
| TypeScript Strict | 型別安全保障，`types/index.ts` 集中定義所有介面 |
| Cloudflare Pages | 靜態 CDN 部署，低成本、高可用 |
