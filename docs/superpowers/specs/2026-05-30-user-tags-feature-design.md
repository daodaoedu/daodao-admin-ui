# User Tags Feature — Design Spec

Date: 2026-05-30

## Goal

Complete the `/admin/user-tags` page so it is fully usable: create/edit tags, create tag rules, toggle rule enabled status.

## Scope

| Feature | Frontend | Backend |
|---------|----------|---------|
| 新增標籤 | TagDialog (create mode) | POST /admin/tags (已有) |
| 編輯標籤 | TagDialog (edit mode) | PUT /admin/tags/:id (已有) |
| 新增規則 | TagRuleDialog | POST /admin/tag-rules (已有) |
| Toggle 規則 | 呼叫 PATCH API | PATCH /admin/tag-rules/:id (新增) |
| 刪除標籤/規則 | 已有 | 已有 |

## Backend Changes (daodao-server)

### PATCH /admin/tag-rules/:id

**Route:** `admin.routes.ts` — `PATCH /tag-rules/:id`, 需要 `authenticateAny + requireAdmin`

**Validator (`admin-tags.validator.ts`):**
```ts
const updateTagRuleSchema = z.object({
  conditionType: z.string().min(1).optional(),
  conditionOperator: z.string().min(1).optional(),
  conditionValue: z.string().optional(),
  logicOperator: z.enum(['AND', 'OR']).optional(),
  isEnabled: z.boolean().optional(),
})
const ruleIdParamSchema = z.object({ id: z.coerce.number() }) // 已有
```

**Service (`admin-tags.service.ts`) — `updateTagRule(id, input)`:**
- 動態 SET，只更新有傳入的欄位，參考現有 `updateTag()` 寫法
- 每個欄位獨立 `$executeRaw`，最後 `$queryRaw` 取回最新資料回傳

**Controller (`admin-tags.controller.ts`) — `updateTagRule`:**
- 解析 `ruleIdParamSchema` + `updateTagRuleSchema`
- 呼叫 service，回傳 `createSuccessResponse(rule)`

## Frontend Changes (admin-ui)

### API (`src/api/admin-users.ts`)

新增：
```ts
export const patchTagRule = (id: number, data: Partial<Pick<TagRule, 'conditionType' | 'conditionOperator' | 'conditionValue' | 'logicOperator' | 'isEnabled'>>) =>
  apiClient.patch<ApiResponse<TagRule>>(`/daodao-server/api/v1/admin/tag-rules/${id}`, data)
```

### `TagDialog` Component (`src/components/TagDialog.tsx`)

Props:
```ts
interface Props {
  open: boolean
  onClose: () => void
  tag?: TagItem  // undefined = create mode
}
```

Fields:
- `name`: text input (required)
- `color`: 8 色塊預設 (`#6366f1` indigo, `#8b5cf6` violet, `#f43f5e` rose, `#f97316` orange, `#f59e0b` amber, `#14b8a6` teal, `#0ea5e9` sky, `#10b981` emerald) + hex 輸入
- Submit: POST `/admin/tags` (create) or PUT `/admin/tags/:id` (edit)
- On success: invalidate `['admin', 'tags']`，close dialog

### `TagRuleDialog` Component (`src/components/TagRuleDialog.tsx`)

Props:
```ts
interface Props {
  open: boolean
  onClose: () => void
  tags: TagItem[]
}
```

Fields:
- `tagId`: select (從 tags prop 渲染選項)
- `conditionType`: combo — datalist 預設選項 `days_since_login`, `practice_count`, `connection_count`, `role_level` + 自由輸入
- `conditionOperator`: select (`gt`, `gte`, `lt`, `lte`, `eq`)
- `conditionValue`: text input
- `logicOperator`: select (`AND`, `OR`)
- `isEnabled`: toggle，預設 true
- Submit: POST `/admin/tag-rules`
- On success: invalidate `['admin', 'tag-rules']`，close dialog

### `UserTagsPage` Updates

- **新增標籤按鈕**：開啟 `TagDialog`（create mode）
- **編輯按鈕**：開啟 `TagDialog`（edit mode，傳入該 tag）
- **自動規則區塊**：
  - 加「新增規則」按鈕，開啟 `TagRuleDialog`
  - Toggle 開關：呼叫 `patchTagRule(id, { isEnabled: !rule.isEnabled })`，invalidate query（不再使用 localToggles）

## Error Handling

- API 失敗：dialog 內顯示 error message，不關閉
- Toggle 失敗：toast 或 console error，樂觀更新回滾（query invalidate 自動處理）

## Out of Scope

- 編輯規則（conditionType/value 等）—— 新增後如需修改，先刪再建
- 刪除後確認 UI（目前用 `confirm()`，維持不變）
- Tag rule 自動執行邏輯（後端 worker，不在此次範圍）
