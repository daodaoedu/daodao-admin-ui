# Tailwind Utility CSS Refactor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove project-specific component CSS classes from application markup and express those styles as Tailwind utilities while keeping CSS variables/theme tokens.

**Architecture:** Theme values remain in `src/index.css` and `tailwind.config.js`. Reusable component styling moves into component `className` strings or page-level Tailwind utilities. Global CSS keeps only Tailwind base imports, CSS variables, body styling, and unavoidable global element styles.

**Tech Stack:** React 18, TypeScript, Tailwind CSS 3, Radix primitives, Biome.

---

### Task 1: Inventory And Mechanical Replacement

**Files:**
- Create: `scripts/replace-admin-classes.mjs`
- Modify: all `src/**/*.{ts,tsx}` files containing `admin-*` or `heading-*`
- Evidence: `tmp/admin-class-usage.txt`

- [x] Replace each existing component class with its equivalent Tailwind utility string:
  - `heading-lg`: `text-2xl leading-none font-semibold tracking-tight text-foreground`
  - `heading-sm`: `text-base leading-none font-semibold tracking-tight text-foreground`
  - `admin-page-shell`: `mx-auto w-full max-w-7xl rounded-2xl border border-[var(--admin-panel-border)] bg-[var(--admin-card)] p-5 shadow-sm backdrop-blur`
  - `admin-kpi-card`: `rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm`
  - `admin-panel-card`: `rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm`
  - `admin-card-soft`: `rounded-lg border border-[var(--admin-panel-border)] bg-card/90 p-4 shadow-sm`
  - `admin-nav-group`: `rounded-lg border border-[var(--admin-panel-border)] bg-background/70 p-2.5 shadow-sm`
  - `admin-control`: `rounded-md border border-input bg-card px-3 py-1.5 text-sm text-foreground transition-colors duration-150 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20`
  - `admin-select`: `rounded-md border border-input bg-card px-3 py-1.5 text-sm text-foreground transition-colors duration-150 h-9 focus-visible:outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary/20`
  - `admin-chip`: `inline-flex items-center gap-2 rounded-full border border-border bg-card/90 px-3 py-1.5 text-xs font-medium text-muted-foreground`
  - `admin-popover`: `rounded-md border border-border bg-card/90 py-1 shadow-lg`
  - `admin-segmented`: `inline-flex rounded-lg border border-[var(--admin-panel-border)] bg-background/65 p-1`
  - `admin-segmented-item`: `inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors border-transparent bg-transparent shadow-none hover:bg-muted hover:text-foreground`
  - `admin-segmented-item-active`: `bg-background/70 text-foreground shadow-sm hover:bg-background/70`
  - `admin-table-shell`: `w-full border-collapse`
  - `admin-table-head`: `border-b border-border text-left text-sm font-medium text-muted-foreground`
  - `admin-table-row`: `border-b border-border/80 hover:bg-muted/45 transition-colors`
  - `admin-modal-overlay`: `fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm`
  - `admin-modal-panel`: `rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-lg`

### Task 2: Remove Component CSS Layer

**Files:**
- Modify: `src/index.css`

- [x] Delete all `@layer components` rules for project component classes.
- [x] Keep `:root`, `.dark`, global `body`, and non-component global rules.
- [x] Replace range input styling in `PlaygroundPage.tsx` with Tailwind arbitrary pseudo utilities so `admin-range` can be removed.

### Task 3: Verify

**Files:**
- Verify: `src/**/*.{ts,tsx,css}`

- [x] Run `rg -n "admin-control|admin-select|admin-panel-card|admin-table-shell|admin-table-head|admin-table-row|admin-modal-overlay|admin-modal-panel|admin-range|admin-segmented|admin-card-soft|admin-chip|admin-popover|admin-nav-group|admin-page-shell|admin-kpi-card|heading-lg|heading-sm|@layer components|\\.admin-" src`.
- [x] Expected: no CSS component classes remain in class names.
- [x] Run `pnpm run lint`.
- [x] Run `pnpm run build`.
