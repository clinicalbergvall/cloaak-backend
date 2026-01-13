
import { useMemo, useState, useEffect } from 'react'
import { Card, Button, Badge, Input } from '@/components/ui'
import type { CleanerProfile, BookingHistoryItem } from '@/lib/types'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { logger } from '@/lib/logger'
import { getStoredAuthToken } from '@/lib/storage'

interface DashboardStats {
  totalCleaners: number
  pendingCleaners: number
  approvedCleaners: number
  totalBookings: number
  completedBookings: number
  totalRevenue: number
}

interface ClientData {
  clientId: string
  name: string
  email: string
  phone: string
  totalBookings: number
  totalSpent: number
  lastBooking: string | null
  lastService?: string
  status: string
}

interface BookingData {
  _id: string
  id?: string
  phone?: string
  client: { name: string; email: string; phone: string }
  cleaner: { firstName: string; lastName: string }
  serviceCategory: string
  status: string
  price: number
  createdAt: string
  scheduledDate?: string
  scheduledTime?: string
  carServicePackage?: string
  cleaningCategory?: string
}



export default function AdminDashboard() {
  const [pending, setPending] = useState<CleanerProfile[]>([])
  const [approved, setApproved] = useState<CleanerProfile[]>([])
  const [selectedTab, setSelectedTab] = useState<'pending' | 'approved'>('pending')
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState('all')
  const [clients, setClients] = useState<ClientData[]>([])
  const [bookings, setBookings] = useState<BookingData[]>([])
  const [bookingStatus, setBookingStatus] = useState<'all' | 'pending' | 'confirmed' | 'completed'>('all')
  const [bookingPage, setBookingPage] = useState(1)
  const [bookingLimit, setBookingLimit] = useState(10)
  const [bookingTotal, setBookingTotal] = useState(0)
  const [bookingPages, setBookingPages] = useState(0)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const getAuthToken = () => {
    return getStoredAuthToken()
  }

  const fetchPendingCleaners = async () => {
    try {
      const res = await api.get('/admin/cleaners/pending')
      if (!res.ok) throw new Error('Failed to fetch pending cleaners')
      const data = await res.json()
      setPending(data.cleaners || [])
    } catch (error) {
      logger.error('Fetch pending cleaners error:', error instanceof Error ? error : undefined);
      toast.error('Failed to load pending cleaners')
    }
  }

  const fetchApprovedCleaners = async () => {
    try {
      const res = await api.get('/admin/cleaners/approved')
      if (!res.ok) throw new Error('Failed to fetch approved cleaners')
      const data = await res.json()
      setApproved(data.cleaners || [])
    } catch (error) {
      logger.error('Fetch approved cleaners error:', error instanceof Error ? error : undefined);
      toast.error('Failed to load approved cleaners')
    }
  }

  const fetchClients = async () => {
    try {
      const res = await api.get('/admin/clients')
      if (!res.ok) throw new Error('Failed to fetch clients')
      const data = await res.json()
      setClients(data.clients || [])
    } catch (error) {
      logger.error('Fetch clients error:', error instanceof Error ? error : undefined);
    }
  }

  const fetchBookings = async (status?: string, page: number = 1, limit: number = bookingLimit) => {
    try {
      const qs = new URLSearchParams()
      if (status && status !== 'all') qs.set('status', status)
      if (page) qs.set('page', String(page))
      if (limit) qs.set('limit', String(limit))
      const res = await api.get(`/admin/bookings${qs.toString() ? `?${qs.toString()}` : ''}`)
      if (!res.ok) throw new Error('Failed to fetch bookings')
      const data = await res.json()
      setBookings(data.bookings || [])
      setBookingTotal(data.total || (data.bookings?.length ?? 0))
      setBookingPages(data.pages || 1)
    } catch (error) {
      logger.error('Fetch bookings error:', error instanceof Error ? error : undefined);
    }
  }

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/dashboard/stats')
      if (!res.ok) throw new Error('Failed to fetch stats')
      const data = await res.json()
      setStats(data.stats)
    } catch (error) {
      logger.error('Fetch stats error:', error instanceof Error ? error : undefined);
    }
  }

  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true)
      await Promise.all([
        fetchPendingCleaners(),
        fetchApprovedCleaners(),
        fetchClients(),
        fetchBookings(bookingStatus, bookingPage, bookingLimit),
        fetchStats()
      ])
      setIsLoading(false)
    }
    loadData()
  }, [])

  useEffect(() => {
    fetchBookings(bookingStatus, bookingPage, bookingLimit)
  }, [bookingStatus, bookingPage, bookingLimit])

  const refreshLists = () => {
    fetchPendingCleaners()
    fetchApprovedCleaners()
    fetchStats()
  }

  const handleApprove = async (profile: CleanerProfile & { _id?: string }) => {
    try {
      const res = await api.put(`/admin/cleaners/${(profile as any)._id || profile.id}/approve`, {
        notes: 'Approved via admin dashboard'
      })
      if (!res.ok) throw new Error('Failed to approve cleaner')
      toast.success(`${profile.firstName} approved!`)
      refreshLists()
    } catch (error) {
      logger.error('Approve error:', error instanceof Error ? error : undefined);
      toast.error('Failed to approve cleaner')
    }
  }

  const handleReject = async (profile: CleanerProfile & { _id?: string }) => {
    try {
      const res = await api.put(`/admin/cleaners/${(profile as any)._id || profile.id}/reject`, { notes: 'Rejected via admin dashboard' })
      if (!res.ok) throw new Error('Failed to reject cleaner')
      toast('Cleaner rejected', { icon: '⚠️' })
      refreshLists()
    } catch (error) {
      logger.error('Reject error:', error instanceof Error ? error : undefined);
      toast.error('Failed to reject cleaner')
    }
  }

  const allCleaners = [...pending, ...approved]

  const summary = useMemo(() => {
    if (!stats) return { total: 0, totalJobs: 0 }
    return {
      total: stats.totalCleaners,
      totalJobs: stats.totalBookings
    }
  }, [stats])

  const recentActivity = useMemo(() => {
    return [...pending, ...approved]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 4)
  }, [pending, approved])

  const uniqueCities = useMemo(() => {
    const cities = new Set([...pending, ...approved].map(cleaner => cleaner.city).filter(Boolean))
    return ['all', ...Array.from(cities)]
  }, [pending, approved])

  const filteredList = (selectedTab === 'pending' ? pending : approved)
    .filter((profile: CleanerProfile) => `${profile.firstName} ${profile.lastName}`.toLowerCase().includes(search.toLowerCase()))
    .filter((profile: CleanerProfile) => cityFilter === 'all' || profile.city === cityFilter)



  const monitoringSignals = useMemo(() => {
    const missingDocs = pending.filter(
      (cleaner: CleanerProfile) => !cleaner.passportPhoto || !cleaner.fullBodyPhoto || !cleaner.verification?.idDocumentFront
    ).length

    const lowRatings = approved.filter((cleaner: CleanerProfile) => (cleaner.rating || 0) < 3).length
    const idleCleaners = approved.filter((cleaner: CleanerProfile) => (cleaner.totalJobs || 0) === 0).length

    return [
      { label: 'Docs Missing', value: missingDocs, subtitle: 'Need follow-up', tone: 'warning' as const },
      { label: 'Low Ratings', value: lowRatings, subtitle: '< 3 ★ rating', tone: 'alert' as const },
      { label: 'Idle Cleaners', value: idleCleaners, subtitle: '0 recent jobs', tone: 'neutral' as const }
    ]
  }, [pending, approved])

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <header className="relative rounded-3xl border border-yellow-400/40 bg-gradient-to-br from-slate-900 via-slate-950 to-black p-6 sm:p-8 shadow-[0_0_35px_rgba(234,179,8,0.25)]">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <img
                  src="/logo.png"
                  alt="CleanCloak logo"
                  className="h-12 w-12 rounded-2xl border border-yellow-400/50 bg-black/40 p-2 shadow-[0_0_25px_rgba(250,204,21,0.35)]"
                />
                <div>
                  <p className="text-xs tracking-[0.3em] uppercase text-yellow-300">CleanCloak</p>
                  <p className="text-sm font-semibold text-slate-200">Ops Control Division</p>
                </div>
              </div>
              <div>
                <p className="text-xs tracking-[0.3em] uppercase text-yellow-400">Command Center</p>
                <h1 className="mt-2 text-4xl font-black tracking-tight text-white">Cleaner Intelligence Dashboard</h1>
                <p className="mt-3 max-w-2xl text-sm text-slate-300">
                  Monitor the entire cleaner lifecycle in real time — pending verifications, compliance, ratings, and output all from one neon cockpit.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="outline" onClick={refreshLists} disabled={isLoading} className="border-yellow-400/60 text-yellow-300 hover:bg-yellow-400/10">
                {isLoading ? 'Loading...' : 'Sync Records'}
              </Button>
              <Button className="bg-yellow-400 text-slate-950 hover:bg-yellow-300">Launch Audit Mode</Button>
            </div>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <StatCard label="Total Cleaners" value={stats?.totalCleaners || 0} accent="from-yellow-300/80 to-yellow-500/60" />
            <StatCard label="Pending Reviews" value={stats?.pendingCleaners || 0} accent="from-orange-300/70 to-rose-500/50" />
          </div>
        </header>

        <div className="grid grid-cols-1 items-start gap-6 xl:grid-cols-[2fr_1fr]">
          <section className="relative space-y-6 rounded-3xl border border-slate-800/80 bg-slate-950/60 p-6 shadow-2xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex overflow-hidden rounded-2xl border border-slate-800">
                <button
                  className={`flex-1 px-6 py-3 text-sm font-semibold tracking-wide transition ${selectedTab === 'pending'
                    ? 'bg-yellow-400 text-slate-950 shadow-[0_0_25px_rgba(250,204,21,0.5)]'
                    : 'bg-transparent text-slate-400 hover:text-white'
                    }`}
                  onClick={() => setSelectedTab('pending')}
                >
                  Pending ({pending.length})
                </button>
                <button
                  className={`flex-1 px-6 py-3 text-sm font-semibold tracking-wide transition ${selectedTab === 'approved'
                    ? 'bg-emerald-400 text-slate-950 shadow-[0_0_25px_rgba(52,211,153,0.5)]'
                    : 'bg-transparent text-slate-400 hover:text-white'
                    }`}
                  onClick={() => setSelectedTab('approved')}
                >
                  Approved ({approved.length})
                </button>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  placeholder="Search cleaner name"
                  value={search}
                  onChange={(e: any) => setSearch(e.target.value)}
                  className="min-w-[220px] border-slate-800 bg-slate-900/60 text-slate-100 placeholder:text-slate-500"
                />
                <select
                  value={cityFilter}
                  onChange={(e: any) => setCityFilter(e.target.value)}
                  className="rounded-2xl border border-slate-800 bg-slate-900/60 px-4 py-2 text-sm text-slate-200 focus:outline-none"
                >
                  {uniqueCities.map((city: string) => (
                    <option key={city} value={city} className="bg-slate-900 text-slate-100">
                      {city === 'all' ? 'All Cities' : city}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {filteredList.length === 0 ? (
              <Card className="bg-slate-900/50 border border-slate-800 text-center text-slate-400">
                {selectedTab === 'pending' ? 'No pending cleaners match your filters' : 'No approved cleaners match your filters'}
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredList.map((profile: CleanerProfile) => (
                  <CleanerCard
                    key={profile.id}
                    profile={profile}
                    isPending={selectedTab === 'pending'}
                    onApprove={() => handleApprove(profile)}
                    onReject={() => handleReject(profile)}
                  />
                ))}
              </div>
            )}
          </section>

          <aside className="space-y-6 xl:sticky xl:top-8">
            <Card className="relative border border-slate-800 bg-slate-950/70 p-5">
              <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Bookings</p>
                <span className="text-xs text-slate-500">{bookingTotal} total</span>
              </div>
              <div className="mt-4 flex overflow-hidden rounded-2xl border border-slate-800">
                {['all', 'pending', 'confirmed', 'completed'].map((s) => (
                  <button
                    key={s}
                    className={`flex-1 px-3 py-2 text-xs font-semibold tracking-wide transition ${bookingStatus === s
                      ? 'bg-emerald-400 text-slate-950'
                      : 'bg-transparent text-slate-400 hover:text-white'
                      }`}
                    onClick={() => { setBookingStatus(s as any); setBookingPage(1) }}
                  >
                    {s.replace('-', ' ')}
                  </button>
                ))}
              </div>

              {bookings.length === 0 ? (
                <Card className="mt-4 bg-slate-900/50 border border-slate-800 text-center text-slate-400">No bookings</Card>
              ) : (
                <div className="mt-4 space-y-3">
                  {bookings.map((b: BookingData) => (
                    <div key={b._id || b.id} className="rounded-2xl border border-slate-800/80 bg-slate-900/70 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-sm font-semibold text-white">{b.serviceCategory}</p>
                          <p className="text-xs text-slate-400">Client: {b.client?.name} · {b.client?.phone}</p>
                          <p className="text-xs text-slate-400">Cleaner: {b.cleaner?.firstName} {b.cleaner?.lastName}</p>
                        </div>
                        <Badge variant={b.status === 'completed' ? 'success' : (b.status === 'in-progress' || b.status === 'confirmed') ? 'default' : 'secondary'}>
                          {b.status === 'in-progress' ? 'CONFIRMED' : b.status?.toUpperCase()}
                        </Badge>
                      </div>
                      <div className="mt-2 grid gap-2 sm:grid-cols-3 text-xs text-slate-400">
                        <div>Price: KSh {Number(b.price || 0).toLocaleString()}</div>
                        <div>Created: {new Date(b.createdAt).toLocaleString()}</div>
                        <div>Schedule: {(b.scheduledDate || 'N/A')} {(b.scheduledTime || '')}</div>
                      </div>
                      <div className="mt-2 text-xs text-slate-400">
                        {(b.serviceCategory === 'car-detailing' ? (b.carServicePackage || 'Car Detailing') : (b.cleaningCategory || 'Car Detailing'))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-4 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <button
                    className="rounded-xl border border-slate-800 px-3 py-1 text-xs text-slate-200 disabled:opacity-40"
                    disabled={bookingPage <= 1}
                    onClick={() => setBookingPage((p: number) => Math.max(1, p - 1))}
                  >
                    Prev
                  </button>
                  <button
                    className="rounded-xl border border-slate-800 px-3 py-1 text-xs text-slate-200 disabled:opacity-40"
                    disabled={bookingPage >= bookingPages}
                    onClick={() => setBookingPage((p: number) => Math.min(bookingPages, p + 1))}
                  >
                    Next
                  </button>
                </div>
                <span className="text-xs text-slate-500">Page {bookingPage} / {bookingPages || 1}</span>
              </div>
            </Card>
          </aside>
        </div>
      </div>


    </div>
  )
}

function PaymentPill({ label, value, tone }: { label: string; value: string; tone: 'emerald' | 'amber' | 'cyan' }) {
  const toneClasses = {
    emerald: 'border-emerald-400/40 bg-emerald-400/10 text-emerald-100',
    amber: 'border-amber-400/40 bg-amber-400/10 text-amber-100',
    cyan: 'border-cyan-400/40 bg-cyan-400/10 text-cyan-100'
  } as const

  return (
    <div className={`rounded-2xl border px-4 py-3 text-center ${toneClasses[tone]}`}>
      <p className="text-xs uppercase tracking-[0.3em]">{label}</p>
      <p className="mt-2 text-lg font-semibold">{value}</p>
    </div>
  )
}

function StatCard({
  label,
  value,
  accent
}: {
  label: string
  value: string | number
  accent: string
}) {
  return (
    <div className={`rounded-2xl border border-slate-800/70 bg-gradient-to-br ${accent} p-4 text-slate-900 shadow-inner shadow-black/30`}>
      <p className="text-xs uppercase tracking-[0.3em] text-slate-900/70">{label}</p>
      <p className="mt-3 text-3xl font-black">{value}</p>
      <div className="mt-2 h-1 rounded-full bg-white/50">
        <div className="h-full rounded-full bg-slate-900/80" />
      </div>
    </div>
  )
}

function CleanerCard({
  profile,
  isPending,
  onApprove,
  onReject
}: {
  profile: CleanerProfile
  isPending: boolean
  onApprove: () => void
  onReject: () => void
}) {
  return (
    <Card className="border border-slate-800/80 bg-slate-950/70 p-6 text-slate-200">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-full border border-yellow-400/50 bg-slate-900 px-4 py-2 text-xs font-semibold uppercase tracking-[0.3em] text-yellow-300">
              {profile.approvalStatus === 'approved' ? 'Live' : 'Review'}
            </div>
            <h2 className="text-2xl font-semibold text-white">
              {profile.firstName} {profile.lastName}
            </h2>
            <Badge variant={isPending ? 'warning' : 'success'}>{profile.city}</Badge>
          </div>
          <p className="mt-2 text-sm text-slate-400">
            {profile.phone} · {profile.email || 'No email on file'}
          </p>
          <div className="mt-3">
            <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Services</p>
            <p className="text-sm text-slate-200">{(profile.services || []).join(', ') || 'Not specified'}</p>
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Address</p>
              <p className="text-sm text-slate-200 truncate">{profile.address || 'Not provided'}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">Member Since</p>
              <p className="text-sm text-slate-200">
                {profile.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Unknown'}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 text-center">
          <MiniMetric label="Rating" value={`${profile.rating ?? 0} ★`} />
          <MiniMetric label="Jobs" value={profile.totalJobs ?? 0} />
          <MiniMetric label="Verified" value={profile.verified ? 'Yes' : 'No'} />
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {renderImageSlot('Passport', profile.passportPhoto)}
        {renderImageSlot('Full Body', profile.fullBodyPhoto)}
        <div className="rounded-2xl border border-slate-800/70 bg-slate-900/40 p-4 text-sm text-slate-400">
          <p className="text-xs tracking-[0.2em] text-slate-500">ID Verification</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <VerificationChip label="ID" active={!!profile.verification?.idVerified} />
            <VerificationChip label="Police" active={!!profile.verification?.policeCheck} />
            <VerificationChip label="Insurance" active={!!profile.verification?.insuranceCoverage} />
          </div>
          {profile.verification?.idNumber && (
            <p className="mt-2 text-xs text-slate-300">ID: {profile.verification.idNumber}</p>
          )}
        </div>
      </div>

      {profile.beforeAfterPhotos && profile.beforeAfterPhotos.length > 0 && (
        <div className="mt-6">
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">Recent Jobs ({profile.beforeAfterPhotos.length})</p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            {profile.beforeAfterPhotos.slice(0, 2).map((photo) => (
              <div key={photo.id} className="overflow-hidden rounded-2xl border border-slate-800">
                <div className="flex gap-2">
                  <img src={photo.beforeImage} alt="Before" className="h-20 w-1/2 object-cover" />
                  <img src={photo.afterImage} alt="After" className="h-20 w-1/2 object-cover" />
                </div>
                {photo.description && (
                  <p className="p-2 text-xs text-slate-300 truncate">{photo.description}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {isPending && (
        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="outline" onClick={onReject} className="border-rose-500/60 text-rose-200 hover:bg-rose-500/10">
            Reject
          </Button>
          <Button onClick={onApprove} className="bg-emerald-400 text-slate-950 hover:bg-emerald-300">
            Approve
          </Button>
        </div>
      )}
    </Card>
  )
}

function MiniMetric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-2xl border border-slate-800/70 bg-slate-900/40 px-4 py-3 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-100">{value}</p>
    </div>
  )
}

function renderImageSlot(label: string, src?: string) {
  return (
    <div className="rounded-2xl border border-slate-800/70 bg-slate-900/40 p-4 text-center">
      <p className="text-xs uppercase tracking-[0.3em] text-slate-500">{label}</p>
      {src ? (
        <img src={src} alt={label} className="mt-3 h-32 w-full rounded-xl object-cover" />
      ) : (
        <p className="mt-4 text-sm text-slate-500">Pending upload</p>
      )}
    </div>
  )
}

function VerificationChip({ label, active }: { label: string; active: boolean }) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-semibold ${active ? 'bg-emerald-400/20 text-emerald-200' : 'bg-slate-700/40 text-slate-400'
        }`}
    >
      {label}
    </span>
  )
}
