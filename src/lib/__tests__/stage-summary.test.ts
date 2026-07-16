import { describe, expect, it } from 'vitest'
import { parseStageSummaries } from '../stage-summary'

describe('parseStageSummaries', () => {
  it('無標籤時回傳原文與空陣列', () => {
    const result = parseStageSummaries('一般回覆內容')
    expect(result.clean).toBe('一般回覆內容')
    expect(result.summaries).toEqual([])
  })

  it('抽出單一 stage_summary 區塊', () => {
    const content = '正文回覆\n\n<stage_summary stage="you_are_here">分數：精力6</stage_summary>'
    const result = parseStageSummaries(content)
    expect(result.clean).toBe('正文回覆')
    expect(result.summaries).toEqual([
      { stage: 'you_are_here', content: '分數：精力6', offset: content.indexOf('<stage_summary') },
    ])
  })

  it('抽出多個區塊並保留順序，offset 各自唯一', () => {
    const content =
      '前段<stage_summary stage="compass">A</stage_summary>中段<stage_summary stage="energy">B</stage_summary>'
    const result = parseStageSummaries(content)
    expect(result.summaries.map((s) => s.stage)).toEqual(['compass', 'energy'])
    expect(result.clean).toBe('前段中段')
    expect(result.summaries[0].offset).not.toBe(result.summaries[1].offset)
  })

  it('支援跨行內容', () => {
    const content = '<stage_summary stage="odyssey">第一行\n第二行\n第三行</stage_summary>'
    const result = parseStageSummaries(content)
    expect(result.clean).toBe('')
    expect(result.summaries[0].content).toBe('第一行\n第二行\n第三行')
  })

  it('不吃掉標籤外的內容', () => {
    const content = 'A <stage_summary stage="s1">X</stage_summary> B'
    const result = parseStageSummaries(content)
    expect(result.clean).toContain('A')
    expect(result.clean).toContain('B')
  })
})
