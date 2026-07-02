const DEFAULT_SURVEY_BASE = 'https://app.daodao.so/survey/r'
const rawSurveyBase = import.meta.env.VITE_SURVEY_PUBLIC_BASE ?? DEFAULT_SURVEY_BASE
const APP_BASE = rawSurveyBase.replace(/\/survey\/r\/?$/, '').replace(/\/$/, '')

export const APP_BASE_URL = APP_BASE || 'https://app.daodao.so'

export const SURVEY_PUBLIC_BASE = `${APP_BASE_URL}/survey/r`

export const getPracticePublicUrl = (practiceId: string) =>
  `${APP_BASE_URL}/practices/${practiceId}`
