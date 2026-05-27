import { BookOpen, Eye, Star, Timer } from 'lucide-react'
import { useState } from 'react'
import { ExportButton } from '@/components/ExportButton'
import { StatCard } from '@/components/StatCard'
import { cn } from '@/lib/utils'

const mockContent = [
  { id: 1, title: '如何開始自主學習', views: 2345, depth: 78, avgTime: '4.2 分', interactionRate: '12.3%', featured: true },
  { id: 2, title: 'React 入門教學', views: 1890, depth: 65, avgTime: '3.8 分', interactionRate: '9.8%', featured: true },
  { id: 3, title: 'Python 資料分析實戰', views: 1456, depth: 72, avgTime: '5.1 分', interactionRate: '11.2%', featured: false },
  { id: 4, title: '設計思考工作坊心得', views: 987, depth: 58, avgTime: '2.9 分', interactionRate: '7.5%', featured: false },
  { id: 5, title: 'AI 時代的學習策略', views: 876, depth: 81, avgTime: '4.5 分', interactionRate: '14.1%', featured: false },
  { id: 6, title: '遠端工作生產力指南', views: 654, depth: 45, avgTime: '2.1 分', interactionRate: '3.2%', featured: false },
  { id: 7, title: '開源社群參與指南', views: 432, depth: 52, avgTime: '2.8 分', interactionRate: '5.6%', featured: false },
  { id: 8, title: '學習筆記整理術', views: 23, depth: 12, avgTime: '0.3 分', interactionRate: '0%', featured: false },
]

const mockCollections = [
  { name: '本週推薦', count: 5 },
  { name: '入門必讀', count: 8 },
]

type SortField = 'views' | 'depth' | 'avgTime' | 'interactionRate'

export function ContentPerformancePage() {
  const [sortBy, setSortBy] = useState<SortField>('views')
  const [content, setContent] = useState(mockContent)

  const sorted = [...content].sort((a, b) => {
    if (sortBy === 'avgTime') return Number.parseFloat(b.avgTime) - Number.parseFloat(a.avgTime)
    if (sortBy === 'interactionRate') return Number.parseFloat(b.interactionRate) - Number.parseFloat(a.interactionRate)
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
        <StatCard title="總內容" value={156} icon={BookOpen} />
        <StatCard title="平均閱讀深度" value="62%" icon={Eye} />
        <StatCard title="平均停留" value="3.2 分" icon={Timer} />
        <StatCard title="零互動內容" value={12} change={-8.3} changeLabel="vs 上月" />
      </div>

      <div className="rounded-xl border border-border bg-card shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="px-4 py-3 font-medium text-muted-foreground">標題</th>
                {[
                  { key: 'views' as SortField, label: '瀏覽數' },
                  { key: 'depth' as SortField, label: '閱讀深度%' },
                  { key: 'avgTime' as SortField, label: '平均停留' },
                  { key: 'interactionRate' as SortField, label: '互動率' },
                ].map((col) => (
                  <th key={col.key} className="px-4 py-3 font-medium text-muted-foreground">
                    <button
                      type="button"
                      onClick={() => setSortBy(col.key)}
                      className={cn('hover:text-foreground', sortBy === col.key && 'text-foreground underline')}
                    >
                      {col.label}
                    </button>
                  </th>
                ))}
                <th className="px-4 py-3 font-medium text-muted-foreground">精選</th>
                <th className="px-4 py-3 font-medium text-muted-foreground">操作</th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((item) => (
                <tr key={item.id} className={cn('border-b border-border', Number.parseFloat(item.interactionRate) === 0 && 'bg-destructive/5')}>
                  <td className="px-4 py-3 font-medium">{item.title}</td>
                  <td className="px-4 py-3">{item.views.toLocaleString()}</td>
                  <td className="px-4 py-3">{item.depth}%</td>
                  <td className="px-4 py-3">{item.avgTime}</td>
                  <td className="px-4 py-3">{item.interactionRate}</td>
                  <td className="px-4 py-3">
                    {item.featured && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs text-yellow-700">
                        <Star className="h-3 w-3" /> 精選
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      type="button"
                      onClick={() => {
                        setContent((prev) => prev.map((c) => (c.id === item.id ? { ...c, featured: !c.featured } : c)))
                      }}
                      className="text-xs text-primary hover:underline"
                    >
                      {item.featured ? '取消精選' : '設為精選'}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <h2 className="mb-4 heading-sm">策展集合</h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {mockCollections.map((col) => (
            <div key={col.name} className="flex items-center justify-between rounded-lg border border-border p-4">
              <div>
                <p className="font-medium">{col.name}</p>
                <p className="text-sm text-muted-foreground">{col.count} 篇內容</p>
              </div>
              <button type="button" onClick={() => alert('功能開發中')} className="text-sm text-primary hover:underline">
                編輯
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
