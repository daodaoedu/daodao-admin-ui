# 問卷管理功能流程圖

路徑：`/admin/surveys`

---

## 整體使用者流程

```mermaid
flowchart TD
    A([進入 /admin/surveys]) --> B[問卷列表頁]
    B --> B1{篩選 / 搜尋}
    B1 -->|依狀態篩選| B2[重新載入清單]
    B1 -->|關鍵字搜尋| B2
    B2 --> B

    B --> C[點擊「新增問卷」]
    C --> D[開啟新增問卷 Dialog]
    D --> E[填寫基本資訊]
    E --> F[新增題目]
    F --> G{送出}
    G -->|標題空白| H[顯示錯誤：標題為必填]
    G -->|選擇題無選項| I[顯示錯誤：至少需要一個選項]
    G -->|驗證通過| J[建立問卷 API]
    J --> K[刷新列表 / 關閉 Dialog]

    B --> L[問卷卡片操作]
    L --> M[查看詳情]
    L --> N[查看回應]
    L --> O[分析統計]
    L --> P[編輯]
    L --> Q[複製連結]
    L --> R[預覽]
    L --> S[更改狀態]
    L --> T[刪除]
```

---

## 查看詳情流程

```mermaid
flowchart TD
    A[點擊「查看詳情」] --> B[開啟詳情 Dialog]
    B --> C[顯示基本資訊]
    C --> D[顯示題目列表]
    D --> E{每題顯示}
    E --> E1[題目文字]
    E --> E2[題型 + 是否必填]
    E --> E3[選項清單（選擇題才有）]
    B --> F[點擊「關閉」]
    F --> G([返回列表])
```

---

## 查看回應流程

```mermaid
flowchart TD
    A[點擊「查看回應 N 筆」] --> B{response_count > 0?}
    B -->|否| C[按鈕 disabled，無法點擊]
    B -->|是| D[開啟回應列表 Dialog]
    D --> E[顯示回應列表：回應編號、用戶ID/匿名、時間、回答數]
    E --> F{翻頁}
    F -->|共超過 20 筆| G[上一頁 / 下一頁]
    E --> H[點擊「查看內容」]
    H --> I[切換至回應詳細內容面板]
    I --> J[逐題顯示答案]
    J --> K{答案類型}
    K --> K1[文字題 → 顯示文字]
    K --> K2[選擇題 → 顯示勾選選項]
    K --> K3[評分題 → 顯示分數]
    K --> K4[是非題 → 顯示是/否]
    K --> K5[未作答 → 顯示「未作答」]
    I --> L[點擊「← 返回」]
    L --> E
    E --> M[點擊「刪除」回應]
    M --> N[confirm 確認框]
    N -->|取消| E
    N -->|確認| O[刪除回應 API]
    O --> P[刷新回應列表 + 問卷列表]
```

---

## 新增 / 編輯問卷流程

```mermaid
flowchart TD
    A([進入表單]) --> A1{mode}
    A1 -->|create| B[空白表單]
    A1 -->|edit| C[預載現有問卷資料]
    C --> B

    B --> D[填寫基本資訊]
    D --> D1[標題（必填）]
    D --> D2[描述（選填）]
    D --> D3[匿名問卷 checkbox]
    D --> D4[標籤（逗號分隔）]
    D --> D5[最大回應數（選填正整數）]

    B --> E[題目區]
    E --> F[每題操作]
    F --> F1[輸入題目文字]
    F --> F2[選擇題型]
    F2 --> G{題型}
    G -->|單選 / 多選 / 排序| H[顯示選項清單]
    G -->|文字 / 評分 / 是非 / 量表| I[無選項]
    H --> H1[新增選項]
    H --> H2[刪除選項]
    F --> F3[勾選「必填」]
    F --> F4[刪除此題]
    E --> J[新增題目]

    B --> K[點擊「建立問卷 / 儲存變更」]
    K --> L{前端驗證}
    L -->|標題空白| M[顯示錯誤]
    L -->|最大回應數非正整數| M
    L -->|選擇題缺少選項| M
    L -->|通過| N{API 呼叫}
    N -->|create| O[POST /admin/surveys]
    N -->|edit| P[PUT /admin/surveys/:id]
    O --> Q[成功 → 刷新列表 / 關閉 Dialog]
    P --> Q
    O -->|失敗| R[顯示錯誤：建立/更新失敗]
    P --> R
```

---

## 更改狀態流程

```mermaid
flowchart TD
    A[問卷卡片上的狀態 Select] --> B[選擇新狀態]
    B --> C[PATCH /admin/surveys/:id/status]
    C -->|成功| D[刷新列表]
    C -->|失敗| E[alert：更新狀態失敗，請重試]
```

**可用狀態：**

| 狀態 | 說明 |
|------|------|
| `draft` | 草稿，尚未開放 |
| `active` | 進行中，開放填寫 |
| `closed` | 已關閉，不可再填寫 |
| `archived` | 已封存 |

---

## 刪除問卷流程

```mermaid
flowchart TD
    A[點擊「刪除」按鈕] --> B[confirm 確認框]
    B --> B1["確定刪除《標題》？\n此操作無法復原，所有回應也將一併刪除。"]
    B1 -->|取消| C([不做任何動作])
    B1 -->|確認| D[DELETE /admin/surveys/:id]
    D -->|成功| E[刷新列表]
    D -->|失敗| F[alert：刪除問卷失敗，請重試]
```

---

## 複製連結 / 預覽流程

```mermaid
flowchart TD
    A[問卷卡片] --> B{status === active?}
    B -->|否| C[按鈕顯示為 ghost 樣式\nhover 提示：需設為進行中]
    B -->|是| D[可正常使用]

    D --> E[點擊「複製連結」]
    E --> F["複製 VITE_SURVEY_PUBLIC_BASE/:external_id 至剪貼簿"]
    F --> G[按鈕文字變「已複製！」2 秒後恢復]

    D --> H[點擊「預覽」]
    H --> I[window.open 開新分頁]
```

**公開問卷 URL 格式：**

```
{APP_BASE_URL}/survey/r/{external_id}
```

| admin 主機 | APP_BASE_URL |
|------|------------------------|
| `admin-dev.daodao.so` | `https://app-dev.daodao.so` |
| `admin.daodao.so` | `https://app.daodao.so` |

> **重要**：問卷必須設為 `active` 狀態，前端填寫頁才能正常載入。
> `draft` / `closed` / `archived` 狀態的問卷在前端會返回 404。

---

## 分析統計流程

```mermaid
flowchart TD
    A[點擊「分析」按鈕] --> B[開啟分析 Dialog]
    B --> C[GET /admin/surveys/:id/analytics]
    C --> D[顯示頂部三格統計]
    D --> D1[回應數]
    D --> D2[瀏覽數]
    D --> D3[平均填寫時長]
    C --> E[各題統計]
    E --> F{依題型}
    F --> F1[評分/量表 → avg / min / max]
    F --> F2[是非題 → 是/否比例 bar]
    F --> F3[選擇/排序題 → 各選項橫向 bar]
    F --> F4[文字題 → 取樣前 5 筆]
```

---

## Dialog 面板切換狀態機

```mermaid
stateDiagram-v2
    [*] --> 列表頁: 初始
    列表頁 --> 新增問卷: 點擊「新增問卷」
    列表頁 --> 查看詳情: 點擊「查看詳情」
    列表頁 --> 查看回應列表: 點擊「查看回應」
    列表頁 --> 分析統計: 點擊「分析」
    列表頁 --> 編輯問卷: 點擊「編輯」
    查看回應列表 --> 回應詳細內容: 點擊「查看內容」
    回應詳細內容 --> 查看回應列表: 點擊「← 返回」
    新增問卷 --> 列表頁: 關閉 / 建立成功
    查看詳情 --> 列表頁: 關閉
    查看回應列表 --> 列表頁: 關閉
    分析統計 --> 列表頁: 關閉
    編輯問卷 --> 列表頁: 關閉 / 儲存成功
```

---

## 題型說明

| 題型 | 顯示名稱 | 需要選項 | 回答格式 |
|------|----------|----------|----------|
| `single_choice` | 單選 | 是 | `selected_option_ids` (1個) |
| `multiple_choice` | 多選 | 是 | `selected_option_ids` (多個) |
| `ranking` | 排序 | 是 | `selected_option_ids` (排序) |
| `text` | 文字 | 否 | `answer_text` |
| `rating` | 評分 | 否 | `rating_value` (0–10) |
| `scale` | 量表 | 否 | `rating_value` |
| `yesno` | 是非 | 否 | `boolean_value` |

---

## API 對應表

| 操作 | Method | 路徑 |
|------|--------|------|
| 取得列表 | GET | `/api/v1/admin/surveys` |
| 取得詳情 | GET | `/api/v1/admin/surveys/:id` |
| 建立問卷 | POST | `/api/v1/admin/surveys` |
| 編輯問卷 | PUT | `/api/v1/admin/surveys/:id` |
| 更改狀態 | PATCH | `/api/v1/admin/surveys/:id/status` |
| 刪除問卷 | DELETE | `/api/v1/admin/surveys/:id` |
| 取得回應列表 | GET | `/api/v1/admin/surveys/:id/responses` |
| 取得回應詳情 | GET | `/api/v1/admin/surveys/:id/responses/:responseId` |
| 刪除回應 | DELETE | `/api/v1/admin/surveys/:id/responses/:responseId` |
| 取得分析統計 | GET | `/api/v1/admin/surveys/:id/analytics` |

---

## 環境設定

### admin-ui（`APP_BASE_URL`，`src/config.ts`）

前台網址由 `resolveAppBaseUrl()` 依序決定：

1. 已部署主機固定對應：`admin-dev.daodao.so` → `https://app-dev.daodao.so`；`admin.daodao.so` → `https://app.daodao.so`
2. `VITE_SURVEY_PUBLIC_BASE`（本機開發用，可寫 `https://…/survey/r` 或只寫 origin）
3. 本機（localhost／127.0.0.1）沒設定 → `https://app-dev.daodao.so`
4. 其他 → `https://app.daodao.so`

> `VITE_*` 只在 `pnpm build` 時注入。部署用的 Docker image 在 CI build、不帶這個值，`.env.dev`／`.env.prod` 是容器啟動時才掛載，寫在裡面不會影響已打包的前端（#525 admin-dev 連結開到 prod 的原因）。

### daodao-f2e（`NEXT_PUBLIC_API_URL`）

問卷 service (`features/survey/services/survey.ts`) 的 API base URL 為：

```typescript
`${NEXT_PUBLIC_API_URL}/api/v1`
```

| 環境 | NEXT_PUBLIC_API_URL |
|------|---------------------|
| dev  | `https://server-dev.daodao.so` |
| prod | `https://server.daodao.so` |

所有問卷 API 路徑（`/surveys/...`）都會加上 `/api/v1` 前綴後送出。
