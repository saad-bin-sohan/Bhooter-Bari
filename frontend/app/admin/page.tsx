'use client'
import { useEffect, useState } from 'react'
import { Card } from '../../components/Card'
import { Input } from '../../components/Input'
import { Button } from '../../components/Button'
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

  return (
    <main className="min-h-screen px-6 md:px-10 py-10 space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-[#6b7280]">Admin only</p>
          <h1 className="text-4xl font-bold">Dashboard</h1>
        </div>
      </div>
      {!metrics && (
        <Card className="space-y-3 max-w-md">
          <Input placeholder="Username" value={username} onChange={e => setUsername(e.target.value)} />
          <Input placeholder="Password" type="password" value={password} onChange={e => setPassword(e.target.value)} />
          {error && <div className="text-sm text-red-500">{error}</div>}
          <Button onClick={handleLogin}>Log in</Button>
        </Card>
      )}
      {metrics && (
        <div className="space-y-4">
          <Card className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm text-[#6b7280]">Rooms today</p>
              <p className="text-3xl font-bold">{metrics.today.roomsCreated}</p>
            </div>
            <div>
              <p className="text-sm text-[#6b7280]">Messages today</p>
              <p className="text-3xl font-bold">{metrics.today.messagesSent}</p>
            </div>
            <div>
              <p className="text-sm text-[#6b7280]">Abuse reports today</p>
              <p className="text-3xl font-bold">{metrics.today.abuseReportsCount}</p>
            </div>
          </Card>
          <Card className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-[#6b7280]">Total rooms</p>
              <p className="text-3xl font-bold">{metrics.totals.roomsCreated}</p>
            </div>
            <div>
              <p className="text-sm text-[#6b7280]">Total messages</p>
              <p className="text-3xl font-bold">{metrics.totals.messagesSent}</p>
            </div>
            <div>
              <p className="text-sm text-[#6b7280]">Abuse reports</p>
              <p className="text-3xl font-bold">{metrics.totals.abuseReportsCount}</p>
            </div>
            <div>
              <p className="text-sm text-[#6b7280]">Avg lifetime (s)</p>
              <p className="text-3xl font-bold">{Math.round(metrics.totals.averageRoomLifetimeSeconds)}</p>
            </div>
          </Card>
          <Card>
            <h3 className="text-xl font-semibold mb-4">Last 7 days</h3>
            <div className="space-y-2">
              {metrics.history.map((row: any) => (
                <div key={row.id} className="flex items-center justify-between p-3 rounded-xl shadow-neu">
                  <span className="text-sm text-[#6b7280]">{new Date(row.date).toLocaleDateString()}</span>
                  <div className="flex gap-4 text-sm">
                    <span>{row.roomsCreated} rooms</span>
                    <span>{row.messagesSent} msgs</span>
                    <span>{row.abuseReportsCount} reports</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}
    </main>
  )
}
