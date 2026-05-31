import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'

const root = '/Users/xiaoxu/Projects/daodao-admin-ui'
const serverRoot = '/Users/xiaoxu/Projects/daodao/daodao-server'
const aiRoot = '/Users/xiaoxu/Projects/daodao/daodao-ai-backend'

function walk(dir, predicate, acc = []) {
  for (const name of readdirSync(dir)) {
    if (['node_modules', 'dist', '.git', 'coverage', '__pycache__'].includes(name)) continue
    const path = join(dir, name)
    const stat = statSync(path)
    if (stat.isDirectory()) walk(path, predicate, acc)
    else if (predicate(path)) acc.push(path)
  }
  return acc
}

function extractFrontendEndpoints() {
  const files = walk(join(root, 'src/api'), (path) => path.endsWith('.ts'))
  const endpoints = []
  for (const file of files) {
    const text = readFileSync(file, 'utf8')
    const matches = text.matchAll(/(?:apiClient|slowApiClient)\.(?:get|post|put|patch|delete)\s*<[^>]*(?:>+)?\s*\(\s*([`'"])([\s\S]*?)\1/g)
    for (const match of matches) {
      const raw = match[2]
      if (!raw.includes('/api/')) continue
      endpoints.push({
        file: file.replace(`${root}/`, ''),
        endpoint: raw.replace(/\$\{[^}]+\}/g, '{param}'),
      })
    }
  }
  return endpoints
}

function extractDaodaoServerRoutes() {
  const files = walk(join(serverRoot, 'src/routes'), (path) => path.endsWith('.ts'))
  const routes = new Set()
  const routerPrefixes = new Map([
    ['admin.routes.ts', '/api/v1/admin'],
    ['email.routes.ts', '/api/v1/email'],
    ['practice.routes.ts', '/api/v1/practices'],
    ['roadmap.routes.ts', '/api/v1/roadmap'],
    ['wish.routes.ts', '/api/v1/wishes'],
    ['auth.routes.ts', '/api/v1/auth'],
    ['me.routes.ts', '/api/v1/me'],
  ])
  for (const file of files) {
    const text = readFileSync(file, 'utf8')
    for (const match of text.matchAll(/path:\s*['"`]([^'"`]+)['"`]/g)) {
      if (match[1].startsWith('/api/')) routes.add(match[1])
    }
    const base = routerPrefixes.get(file.split('/').at(-1))
    if (base) {
      for (const match of text.matchAll(/router\.(?:get|post|put|patch|delete)\(\s*['"`]([^'"`]+)['"`]/g)) {
        const route = match[1] === '/' ? '' : match[1]
        routes.add(`${base}${route}`.replaceAll('//', '/'))
      }
    }
  }
  return [...routes]
}

function extractAiBackendRoutes() {
  const files = walk(join(aiRoot, 'src/routers'), (path) => path.endsWith('.py'))
  const routes = new Set(['/api/v1/health', '/api/v1/ping'])
  for (const file of files) {
    const text = readFileSync(file, 'utf8')
    const rel = file.replace(`${aiRoot}/src/routers/`, '')
    const prefix = rel.startsWith('admin/') ? '/api/v1/admin' : `/api/v1/${rel.split('.')[0]}`
    for (const match of text.matchAll(/@router\.(?:get|post|put|patch|delete)\(["']([^"']+)["']/g)) {
      const route = match[1] === '/' ? '' : match[1]
      routes.add(`${prefix}${route}`.replaceAll('//', '/'))
    }
  }
  return [...routes]
}

function toRegex(route) {
  const normalized = route
    .replace(/^\/daodao-server/, '')
    .replace(/\{[^/}]+\}/g, '{param}')
    .replace(/:[^/]+/g, '{param}')
  const escaped = normalized.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  return new RegExp(`^${escaped.replaceAll('\\{param\\}', '[^/]+')}$`)
}

function matches(route, candidates) {
  return candidates.some((candidate) => toRegex(candidate).test(route))
}

const frontend = extractFrontendEndpoints()
const serverRoutes = extractDaodaoServerRoutes()
const aiRoutes = extractAiBackendRoutes()

const findings = []
for (const item of frontend) {
  const normalized = item.endpoint.replace(/^\/daodao-server/, '')
  const hasServer = matches(normalized, serverRoutes)
  const hasAi = matches(normalized, aiRoutes)
  const target = item.endpoint.startsWith('/daodao-server') ? 'daodao-server' : 'api-proxy'

  if (target === 'daodao-server' && !hasServer) {
    findings.push({ severity: 'high', type: 'daodao-server route not found', ...item })
  } else if (target === 'api-proxy' && hasServer && !hasAi) {
    findings.push({ severity: 'high', type: 'probably missing /daodao-server prefix', ...item })
  } else if (target === 'api-proxy' && !hasServer && !hasAi) {
    findings.push({ severity: 'medium', type: 'route not found in either backend', ...item })
  }
}

console.log(JSON.stringify({ counts: { frontend: frontend.length, serverRoutes: serverRoutes.length, aiRoutes: aiRoutes.length }, findings }, null, 2))
