import { useParams } from 'react-router-dom'

export function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  return (
    <div className="space-y-6">
      <h1 className="heading-lg">用戶詳情</h1>
      <p className="text-muted-foreground">用戶 ID: {userId}</p>
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <p className="text-muted-foreground">此頁面正在開發中...</p>
      </div>
    </div>
  )
}
