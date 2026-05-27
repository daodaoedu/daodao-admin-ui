import {
  Calendar,
  Clock,
  Edit,
  MapPin,
  Plus,
  RefreshCw,
  Send,
  Users,
  Video,
} from 'lucide-react'
import { useState } from 'react'
import { cn } from '@/lib/utils'

// ── Types ────────────────────────────────────────────────
interface Event {
  id: number
  name: string
  date: string
  time: string
  location: string
  locationType: 'online' | 'offline'
  rsvp: number
  capacity: number | null
  waitlist: number
}

interface RSVPEntry {
  id: number
  user: string
  status: 'registered' | 'waitlist' | 'attended' | 'no-show'
  time: string
}

interface RecurringTemplate {
  id: number
  name: string
  frequency: string
  nextSession: string
  totalGenerated: number
}

// ── Mock data ────────────────────────────────────────────
const TABS = [
  { key: 'upcoming', label: '即將舉行', count: 3 },
  { key: 'past', label: '已結束', count: 5 },
  { key: 'recurring', label: '週期性', count: 2 },
] as const

type TabKey = (typeof TABS)[number]['key']

const MOCK_UPCOMING_EVENTS: Event[] = [
  {
    id: 1,
    name: '每週讀書會 #23',
    date: '2024-06-15',
    time: '14:00',
    location: '線上 (Google Meet)',
    locationType: 'online',
    rsvp: 18,
    capacity: 30,
    waitlist: 2,
  },
  {
    id: 2,
    name: 'AI 工作坊',
    date: '2024-06-20',
    time: '10:00',
    location: '實體 (台北)',
    locationType: 'offline',
    rsvp: 45,
    capacity: 50,
    waitlist: 8,
  },
  {
    id: 3,
    name: '月度 AMA',
    date: '2024-06-28',
    time: '19:00',
    location: '線上',
    locationType: 'online',
    rsvp: 12,
    capacity: null,
    waitlist: 0,
  },
]

const MOCK_RSVP: RSVPEntry[] = [
  { id: 1, user: '陳小明', status: 'registered', time: '2024-06-10 09:23' },
  { id: 2, user: '林美玲', status: 'registered', time: '2024-06-10 10:15' },
  { id: 3, user: '王大偉', status: 'waitlist', time: '2024-06-11 14:02' },
  { id: 4, user: '張雅婷', status: 'attended', time: '2024-06-09 08:30' },
  { id: 5, user: '李志豪', status: 'no-show', time: '2024-06-08 16:45' },
]

const MOCK_RECURRING_TEMPLATES: RecurringTemplate[] = [
  {
    id: 1,
    name: '每週讀書會',
    frequency: '每週六 14:00',
    nextSession: '2024-06-22',
    totalGenerated: 23,
  },
  {
    id: 2,
    name: '月度 AMA',
    frequency: '每月最後週五',
    nextSession: '2024-06-28',
    totalGenerated: 6,
  },
]

const RSVP_STATUS_STYLES: Record<RSVPEntry['status'], string> = {
  registered: 'bg-success/15 text-success',
  waitlist: 'bg-warning/15 text-warning',
  attended: 'bg-primary/15 text-primary',
  'no-show': 'bg-destructive/15 text-destructive',
}

const RSVP_STATUS_LABELS: Record<RSVPEntry['status'], string> = {
  registered: '已報名',
  waitlist: '候補',
  attended: '已出席',
  'no-show': '未出席',
}

// ── Component ────────────────────────────────────────────
export function EventsPage() {
  const [activeTab, setActiveTab] = useState<TabKey>('upcoming')
  const [selectedEventId, setSelectedEventId] = useState<number | null>(1)

  const selectedEvent = MOCK_UPCOMING_EVENTS.find((e) => e.id === selectedEventId)

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────── */}
      <div className="flex items-center justify-between">
        <h1 className="heading-lg">活動管理</h1>
        <button
          type="button"
          className="inline-flex items-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" />
          建立活動
        </button>
      </div>

      {/* ── Filter tabs ─────────────────────────────────── */}
      <div className="flex gap-1 rounded-lg border border-border bg-muted/50 p-1">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-md px-4 py-2 text-sm font-medium transition-colors',
              activeTab === tab.key
                ? 'bg-card text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground',
            )}
          >
            {tab.label}
            <span
              className={cn(
                'rounded-full px-1.5 py-0.5 text-xs',
                activeTab === tab.key
                  ? 'bg-primary/15 text-primary'
                  : 'bg-muted text-muted-foreground',
              )}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* ── Event cards (即將舉行) ──────────────────────── */}
      {activeTab === 'upcoming' && (
        <div className="grid gap-4 lg:grid-cols-3">
          {MOCK_UPCOMING_EVENTS.map((event) => (
            <div
              key={event.id}
              className={cn(
                'rounded-xl border bg-card p-5 shadow-sm transition-colors',
                selectedEventId === event.id
                  ? 'border-primary'
                  : 'border-border',
              )}
            >
              <h3 className="font-medium text-foreground">{event.name}</h3>

              <div className="mt-3 space-y-1.5 text-sm text-muted-foreground">
                <div className="flex items-center gap-2">
                  <Calendar className="h-3.5 w-3.5" />
                  {event.date}
                  <Clock className="ml-1 h-3.5 w-3.5" />
                  {event.time}
                </div>
                <div className="flex items-center gap-2">
                  {event.locationType === 'online' ? (
                    <Video className="h-3.5 w-3.5" />
                  ) : (
                    <MapPin className="h-3.5 w-3.5" />
                  )}
                  {event.location}
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-3.5 w-3.5" />
                  RSVP: {event.rsvp}/{event.capacity ?? '∞'}
                  {event.waitlist > 0 && (
                    <span className="text-warning">
                      · Waitlist: {event.waitlist}
                    </span>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedEventId(event.id)}
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <Users className="h-3 w-3" />
                  查看 RSVP
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <Send className="h-3 w-3" />
                  發送提醒
                </button>
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-xs font-medium text-foreground transition-colors hover:bg-muted"
                >
                  <Edit className="h-3 w-3" />
                  編輯
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'past' && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-muted-foreground">已結束活動列表（5 筆）</p>
        </div>
      )}

      {activeTab === 'recurring' && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <p className="text-muted-foreground">週期性活動列表（2 筆）</p>
        </div>
      )}

      {/* ── RSVP summary card ──────────────────────────── */}
      {activeTab === 'upcoming' && selectedEvent && (
        <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <h2 className="mb-4 heading-sm">
            RSVP 詳情 — {selectedEvent.name}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="pb-3 font-medium text-muted-foreground">用戶</th>
                  <th className="pb-3 font-medium text-muted-foreground">報名狀態</th>
                  <th className="pb-3 font-medium text-muted-foreground">報名時間</th>
                </tr>
              </thead>
              <tbody>
                {MOCK_RSVP.map((row) => (
                  <tr key={row.id} className="border-b border-border last:border-0">
                    <td className="py-3 text-foreground">{row.user}</td>
                    <td className="py-3">
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium',
                          RSVP_STATUS_STYLES[row.status],
                        )}
                      >
                        {RSVP_STATUS_LABELS[row.status]}
                      </span>
                    </td>
                    <td className="py-3 text-muted-foreground">{row.time}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── 週期性模板 card ─────────────────────────────── */}
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-muted-foreground" />
          <h2 className="heading-sm">週期性模板</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 font-medium text-muted-foreground">模板名稱</th>
                <th className="pb-3 font-medium text-muted-foreground">頻率</th>
                <th className="pb-3 font-medium text-muted-foreground">下次場次</th>
                <th className="pb-3 font-medium text-muted-foreground">已生成場次數</th>
              </tr>
            </thead>
            <tbody>
              {MOCK_RECURRING_TEMPLATES.map((tpl) => (
                <tr key={tpl.id} className="border-b border-border last:border-0">
                  <td className="py-3 font-medium text-foreground">{tpl.name}</td>
                  <td className="py-3 text-muted-foreground">{tpl.frequency}</td>
                  <td className="py-3 text-foreground">{tpl.nextSession}</td>
                  <td className="py-3 text-muted-foreground">{tpl.totalGenerated} 場</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
