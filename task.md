# Dashboard 指標改善任務清單

> 來源：2026-07 Admin Dashboard 指標審查（產品顧問視角）。
> 核心結論：Dashboard 缺少「學習資源供給端」指標，AI 成本佔據過大版面，
> 且日期選擇器存在誤導性行為。以下任務依優先級排序。

---

## P0 — Bug / 誤導性行為修正

- [ ] **修正「今天」預設顯示 7 天互動資料的問題**
  - 位置：`src/pages/DashboardPage.tsx:289`（`period = preset === '30' ? '30d' : '7d'`）
  - 問題：日期選擇器切到「今天」時，社群互動四張卡實際顯示 7 天資料，卡片無任何提示
  - 做法：後端 `interaction-stats` 支援 `1d`，或在卡片上明確標註實際期間

- [ ] **標註不受日期選擇器影響的卡片**
  - 問題：「內容」區四張卡（onboarding / quiz / persona / engagement hooks）不吃日期參數，
    `useContentPerformance()` 也未傳 `days`，切換日期時只有 AI 區與活躍區會變
  - 做法：短期先在卡片加「全期間」標註；長期讓所有卡吃同一日期範圍

---

## P1 — 指標調整（用現有資料，低成本）

- [ ] **「總用戶」卡改為「DAU/MAU 黏著度」**
  - 總用戶是 vanity metric；黏著度 = `currentDau / currentMau`，資料現成（`ActiveUsersTrendResponse.summary`）

- [ ] **「今日註冊」比較基準改為「vs 過去 7 日均值」**
  - 「vs 昨天」對小流量平台是噪音（週間/週末失真）

- [ ] **社群互動卡主數字改為「有互動的不重複用戶數」**
  - 現況總次數會被少數重度用戶撐起，掩蓋廣度惡化
  - drill-down API 已回傳用戶清單，後端聚合 unique count 即可；總次數降為副標

- [ ] **移除「總 Tokens」卡**
  - 與費用完全共線，純 vanity

- [ ] **「平均費用/次」與兩張 AI 圖表下放到 AI 管理頁**
  - 目標頁：ModelManagementPage / QueryLogsPage
  - 首頁 AI 區壓縮為 2 卡：總費用 + 查詢次數

- [ ] **騰出的圖表位改畫 DAU/WAU 趨勢線**
  - `useActiveUsersTrend` 已抓回 `ActiveUsersTrendPoint[]`（date/dau/wau/mau），目前只用 summary、趨勢資料抓了沒畫

---

## P1 — 新增指標：Retention（後端已有 API，只需 surface）

- [ ] **首頁新增 D1/D7/D30 cohort 留存表**
  - 資料來源：`UserCohortResponse`（day1~day90）、`EngagementStats.retentionByDay`——均已存在
  - 呈現：cohort 熱力圖或簡化為三個數字卡
  - 理由：非營利平台沒有營收指標，留存就是北極星

---

## P2 — 新增指標：內容生態（需要後端聚合）

- [ ] **每週資源創作者數（unique creators/week）**
  - 定義：過去 7 天內有發布/更新學習資源的不重複用戶數，附「其中首次發布者」
  - 資料：Content Performance API 已有每筆內容的 creator 欄位，後端聚合即可
  - 理由：UGC 社群供給端萎縮是平台衰退的先行指標（1% 法則），目前 Dashboard 完全沒有供給指標

- [ ] **每週新發布資源數**
  - 與創作者數並列，構成「內容生態」區的核心兩卡

- [ ] **活化率（註冊後 7 天內完成首次關鍵行動）**
  - 定義：7 天內完成首次打卡或首次加入實踐的新用戶比例，以週 cohort 呈現
  - 資料：`taskCompletedAt` / `engagement.lastActiveAt` 等既有欄位，以註冊週分組
  - 取代現有三個「累積完成率」作為首頁 Activation 主指標

- [ ] **現有完成率指標改為 cohort-based**
  - Onboarding 完成率 / 測驗完成率 / 人物誌解鎖率目前分母為全體歷史用戶，
    早期用戶會把數字凍結，看不出近期改動的效果
  - 改為「近 30 天註冊者」的完成率；人物誌解鎖率可下放至 Onboarding 分析頁

---

## P2 — 佈局重構

- [ ] **依漏斗敘事重排區塊**

  ```
  1. Acquisition   今日/本週註冊（vs 7日均值）＋ 註冊來源分布（landing/quiz/action_maker，資料已有）
  2. Activation    7天活化率（cohort）＋ Onboarding 完成率（近30天 cohort）
  3. Engagement    WAU（主）、DAU/MAU 黏著度、互動用戶數、連結數
  4. Retention     D1/D7/D30 cohort 留存
  5. 內容生態      每週新資源數、每週創作者數、收藏數
  6. 營運（收合）   AI 費用 + 查詢次數 ＋ 系統健康一條
  ```

  - 現「內容」區實為 Activation 指標，需改名歸位
  - WAU 升為活躍主指標（自主學習的自然週期是週，非日）

---

## 待確認（Instrumentation）

- [ ] **確認前台是否有搜尋/收藏埋點**
  - 若有：新增「搜尋次數（含無結果搜尋比例）」與「資源收藏次數」兩指標——
    無結果搜尋直接指出該邀請什麼主題的創作者，是最可行動的營運指標
  - 若無：優先補埋點，不硬湊代理指標

- [ ] **對照真實數據量級，決定百分比變化的呈現方式**
  - 若 DAU 僅兩位數，所有「vs 上期」百分比會劇烈跳動，
    應改用移動平均為基準，或隱藏百分比只看絕對數
