/**
 * 解析 LLM 回應中的 <stage_summary stage="...">...</stage_summary> 區塊。
 * 學習生活設計師（life_design_coach）prompt 會在每階段結束時輸出此標籤，
 * UI 需將其從正文抽出摺疊顯示；但送回 API 的 history 必須保留原文。
 */

export interface StageSummary {
  stage: string
  content: string
}

export interface ParsedMessage {
  /** 移除 stage_summary 標籤後的乾淨正文 */
  clean: string
  summaries: StageSummary[]
}

const STAGE_SUMMARY_RE = /<stage_summary\s+stage="([^"]*)"\s*>([\s\S]*?)<\/stage_summary>/g

export function parseStageSummaries(content: string): ParsedMessage {
  const summaries: StageSummary[] = []
  const clean = content
    .replace(STAGE_SUMMARY_RE, (_match, stage: string, body: string) => {
      summaries.push({ stage, content: body.trim() })
      return ''
    })
    .trim()
  return { clean, summaries }
}
