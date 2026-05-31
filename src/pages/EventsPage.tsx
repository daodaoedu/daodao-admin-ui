import { Calendar, Clock, Edit, MapPin, Plus, RefreshCw, Send, Users, Video } from 'lucide-react'
import { useEffect, useState } from 'react'
import { PageHeader } from '@/components/PageHeader'
import { Button } from '@/components/ui/button'
import { useEventRSVPs, useEvents, useEventTemplates } from '@/hooks/useEvents'
import { cn } from '@/lib/utils'

// ── Types ────────────────────────────────────────────────
interface RSVPEntry {
  id: number
  user: string
  status: 'registered' | 'waitlist' | 'attended' | 'no-show'
  time: string
}

type TabKey = 'upcoming' | 'past' | 'recurring'

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
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null)

  const { data: upcomingEvents } = useEvents({ status: 'upcoming' })
  const { data: pastEvents } = useEvents({ status: 'past' })
  const { data: rsvps } = useEventRSVPs(activeTab === 'upcoming' ? selectedEventId : null)
  const { data: templates } = useEventTemplates()

  const displayUpcomingEvents = upcomingEvents ?? []
  const displayPastEvents = pastEvents ?? []
  const displayRsvps = rsvps ?? []
  const displayTemplates = templates ?? []

  const TABS = [
    { key: 'upcoming', label: '即將舉行', count: displayUpcomingEvents.length },
    { key: 'past', label: '已結束', count: displayPastEvents.length },
    { key: 'recurring', label: '週期性', count: displayTemplates.length },
  ] as const

  useEffect(() => {
    if (selectedEventId === null && displayUpcomingEvents.length > 0) {
      setSelectedEventId(displayUpcomingEvents[0].id)
    }
  }, [selectedEventId, displayUpcomingEvents])

  const selectedEvent = displayUpcomingEvents.find((e) => e.id === selectedEventId)

  return (
    <div className="space-y-6">
      {/* ── Header ──────────────────────────────────────── */}
      <PageHeader
        title="活動管理"
        description="建立線上或實體活動、管理報名名單與出席記錄。"
        actions={
          <Button type="button">
            <Plus className="h-4 w-4" />
            建立活動
          </Button>
        }
      />

      {/* ── Filter tabs ─────────────────────────────────── */}
      <div className="inline-flex rounded-lg border border-[var(--admin-panel-border)] bg-background/65 p-1">
        {TABS.map((tab) => (
          <Button
            key={tab.key}
            type="button"
            onClick={() => setActiveTab(tab.key)}
            className={cn(
              'inline-flex items-center rounded-md px-3 py-1.5 text-sm font-medium transition-colors border-transparent bg-transparent shadow-none hover:bg-muted hover:text-foreground inline-flex items-center gap-1.5 flex-1',
              activeTab === tab.key
                ? 'bg-background/70 text-foreground shadow-sm hover:bg-background/70'
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
          </Button>
        ))}
      </div>

      {/* ── Event cards (即將舉行) ──────────────────────── */}
      {activeTab === 'upcoming' && (
        <div className="grid gap-4 lg:grid-cols-3">
          {displayUpcomingEvents.map((event) => (
            <div
              key={event.id}
              className={cn(
                'rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm transition-colors',
                selectedEventId === event.id ? 'border-primary' : 'border-border',
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
                    <span className="text-warning">· Waitlist: {event.waitlist}</span>
                  )}
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <Button
                  type="button"
                  onClick={() => setSelectedEventId(event.id)}
                  size="sm"
                  variant="outline"
                >
                  <Users className="h-3 w-3" />
                  查看 RSVP
                </Button>
                <Button type="button" size="sm" variant="outline">
                  <Send className="h-3 w-3" />
                  發送提醒
                </Button>
                <Button type="button" size="sm" variant="outline">
                  <Edit className="h-3 w-3" />
                  編輯
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'past' && (
        <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm">
          {displayPastEvents.length === 0 ? (
            <p className="text-muted-foreground">暫無已結束活動</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">
                <thead>
                  <tr className="border-b border-border text-left">
                    <th className="pb-3 font-medium text-muted-foreground">活動名稱</th>
                    <th className="pb-3 font-medium text-muted-foreground">日期</th>
                    <th className="pb-3 font-medium text-muted-foreground">地點</th>
                    <th className="pb-3 font-medium text-muted-foreground">出席 / 報名</th>
                  </tr>
                </thead>
                <tbody>
                  {displayPastEvents.map((event) => (
                    <tr
                      key={event.id}
                      className="border-b border-border/80 hover:bg-muted/45 transition-colors last:border-0"
                    >
                      <td className="py-3 font-medium text-foreground">{event.name}</td>
                      <td className="py-3 text-muted-foreground">
                        {event.date} {event.time}
                      </td>
                      <td className="py-3 text-muted-foreground">{event.location}</td>
                      <td className="py-3 text-muted-foreground">
                        {event.rsvp}
                        {event.capacity != null ? `/${event.capacity}` : ''}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── RSVP summary card ──────────────────────────── */}
      {activeTab === 'upcoming' && selectedEvent && (
        <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm p-5">
          <h2 className="mb-4 text-base leading-none font-semibold tracking-tight text-foreground">
            RSVP 詳情 — {selectedEvent.name}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-sm font-medium text-muted-foreground">
                  <th className="pb-3 font-medium text-muted-foreground">用戶</th>
                  <th className="pb-3 font-medium text-muted-foreground">報名狀態</th>
                  <th className="pb-3 font-medium text-muted-foreground">報名時間</th>
                </tr>
              </thead>
              <tbody>
                {displayRsvps.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-border/80 hover:bg-muted/45 transition-colors last:border-0"
                  >
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
      {activeTab === 'recurring' && (
        <div className="rounded-xl border border-[var(--admin-card-border)] bg-card/95 p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <RefreshCw className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-base leading-none font-semibold tracking-tight text-foreground">
              週期性模板
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-border text-left text-sm font-medium text-muted-foreground">
                  <th className="pb-3 font-medium text-muted-foreground">模板名稱</th>
                  <th className="pb-3 font-medium text-muted-foreground">頻率</th>
                  <th className="pb-3 font-medium text-muted-foreground">下次場次</th>
                  <th className="pb-3 font-medium text-muted-foreground">已生成場次數</th>
                </tr>
              </thead>
              <tbody>
                {displayTemplates.map((tpl) => (
                  <tr
                    key={tpl.id}
                    className="border-b border-border/80 hover:bg-muted/45 transition-colors last:border-0"
                  >
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
      )}
    </div>
  )
}
