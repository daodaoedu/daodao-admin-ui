import { readdirSync, readFileSync, statSync, writeFileSync } from 'node:fs'

const replacements = new Map([
  ['heading-lg', 'text-2xl leading-none font-semibold tracking-tight text-foreground'],
  ['heading-sm', 'text-base leading-none font-semibold tracking-tight text-foreground'],
  [
    'admin-page-shell',
    'mx-auto w-full max-w-7xl rounded-2xl border border-[var(--admin-panel-border)] bg-[var(--admin-card)] p-5 shadow-sm backdrop-blur',
  ],
  [
    'admin-kpi-card',
    'rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm',
  ],
  [
    'admin-panel-card',
    'rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm',
  ],
  [
    'admin-card-soft',
    'rounded-lg border border-[var(--admin-panel-border)] bg-card/90 p-4 shadow-sm',
  ],
  [
    'admin-nav-group',
    'rounded-lg border border-[var(--admin-panel-border)] bg-background/70 p-2.5 shadow-sm',
  ],
  [
    'admin-control',
    'rounded-md border border-input bg-card px-3 py-1.5 text-sm text-foreground transition-colors duration-150 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20',
  ],
  [
    'admin-select',
    'rounded-md border border-input bg-card px-3 py-1.5 text-sm text-foreground transition-colors duration-150 h-9 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20',
  ],
  [
    'admin-chip',
    'inline-flex items-center gap-2 rounded-full border border-border bg-card/90 px-3 py-1.5 text-xs font-medium text-muted-foreground',
  ],
  ['admin-popover', 'rounded-md border border-border bg-card/90 py-1 shadow-lg'],
  [
    'admin-segmented',
    'inline-flex rounded-lg border border-[var(--admin-panel-border)] bg-background/65 p-1',
  ],
  [
    'admin-segmented-item',
    'inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors border-transparent bg-transparent shadow-none hover:bg-muted hover:text-foreground',
  ],
  [
    'admin-segmented-item-active',
    'bg-background/70 text-foreground shadow-sm hover:bg-background/70',
  ],
  ['admin-table-shell', 'w-full border-collapse'],
  ['admin-table-head', 'border-b border-border text-left text-sm font-medium text-muted-foreground'],
  ['admin-table-row', 'border-b border-border/80 hover:bg-muted/45 transition-colors'],
  [
    'admin-modal-overlay',
    'fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm',
  ],
  [
    'admin-modal-panel',
    'rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-lg',
  ],
])

function collectSourceFiles(dir) {
  const entries = readdirSync(dir)
  const files = []

  for (const entry of entries) {
    const path = `${dir}/${entry}`
    const stat = statSync(path)
    if (stat.isDirectory()) {
      files.push(...collectSourceFiles(path))
      continue
    }
    if ((path.endsWith('.ts') || path.endsWith('.tsx')) && !path.endsWith('.test.tsx')) {
      files.push(path)
    }
  }

  return files
}

const files = collectSourceFiles('src')

for (const file of files) {
  let text = readFileSync(file, 'utf8')
  const original = text

  const entries = [...replacements.entries()].sort((a, b) => b[0].length - a[0].length)
  for (const [from, to] of entries) {
    text = text.replaceAll(from, to)
  }

  if (text !== original) {
    writeFileSync(file, text)
  }
}
