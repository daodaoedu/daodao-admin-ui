import { describe, expect, it } from 'vitest'
import { renderEmailPreview, detectVariables } from '../email-preview'

describe('renderEmailPreview', () => {
  it('produces valid HTML with doctype, charset and title', () => {
    const html = renderEmailPreview({ content: '<p>Hello</p>' })
    expect(html).toContain('<!DOCTYPE html>')
    expect(html).toContain('charset="UTF-8"')
    expect(html).toContain('<title>郵件預覽</title>')
  })

  it('embeds content into the main-content cell', () => {
    const html = renderEmailPreview({ content: '<p>測試內容</p>' })
    expect(html).toContain('<p>測試內容</p>')
  })

  it('substitutes template variables', () => {
    const html = renderEmailPreview({
      content: '<p>Hi {{name}}, your code is {{code}}</p>',
      variables: { name: '小明', code: 'ABC123' },
    })
    expect(html).toContain('Hi 小明')
    expect(html).toContain('ABC123')
    expect(html).not.toContain('{{name}}')
    expect(html).not.toContain('{{code}}')
  })

  it('preserves unmatched variables as-is', () => {
    const html = renderEmailPreview({
      content: '<p>{{known}} and {{unknown}}</p>',
      variables: { known: 'found' },
    })
    expect(html).toContain('found')
    expect(html).toContain('{{unknown}}')
  })

  it('includes preheader when provided', () => {
    const html = renderEmailPreview({ content: '', preheader: '預覽文字' })
    expect(html).toContain('預覽文字')
    expect(html).toContain('display:none')
  })

  it('renders banner and footer with social links', () => {
    const html = renderEmailPreview({ content: '' })
    expect(html).toContain('島島阿學')
    expect(html).toContain('threads.net')
    expect(html).toContain('facebook.com')
    expect(html).toContain('instagram.com')
    expect(html).toContain('linkedin.com')
  })
})

describe('detectVariables', () => {
  it('extracts unique variable names from template', () => {
    const vars = detectVariables('{{a}} and {{b}} and {{a}} again')
    expect(vars).toEqual(['a', 'b'])
  })

  it('returns empty array for no variables', () => {
    expect(detectVariables('no vars here')).toEqual([])
  })
})
