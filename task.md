# Dashboard 指標改善任務清單

> 來源：2026-07 Admin Dashboard 指標審查（產品顧問視角）。
> 核心結論：Dashboard 缺少「學習資源供給端」指標，AI 成本佔據過大版面，
> 且日期選擇器存在誤導性行為。以下任務依優先級排序。

---

## P0 — Bug / 誤導性行為修正

- [x] **修正「今天」預設顯示 7 天互動資料的問題**
  - 位置：`src/pages/DashboardPage.tsx`
  - 做法：後端 `interaction-stats` 不支援 `1d`，改為在卡片上加 `periodLabel="近 7 天"` 標註實際期間
  - 實作：`StatCard` 新增 `periodLabel` prop，互動卡在 `preset === '1'` 時顯示「近 7 天」

- [x] **標註不受日期選擇器影響的卡片**
  - 做法：Activation 區四張卡（onboarding / quiz / persona / engagement）加 `periodLabel="全期間"`
  - 實作：`StatCard` 的 `periodLabel` 以 badge 形式顯示在標題旁

---

## P1 — 指標調整（用現有資料，低成本）

- [x] **「總用戶」卡改為「DAU/MAU 黏著度」**
  - 計算：`currentDau / currentMau * 100`，資料來自 `ActiveUsersTrendResponse.summary`

- [x] **「今日註冊」比較基準改為「vs 過去 7 日均值」**
  - 修改 `useTodayRegistrations` hook，查詢近 7 天註冊總數除以 7 作為基準

- [ ] **社群互動卡主數字改為「有互動的不重複用戶數」**
  - **需要後端**：`CommunityInteractionPeriodStats` 需新增 `uniqueUsers` 欄位
  - 前端已備好 `periodLabel` 基礎設施，待後端回傳後替換主數字

- [x] **移除「總 Tokens」卡**
  - 已從 Dashboard 移除

- [x] **「平均費用/次」與兩張 AI 圖表下放**
  - 已從 Dashboard 移除（目標頁：ModelManagementPage / QueryLogsPage，待後續整合）
  - 首頁 AI 區壓縮為 2 卡：AI 總費用 + AI 查詢次數

- [x] **騰出的圖表位改畫 DAU/WAU 趨勢線**
  - `useActiveUsersTrend` 已回傳 `ActiveUsersTrendPoint[]`，新增「活躍用戶趨勢」LineChart
  - 同時顯示 DAU（實線）、WAU（實線）、MAU（虛線）

---

## P1 — 新增指標：Retention（後端已有 API，只需 surface）

- [x] **首頁新增 cohort 留存表**
  - 資料來源：`useUserCohortRetention()` → `UserCohortResponse`（day1~day90）
  - 呈現：色彩編碼表格，高留存綠色、低留存紅色
  - 顯示 D1/D7/D14/D30/D60/D90 六個時間點

---

## P1 — 佈局重構

- [x] **依漏斗敘事重排區塊**

  ```
  1. Acquisition   今日註冊（vs 7日均值）
  2. Engagement    WAU（主）、DAU、MAU、DAU/MAU 黏著度
  3. 社群互動      迴響、留言、追蹤、連結
  4. Activation    Onboarding 完成率、測驗完成率、人物誌解鎖率、平均主題實踐數（全期間標註）
  5. 趨勢圖        DAU/WAU/MAU 趨勢線
  6. Retention     Cohort 留存表
  7. 營運          AI 費用 + 查詢次數
  8. 系統健康      一條 bar
  ```

  - WAU 升為活躍主指標（第一張卡）
  - 「內容」區改名「Activation」並標註「全期間」
  - 「AI 使用」區改名「營運」並壓縮為 2 卡

---

## P2 — 需要後端支援的指標（未實作）

- [ ] **每週資源創作者數（unique creators/week）**
  - 需要後端新增聚合 endpoint
  - 定義：過去 7 天內有發布/更新學習資源的不重複用戶數，附「其中首次發布者」

- [ ] **每週新發布資源數**
  - 需要後端新增聚合 endpoint

- [ ] **活化率（註冊後 7 天內完成首次關鍵行動）**
  - 需要後端以 cohort 方式聚合
  - 定義：7 天內完成首次打卡或首次加入實踐的新用戶比例

- [ ] **現有完成率指標改為 cohort-based**
  - 需要後端支援以「近 30 天註冊者」為分母的完成率計算

- [ ] **搜尋次數與收藏次數**
  - 需要確認前台是否有搜尋/收藏埋點
  - 若有，需後端新增聚合 endpoint

---

## 待確認

- [ ] **對照真實數據量級，決定百分比變化的呈現方式**
  - 若 DAU 僅兩位數，所有「vs 上期」百分比會劇烈跳動，
    應改用移動平均為基準，或隱藏百分比只看絕對數

- [ ] **AI 圖表與平均費用/次整合到 AI 管理頁**
  - 已從首頁移除，待確認是否需要加到 QueryLogsPage / ModelManagementPage
