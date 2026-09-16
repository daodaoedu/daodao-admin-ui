// Ported from daodao-server/src/services/email/base-template.ts
// Used for frontend live preview only - not for actual sending

const EMAIL_COLORS = {
  bgOuter: '#F5FFFD',
  bgContent: '#FFFFFF',
  bgFooter: '#F4F6F6',
  textHeading: '#0D3036',
  textPrimary: '#295E5C',
  textSecondary: '#9FB5B8',
  brandCyan: '#16B9B3',
  brandOrange: '#FFA10B',
  ctaText: '#0D3036',
  divider: '#E0E0E0',
} as const

const EMAIL_ASSETS = {
  logo: 'https://assets.daodao.so/images/emails/logo.png',
  banner: 'https://assets.daodao.so/images/emails/banner.png',
  threads: 'https://assets.daodao.so/images/emails/threads.png',
  facebook: 'https://assets.daodao.so/images/emails/facebook.png',
  instagram: 'https://assets.daodao.so/images/emails/instagram.png',
  linkedin: 'https://assets.daodao.so/images/emails/linkedin.png',
} as const

const SOCIAL_LINKS = {
  threads: 'https://www.threads.net/@daodao_learn',
  facebook: 'https://www.facebook.com/daodaoedu/',
  instagram: 'https://www.instagram.com/daodao_learn/',
  linkedin: 'https://www.linkedin.com/company/daodaolearn/',
} as const

export interface PreviewEmailOptions {
  title?: string
  subject?: string
  preheader?: string
  content: string
  variables?: Record<string, string>
}

function substituteVariables(html: string, variables: Record<string, string>): string {
  return html.replace(/\{\{(\w+)\}\}/g, (_, key) => variables[key] ?? `{{${key}}}`)
}

export function renderEmailPreview(options: PreviewEmailOptions): string {
  const { title = '郵件預覽', preheader = '', content, variables = {} } = options

  const processedContent = substituteVariables(content, variables)
  const year = new Date().getFullYear()

  const head = `<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
  <style>
    body, table, td, p, a { -webkit-text-size-adjust: 100%; -ms-text-size-adjust: 100%; }
    table, td { mso-table-lspace: 0pt; mso-table-rspace: 0pt; border-collapse: collapse; }
    img { border: 0; height: auto; line-height: 100%; outline: none; text-decoration: none; }
    body { margin: 0 !important; padding: 0 !important; width: 100% !important; }
    @media screen and (max-width: 599px) {
      .wrapper { width: 100% !important; }
      .main-content { padding: 28px 24px !important; }
    }
  </style>
</head>`

  const preheaderHtml = preheader
    ? `<div style="display:none;max-height:0;overflow:hidden;">${preheader}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>`
    : ''

  const banner = `<div style="background-color:${EMAIL_COLORS.bgOuter};">
  <img src="${EMAIL_ASSETS.banner}" alt="島島阿學" width="600" style="display:block;width:100%;max-width:600px;height:auto;">
</div>`

  const footer = `<div style="background-color:${EMAIL_COLORS.bgFooter};padding:24px 40px;border-top:1px solid ${EMAIL_COLORS.divider};">
    <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
      <tr><td align="center" style="padding-bottom:16px;">
        <img src="${EMAIL_ASSETS.logo}" alt="島島阿學" width="120" style="display:block;width:120px;height:auto;">
      </td></tr>
      <tr><td align="center" style="padding-bottom:16px;">
        <table role="presentation" cellpadding="0" cellspacing="0"><tr>
          <td style="padding:0 8px;"><a href="${SOCIAL_LINKS.threads}"><img src="${EMAIL_ASSETS.threads}" alt="Threads" width="32" height="32" style="display:block;"></a></td>
          <td style="padding:0 8px;"><a href="${SOCIAL_LINKS.facebook}"><img src="${EMAIL_ASSETS.facebook}" alt="Facebook" width="32" height="32" style="display:block;"></a></td>
          <td style="padding:0 8px;"><a href="${SOCIAL_LINKS.instagram}"><img src="${EMAIL_ASSETS.instagram}" alt="Instagram" width="32" height="32" style="display:block;"></a></td>
          <td style="padding:0 8px;"><a href="${SOCIAL_LINKS.linkedin}"><img src="${EMAIL_ASSETS.linkedin}" alt="LinkedIn" width="32" height="32" style="display:block;"></a></td>
        </tr></table>
      </td></tr>
      <tr><td align="center">
        <p style="margin:0;font-size:12px;color:${EMAIL_COLORS.textSecondary};">島島阿學 &copy; ${year}</p>
      </td></tr>
    </table>
  </div>`

  const body = `<body style="margin:0;padding:0;background-color:${EMAIL_COLORS.bgOuter};font-family:'Noto Sans TC','Microsoft JhengHei',Arial,sans-serif;">
  ${preheaderHtml}
  <div style="background-color:${EMAIL_COLORS.bgOuter};padding:20px 0;">
    <div class="wrapper" style="width:600px;max-width:100%;margin:0 auto;background-color:${EMAIL_COLORS.bgContent};">
      ${banner}
      <div class="main-content" style="padding:32px 40px;">
        <div class="email-content">${processedContent}</div>
      </div>
      ${footer}
    </div>
  </div>
</body>
</html>`

  return `${head}${body}`
}

export function detectVariables(html: string): string[] {
  const matches = html.match(/\{\{(\w+)\}\}/g) ?? []
  return [...new Set(matches.map((m) => m.slice(2, -2)))]
}
