import { BookOpen, Eye, Star, Timer } from 'lucide-react'
import { useState } from 'react'
import { ExportButton } from '@/components/ExportButton'
import { StatCard } from '@/components/StatCard'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

type ContentRow = {
  id: number
  title: string
  views: number
  depth: number
  avgTime: number
  interactionRate: number
  featured: boolean
}

type CollectionRow = {
  name: string
  count: number
}

type SortField = 'views' | 'depth' | 'avgTime' | 'interactionRate'

export function ContentPerformancePage() {
  const [sortBy, setSortBy] = useState<SortField>('views')
  const [content, setContent] = useState<ContentRow[]>([])
  const [collections] = useState<CollectionRow[]>([])

  const averageDepth = content.length
    ? Math.round(content.reduce((sum, item) => sum + item.depth, 0) / content.length)
    : 0
  const averageTime = content.length
    ? (content.reduce((sum, item) => sum + item.avgTime, 0) / content.length).toFixed(1)
    : '0'
  const zeroInteractionCount = content.filter((item) => item.interactionRate === 0).length

  const sorted = [...content].sort((a, b) => {
    if (sortBy === 'avgTime') return b.avgTime - a.avgTime
    if (sortBy === 'interactionRate') return b.interactionRate - a.interactionRate
    return (b[sortBy] as number) - (a[sortBy] as number)
  })

  const exportColumns = [
    { key: 'title', header: '標題' },
    { key: 'views', header: '瀏覽數' },
    { key: 'depth', header: '閱讀深度%' },
    { key: 'avgTime', header: '平均停留' },
    { key: 'interactionRate', header: '互動率' },
    { key: 'featured', header: '精選' },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="heading-lg">內容績效</h1>
        <ExportButton data={sorted} columns={exportColumns} fileName="content-performance" />
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard title="總內容" value={content.length} icon={BookOpen} />
        <StatCard title="平均閱讀深度" value={`${averageDepth}%`} icon={Eye} />
        <StatCard title="平均停留" value={`${averageTime} 分`} icon={Timer} />
        <StatCard title="零互動內容" value={zeroInteractionCount} icon={Star} />
      </div>

      <div className="admin-panel-card">
        {sorted.length === 0 && (
          <div className="border-b border-border px-4 py-8 text-center text-sm text-muted-foreground">
            目前尚無內容績效資料
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="admin-table-shell text-sm">
            <thead>
              <tr className="admin-table-head">
                <th className="px-4 py-3 font-medium text-muted-foreground">標題</th>
                {[
                  { key: 'views' as SortField, label: '瀏覽數' },
                  { key: 'depth' as SortField, label: '閱讀深度%' },
                  { key: 'avgTime' as SortField, label: '平均停留' },
                  { key: 'interactionRate' as SortField, label: '互動率' },
                ].map((col) => (
                  <th key={col.key} className="px-4 py-3 font-medium text-muted-foreground">
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      className={cn(
                        'px-0 py-0 h-auto font-medium',
                        sortBy === col.key && 'text-foreground underline',
                        'hover:bg-transparent hover:text-foreground',
                      )}
                      onClick={() => setSortBy(col.key)}
                    >
                      {col.label}
                    </Button>
                  </th>
                ))}
                <th className="px-4 py-3 font-medium text-muted-foreground">精選</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((item) => (
                <tr
                  key={item.id}
                  className={cn(
                    'border-b border-border',
                    item.interactionRate === 0 && 'bg-destructive/5',
                  )}
                >
                  <td className="px-4 py-3 font-medium">{item.title}</td>
                  <td className="px-4 py-3">{item.views.toLocaleString()}</td>
                  <td className="px-4 py-3">{item.depth}%</td>
                  <td className="px-4 py-3">{item.avgTime} 分</td>
                  <td className="px-4 py-3">{item.interactionRate}%</td>
                  <td className="px-4 py-3">
                    {item.featured && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-warning/15 px-2 py-0.5 text-xs text-warning">
                        <Star className="h-3 w-3" /> 精選
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <Button
                      type="button"
                      variant="ghost"
                      size="xs"
                      className={cn(
                        'h-auto px-0 py-0 font-medium',
                        item.featured ? 'text-primary/90' : 'text-primary',
                      )}
                      onClick={() => {
                        setContent((prev) =>
                          prev.map((c) => (c.id === item.id ? { ...c, featured: !c.featured } : c)),
                        )
                      }}
                    >
                      {item.featured ? '取消精選' : '設為精選'}
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="admin-panel-card p-5">
        <h2 className="mb-4 heading-sm">策展集合</h2>
        {collections.length === 0 && (
          <p className="mb-4 text-sm text-muted-foreground">目前尚無內容策展集合</p>
        )}
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {collections.map((col) => (
            <div key={col.name} className="admin-card-soft flex items-center justify-between">
              <div>
                <p className="font-medium">{col.name}</p>
                <p className="text-sm text-muted-foreground">{col.count} 篇內容</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="xs"
                className="h-auto px-0 py-0 text-sm font-medium"
                onClick={() => alert('功能開發中')}
              >
                編輯
              </Button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
