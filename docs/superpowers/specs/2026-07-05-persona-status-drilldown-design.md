# Persona Status Drill-Down + 全站 shadcn Table 重構

> 日期：2026-07-05
> 狀態：approved

## 目標

1. 在 `/persona-status` 頁面加入「按題目」和「按用戶」兩個 drill-down 視圖，讓管理者可以直接看到誰回答了哪些人物誌題目及答案
2. 全站 33 個頁面的手寫 HTML `<table>` 全部改用 shadcn Table 元件

## 範圍

### 新增 shadcn 元件

安裝以下 shadcn/ui 元件：

| 元件 | 用途 |
|------|------|
| Table | 取代所有手寫 HTML table |
| Tabs | persona-status 的按題目/按用戶切換 |
| Avatar | 用戶頭像顯示 |
| Skeleton | loading 狀態取代手寫 skeleton row |

已有可直接複用：Sheet (Drawer)、Badge、Button、Dialog、Select、Checkbox

### Persona Status 新功能

在現有統計區塊下方，新增雙 Tab drill-down 區塊。

#### Tab 1 — 按題目查看

- shadcn Table 列出所有題目（Q 編號、prompt、類型 badge、回答人數）
- 點擊某題 → 右側 Sheet 開啟
- Sheet 內用 `GET /persona/questions/:questionId/answers` 顯示所有回答者
- 每筆回答：Avatar + 名稱（UserLink）+ 答案 + 共鳴數 + 時間
- cursor 分頁載入更多

#### Tab 2 — 按用戶查看

- shadcn Table 列出有填答的用戶
- 欄位：Avatar + 名稱 + 人物誌類型 badge (D/A/O/L/C) + 回答題數 + 最後回答時間
- 支援搜尋（名稱）、排序（回答數、最後回答時間）
- 點擊某用戶 → Sheet 開啟
- Sheet 內用 `getUserPersonaProfile` 顯示該用戶所有答案（已答 + 未答折疊）

### 後端新 API

新增 `GET /api/v1/admin/persona/users`

```
Query Parameters:
  search    string   (optional) 按名稱模糊搜尋
  sort      string   (optional) answer_count | last_answered，預設 answer_count
  order     string   (optional) asc | desc，預設 desc
  limit     number   (optional) 預設 20
  offset    number   (optional) 預設 0

Response:
{
  success: true,
  data: [{
    userId: number,
    externalId: string,
    name: string,
    photoUrl: string | null,
    personaType: 'D' | 'A' | 'O' | 'L' | 'C' | null,
    answerCount: number,
    lastAnsweredAt: string | null
  }],
  pagination: {
    total_count: number,
    limit: number,
    offset: number,
    has_next: boolean
  }
}
```

實作位置：
- Route: `src/routes/admin.routes.ts`（掛在 `/api/v1/admin/persona/users`）
- Controller: `src/controllers/admin-persona.controller.ts`
- Service: `src/services/admin/persona-question.service.ts`

SQL 邏輯：從 `persona_answers` JOIN `users` + LEFT JOIN `quiz_results`，GROUP BY user，算 count + max(created_at)。

### 全站 Table 重構

33 個頁面的手寫 HTML table 全部替換為 shadcn Table 元件：

| 原始標籤 | shadcn 元件 |
|----------|-------------|
| `<table>` | `<Table>` |
| `<thead>` | `<TableHeader>` |
| `<tbody>` | `<TableBody>` |
| `<tr>` | `<TableRow>` |
| `<th>` | `<TableHead>` |
| `<td>` | `<TableCell>` |

重構頁面清單：
1. AIAssistantPage
2. AIServiceConfigsPage
3. AnomalyAlertsPage
4. AuditLogPage
5. AutoModPage
6. BadgesPage
7. CertificatesPage
8. CommunityMapPage
9. ContentPerformancePage
10. CustomReportsPage
11. DripContentPage
12. EmailTemplatesPage
13. EventsPage
14. LeaderboardsPage
15. LearningProgressPage
16. MemberDirectoryPage
17. NotificationsPage
18. OnboardingFlowsPage
19. PersonaQuestionsPage
20. PersonaStatusPage
21. PracticesPage
22. QueryLogsPage
23. QuizzesPage
24. RoadmapItemsPage
25. RoadmapReportsPage
26. RolesPermissionsPage
27. ScheduledReportsPage
28. TriggeredEmailsPage
29. TrustLevelsPage
30. UserAnalyticsPage
31. UserDetailPage
32. UserManagementPage
33. UserQuotasPage

## 不做的事

- 不改現有統計區塊（StatCard、bar chart 等）
- 不改路由結構
- 不改 API client 或 auth 邏輯
- 不改非 table 相關的 UI 元件
