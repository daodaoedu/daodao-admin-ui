import { describe, expect, it } from 'vitest'
import type { AdminSurveyDetail, AdminSurveyResponseDetail } from '@/api/types'
import { buildSurveyCsv, escapeSurveyCsvCell } from '../survey-csv'

const questions: AdminSurveyDetail['questions'] = [
  {
    id: 10,
    question_text: '多選,含"引號"',
    question_type: 'multiple_choice',
    is_required: false,
    position: 0,
    options: [
      { id: 101, option_text: '同名', position: 0 },
      { id: 102, option_text: '同名', position: 1 },
    ],
  },
  {
    id: 20,
    question_text: '排序',
    question_type: 'ranking',
    is_required: false,
    position: 1,
    options: [
      { id: 201, option_text: '甲', position: 0 },
      { id: 202, option_text: '乙', position: 1 },
    ],
  },
  {
    id: 30,
    question_text: '文字',
    question_type: 'text',
    is_required: false,
    position: 2,
    options: [],
  },
]
const response: AdminSurveyResponseDetail = {
  id: 1,
  user_id: null,
  completed_at: '2026-11-17T04:05:00Z',
  answers: [
    {
      question_id: 10,
      question_text: '',
      question_type: 'multiple_choice',
      answer_text: null,
      selected_option_ids: [102],
      selected_options: ['同名'],
      rating_value: null,
      boolean_value: null,
    },
    {
      question_id: 20,
      question_text: '',
      question_type: 'ranking',
      answer_text: null,
      selected_option_ids: [202, 201],
      selected_options: ['乙', '甲'],
      rating_value: null,
      boolean_value: null,
    },
    {
      question_id: 30,
      question_text: '',
      question_type: 'text',
      answer_text: '=HYPERLINK("evil")\n中文',
      selected_option_ids: [],
      selected_options: [],
      rating_value: null,
      boolean_value: null,
    },
  ],
}

describe('survey CSV export', () => {
  it('retains distinct option IDs, ordered rankings, date format, BOM and formula-safe text', () => {
    const csv = buildSurveyCsv({ questions }, [response])
    expect(csv.startsWith('\ufeff')).toBe(true)
    expect(csv).toContain('Q10「多選,含""引號""」[multiple_choice][選項101:同名][0/1]')
    expect(csv).toContain('"0","1","[102]","2","1","[202,201]"')
    expect(csv).toContain('"\'=HYPERLINK(""evil"")\n中文"')
    expect(csv).toMatch(/"2026\/11\/17 \d{2}:05"/)
    expect(csv).toContain('\r\n"1","匿名"')
  })
  it('leaves every unanswered checkbox/ranking field blank rather than recording false votes', () => {
    const csv = buildSurveyCsv({ questions }, [{ ...response, answers: [] }])
    expect(csv.split('\r\n')[1]).toMatch(/,"","","","","","",""$/)
  })
  it.each([
    '=SUM(A1)',
    ' +1',
    '\n@cmd',
    '\ttext',
    '\u0000-2',
  ])('neutralizes dangerous spreadsheet input %j', (value) => {
    expect(escapeSurveyCsvCell(value).startsWith('"\'')).toBe(true)
  })
  it('quotes comma, newlines and double quotes without discarding text', () => {
    expect(escapeSurveyCsvCell('a,"b"\nc')).toBe('"a,""b""\nc"')
  })
})

it('preserves negative numeric scale values while protecting negative-looking text', () => {
  expect(escapeSurveyCsvCell(-2)).toBe('"-2"')
  expect(escapeSurveyCsvCell('-2')).toBe('"\'-2"')
})
it('exports managed anonymous response positions and dates without internal IDs or false time precision', () => {
  const csv = buildSurveyCsv({ questions, is_anonymous: true, managed_version: 1 }, [
    { ...response, id: 1906422522 },
  ])
  expect(csv).toContain('\r\n"1","匿名","2026/11/17"')
  expect(csv).not.toContain('1906422522')
  expect(csv).not.toContain(':00')
})
