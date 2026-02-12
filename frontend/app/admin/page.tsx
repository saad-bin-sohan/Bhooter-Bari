'use client'
import { useEffect, useMemo, useState } from 'react'
import { Card } from '../../components/ui/Card'
import { Input } from '../../components/ui/Input'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { ThemeToggle } from '../../components/ui/ThemeToggle'
import { apiRequest } from '../../lib/api'

export default function AdminPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [token, setToken] = useState('')
  const [metrics, setMetrics] = useState<any>(null)

  const loadMetrics = async (sessionToken?: string) => {
    const data = await apiRequest('/admin/metrics', { credentials: true, headers: sessionToken ? { Authorization: `Bearer ${sessionToken}` } : undefined })
    setMetrics(data)
  }

  const handleLogin = async () => {
    try {
      const res = await apiRequest<{ token: string }>('/admin/login', { method: 'POST', body: { username, password }, credentials: true })
      setToken(res.token)
      setError('')
      await loadMetrics(res.token)
    } catch (e: any) {
      setError('Invalid admin credentials')
    }
  }

  useEffect(() => {
    loadMetrics().catch(() => {})
  }, [])

  const maxRooms = useMemo(() => {
    if (!metrics?.history?.length) return 1
    return Math.max(...metrics.history.map((row: any) => row.roomsCreated), 1)
  }, [metrics])

  return (
    <main className="min-h-screen px-6 py-10 md:px-10">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm text-muted">Admin only</p>
            <h1 className="text-3xl font-semibold md:text-4xl">Analytics dashboard</h1>
          </div>
          <ThemeToggle />
        </header>

        {!metrics && (
          <Card className="max-w-md space-y-3">
            <Badge variant="warning">Restricted</Badge>
            <Input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
            <Input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
            {error && <div className="rounded-2xl border border-danger/40 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</div>}
            <Button onClick={handleLogin}>Log in</Button>
          </Card>
        )}

        {metrics && (
          <div className="space-y-6">
            <Card className="grid gap-4 md:grid-cols-3">
              <div>
                <p className="text-sm text-muted">Rooms today</p>
                <p className="text-3xl font-semibold">{metrics.today.roomsCreated}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Messages today</p>
                <p className="text-3xl font-semibold">{metrics.today.messagesSent}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Abuse reports today</p>
                <p className="text-3xl font-semibold">{metrics.today.abuseReportsCount}</p>
              </div>
            </Card>

            <Card className="grid gap-4 md:grid-cols-4">
              <div>
                <p className="text-sm text-muted">Total rooms</p>
                <p className="text-3xl font-semibold">{metrics.totals.roomsCreated}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Total messages</p>
                <p className="text-3xl font-semibold">{metrics.totals.messagesSent}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Abuse reports</p>
                <p className="text-3xl font-semibold">{metrics.totals.abuseReportsCount}</p>
              </div>
              <div>
                <p className="text-sm text-muted">Avg lifetime (s)</p>
                <p className="text-3xl font-semibold">{Math.round(metrics.totals.averageRoomLifetimeSeconds)}</p>
              </div>
            </Card>

            <Card className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-semibold">Last 7 days</h3>
                {token && <Badge variant="success">Authenticated</Badge>}
              </div>
              <div className="space-y-3">
                {metrics.history.map((row: any) => (
                  <div key={row.id} className="flex flex-wrap items-center gap-3">
                    <div className="w-20 text-xs text-muted">{new Date(row.date).toLocaleDateString()}</div>
                    <div className="flex-1">
                      <div className="h-2 w-full rounded-full bg-surface3">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-primary to-primary-2"
                          style={{ width: `${Math.max(8, (row.roomsCreated / maxRooms) * 100)}%` }}
                        />
                      </div>
                    </div>
                    <div className="text-xs text-muted">{row.roomsCreated} rooms · {row.messagesSent} msgs · {row.abuseReportsCount} reports</div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        )}
      </div>
    </main>
  )
}
