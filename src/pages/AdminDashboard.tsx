
import { useMemo, useState, useEffect } from 'react'
import { Card, Button, Badge, Input } from '@/components/ui'
import type { CleanerProfile } from '@/lib/types'
import toast from 'react-hot-toast'
import { api } from '@/lib/api'
import { logger } from '@/lib/logger'

interface DashboardStats {
  totalCleaners: number
  pendingCleaners: number
  approvedCleaners: number
  totalBookings: number
  completedBookings: number
  totalRevenue: number
}

interface BookingData {
  _id: string
  id?: string
  client: { name: string; email: string; phone: string }
  cleaner: { firstName: string; lastName: string }
  serviceCategory: string
  status: string
  price: number
  createdAt: string
  scheduledDate?: string
  scheduledTime?: string
}

export default function AdminDashboard() {
  const [pending, setPending] = useState<CleanerProfile[]>([])
  const [approved, setApproved] = useState<CleanerProfile[]>([])
  const [selectedTab, setSelectedTab] = useState<'pending' | 'approved'>('pending')
  const [search, setSearch] = useState('')
  const [cityFilter, setCityFilter] = useState('all')
  const [bookings, setBookings] = useState<BookingData[]>([])
  const [bookingStatus, setBookingStatus] = useState<'all' | 'pending' | 'confirmed' | 'completed'>('all')
  const [bookingPage, setBookingPage] = useState(1)
  const [bookingPages, setBookingPages] = useState(0)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const fetchPendingCleaners = async () => {
    try {
      const res = await api.get('/admin/cleaners/pending')
      if (!res.ok) throw new Error('Failed to fetch pending cleaners')
      const data = await res.json()
      setPending(data.cleaners || [])
    } catch (error) {
      logger.error('Fetch pending cleaners error:', error instanceof Error ? error : undefined);
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
    }
  }

  const fetchBookings = async (status?: string, page: number = 1) => {
    try {
      const qs = new URLSearchParams()
      if (status && status !== 'all') qs.set('status', status)
      qs.set('page', String(page))
      qs.set('limit', '10')
      const res = await api.get(`/admin/bookings?${qs.toString()}`)
      if (!res.ok) throw new Error('Failed to fetch bookings')
      const data = await res.json()
      setBookings(data.bookings || [])
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

  const loadData = async () => {
    setIsLoading(true)
    await Promise.all([
      fetchPendingCleaners(),
      fetchApprovedCleaners(),
      fetchBookings(bookingStatus, bookingPage),
      fetchStats()
    ])
    setIsLoading(false)
  }

  useEffect(() => {
    loadData()
  }, [])

  useEffect(() => {
    fetchBookings(bookingStatus, bookingPage)
  }, [bookingStatus, bookingPage])

  const handleApprove = async (profileId: string, name: string) => {
    try {
      const res = await api.put(`/admin/cleaners/${profileId}/approve`, {
        notes: 'Verified via High-Priority Admin Cockpit'
      })
      if (!res.ok) throw new Error('Failed to approve')
      toast.success(`${name} verified successfully`)
      loadData()
    } catch (error) {
      toast.error('Verification failed')
    }
  }

  const handleReject = async (profileId: string, name: string) => {
    try {
      const res = await api.put(`/admin/cleaners/${profileId}/reject`, {
        notes: 'Security clearance denied'
      })
      if (!res.ok) throw new Error('Failed to reject')
      toast.error(`${name} rejected`)
      loadData()
    } catch (error) {
      toast.error('Rejection failed')
    }
  }

  const uniqueCities = useMemo(() => {
    const cities = new Set([...pending, ...approved].map((c: CleanerProfile) => c.city).filter(Boolean))
    return ['all', ...Array.from(cities)]
  }, [pending, approved])

  const filteredCleaners = (selectedTab === 'pending' ? pending : approved)
    .filter((p: CleanerProfile) => (`${p.firstName} ${p.lastName}`).toLowerCase().includes(search.toLowerCase()))
    .filter((p: CleanerProfile) => cityFilter === 'all' || p.city === cityFilter)

  return (
    <div className="min-h-screen bg-[#050505] text-slate-200 selection:bg-yellow-500/30 font-inter">
      {/* Background Ambience */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-yellow-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-[1600px] mx-auto p-4 md:p-8 space-y-8">
        {/* Top Navigation / Stats Cockpit */}
        <header className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 p-8 rounded-[2rem] border border-white/5 bg-white/5 backdrop-blur-3xl shadow-2xl relative overflow-hidden group">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="absolute inset-0 bg-yellow-500 blur-xl opacity-20 group-hover:opacity-40 transition-opacity" />
              <img src="/detail-logo.jpg" className="relative w-16 h-16 rounded-2xl object-cover border border-white/10" alt="CleanCloak Logo" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-white flex items-center gap-3">
                Operations <span className="text-yellow-400">Cockpit</span>
                <Badge variant="outline" className="border-yellow-500/30 text-yellow-400 bg-yellow-500/5 animate-pulse">LIVE SYSTEM</Badge>
              </h1>
              <p className="text-slate-400 font-inter mt-1">Global Verification & Dispatch Control</p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-1 lg:max-w-3xl">
            <StatCard label="Total Value" value={`KSh ${(stats?.totalRevenue || 0).toLocaleString()}`} icon="💰" />
            <StatCard label="Live Agents" value={stats?.approvedCleaners || 0} icon="🌍" />
            <StatCard label="Pending Approval" value={stats?.pendingCleaners || 0} icon="⏳" highlight={!!stats?.pendingCleaners} />
            <StatCard label="Global Jobs" value={stats?.totalBookings || 0} icon="📦" />
          </div>

          <Button onClick={loadData} disabled={isLoading} variant="primary" className="h-14 px-8 rounded-2xl bg-white text-black hover:bg-yellow-400 transition-all font-black uppercase tracking-widest text-xs">
            {isLoading ? 'Syncing...' : 'Force Refresh'}
          </Button>
        </header>

        <div className="grid grid-cols-1 xl:grid-cols-[1fr_400px] gap-8">
          {/* Main List Management */}
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 p-4 rounded-3xl border border-white/5 bg-white/5 backdrop-blur-md">
              <div className="flex p-1.5 bg-black/40 rounded-2xl border border-white/5 w-full md:w-auto">
                <TabButton active={selectedTab === 'pending'} onClick={() => setSelectedTab('pending')} count={pending.length} label="Pending Review" />
                <TabButton active={selectedTab === 'approved'} onClick={() => setSelectedTab('approved')} count={approved.length} label="Verified Agents" />
              </div>
              
              <div className="flex items-center gap-3 w-full md:w-auto">
                <Input 
                  placeholder="Filter by name..." 
                  value={search} 
                  onChange={(e: any) => setSearch(e.target.value)}
                  className="h-12 border-white/5 bg-black/40 rounded-xl focus:ring-yellow-500/50"
                />
                <select 
                  className="h-12 px-4 bg-black/40 border border-white/5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500/50"
                  value={cityFilter}
                  onChange={(e: any) => setCityFilter(e.target.value)}
                >
                  {uniqueCities.map((c: string) => <option key={c} value={c}>{c === 'all' ? 'All Locations' : c}</option>)}
                </select>
              </div>
            </div>

            <div className="grid gap-4">
              {filteredCleaners.length === 0 ? (
                <div className="p-20 text-center rounded-[2rem] border border-dashed border-white/10 bg-white/2">
                  <p className="text-slate-500 font-inter text-sm">No intelligence data matches current protocol filters.</p>
                </div>
              ) : (
                filteredCleaners.map((cleaner: CleanerProfile) => (
                  <CleanerRow 
                    key={cleaner.id || (cleaner as any)._id} 
                    cleaner={cleaner} 
                    isPending={selectedTab === 'pending'}
                    onApprove={() => handleApprove((cleaner as any)._id || cleaner.id, `${cleaner.firstName} ${cleaner.lastName}`)}
                    onReject={() => handleReject((cleaner as any)._id || cleaner.id, `${cleaner.firstName} ${cleaner.lastName}`)}
                  />
                ))
              )}
            </div>
          </div>

          {/* Side Panel - Recent Operations */}
          <aside className="space-y-6">
            <div className="p-6 rounded-[2rem] border border-white/5 bg-white/5 backdrop-blur-xl space-y-6">
              <h3 className="text-xl font-black text-white flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Real-time Dispatch
              </h3>
              
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar">
                {bookings.map((booking: BookingData) => (
                  <div key={booking._id} className="p-4 rounded-2xl bg-black/40 border border-white/5 hover:border-white/10 transition-colors group">
                    <div className="flex justify-between items-start mb-2">
                      <p className="text-[10px] font-black uppercase text-yellow-400/80 tracking-widest">{booking.serviceCategory}</p>
                      <Badge variant={booking.status === 'completed' ? 'success' : 'default'} className="rounded-lg text-[10px] font-black">{booking.status.toUpperCase()}</Badge>
                    </div>
                    <p className="text-sm font-bold text-white group-hover:text-yellow-400 transition-colors">{booking.client.name}</p>
                    <p className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                      📍 {booking.cleaner?.firstName} {booking.cleaner?.lastName || 'Unassigned'}
                    </p>
                    <div className="mt-3 flex items-center justify-between text-[10px] font-black text-slate-500 uppercase tracking-tighter">
                      <span>{new Date(booking.createdAt).toLocaleDateString()}</span>
                      <span className="text-emerald-400">KSh {booking.price}</span>
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-4 border-t border-white/5 flex items-center justify-between text-xs font-bold">
                <button 
                  onClick={() => setBookingPage((p: number) => Math.max(1, p-1))}
                  disabled={bookingPage === 1}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-all font-black"
                >
                  PREV
                </button>
                <span className="text-slate-500 uppercase text-[10px] tracking-widest">OP-{bookingPage} / {bookingPages}</span>
                <button 
                  onClick={() => setBookingPage((p: number) => Math.min(bookingPages, p+1))}
                  disabled={bookingPage === bookingPages}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 disabled:opacity-30 transition-all font-black"
                >
                  NEXT
                </button>
              </div>
            </div>

            <div className="p-6 rounded-[2rem] border border-yellow-500/20 bg-gradient-to-br from-yellow-500/10 to-transparent backdrop-blur-3xl text-center space-y-4">
              <div className="w-12 h-12 bg-yellow-500 rounded-full flex items-center justify-center mx-auto shadow-2xl shadow-yellow-500/40">
                <span className="text-xl">💎</span>
              </div>
              <h4 className="font-black text-white uppercase tracking-wider text-sm">Elite Platform Status</h4>
              <p className="text-xs text-slate-400 leading-relaxed font-inter">
                Your system is operating at <span className="text-emerald-400 font-bold">99.9% efficiency</span>. Security protocols for detailer verification are active.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, icon, highlight }: { label: string; value: string | number; icon: string; highlight?: boolean }) {
  return (
    <div className={`p-4 rounded-2xl border border-white/5 bg-black/40 backdrop-blur-xl relative group transition-all ${highlight ? 'ring-1 ring-yellow-500/50 shadow-[0_0_20px_rgba(234,179,8,0.1)]' : ''}`}>
      <div className="text-xl mb-2">{icon}</div>
      <p className="text-[10px] uppercase tracking-widest text-slate-500 font-black">{label}</p>
      <p className="text-lg md:text-xl font-black text-white mt-1 group-hover:text-yellow-400 transition-colors truncate">{value}</p>
    </div>
  )
}

function TabButton({ active, label, count, onClick }: { active: boolean; label: string; count: number; onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`px-6 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all flex items-center gap-2 flex-1 md:flex-none justify-center ${active ? 'bg-white text-black shadow-xl ring-4 ring-white/10' : 'text-slate-500 hover:text-white hover:bg-white/5'}`}
    >
      {label}
      <span className={`px-2 py-0.5 rounded-md text-[10px] ${active ? 'bg-black text-white' : 'bg-white/10 text-slate-400'}`}>{count}</span>
    </button>
  )
}

function CleanerRow({ cleaner, isPending, onApprove, onReject }: { cleaner: any; isPending: boolean; onApprove: () => void; onReject: () => void }) {
  return (
    <div className="group p-6 rounded-[2rem] border border-white/5 bg-white/5 backdrop-blur-md hover:bg-white/10 hover:border-white/10 transition-all flex flex-col lg:flex-row lg:items-center justify-between gap-6 overflow-hidden">
      <div className="flex items-center gap-6 flex-1 min-w-0">
        <div className="relative flex-shrink-0">
          {cleaner.profileImage ? (
            <img src={cleaner.profileImage} className="w-20 h-20 rounded-2xl object-cover ring-2 ring-white/10 shadow-2xl" />
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-slate-800 to-slate-900 flex items-center justify-center text-3xl ring-2 ring-white/10 uppercase font-black text-slate-600">
              {cleaner.firstName?.[0]}{cleaner.lastName?.[0]}
            </div>
          )}
          <div className={`absolute -bottom-2 -right-2 w-6 h-6 rounded-full border-4 border-[#0a0a0a] flex items-center justify-center text-[10px] ${cleaner.verified ? 'bg-emerald-500' : 'bg-yellow-500'}`}>
            {cleaner.verified ? '✓' : '!'}
          </div>
        </div>
        
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-3">
            <h4 className="text-xl font-black text-white group-hover:text-yellow-400 transition-colors truncate">{cleaner.firstName} {cleaner.lastName}</h4>
            <Badge className="bg-white/5 text-slate-400 border-none font-black text-[10px] uppercase tracking-tighter flex-shrink-0">{cleaner.city}</Badge>
          </div>
          <p className="text-sm text-slate-400 font-inter truncate">{cleaner.phone} • {cleaner.email || 'NO SECURE EMAIL'}</p>
          <div className="flex items-center gap-4 mt-2 flex-wrap">
            <Metric small label="Jobs" value={cleaner.totalJobs || 0} />
            <Metric small label="Rating" value={`${cleaner.rating || 0} ★`} />
            <div className="flex gap-1">
               {cleaner.verification?.policeCheck && <Badge className="bg-emerald-500/10 text-emerald-400 text-[8px] px-1 py-0 border-none font-black">POLICE</Badge>}
               {cleaner.verification?.idVerified && <Badge className="bg-blue-500/10 text-blue-400 text-[8px] px-1 py-0 border-none font-black">ID</Badge>}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3 self-end lg:self-center flex-shrink-0">
        {isPending ? (
          <>
            <button onClick={onReject} className="h-12 px-6 rounded-xl text-rose-500 hover:bg-rose-500/10 font-black uppercase tracking-widest text-[10px] transition-all">
              Deny Protocol
            </button>
            <button onClick={onApprove} className="h-12 px-8 rounded-xl bg-emerald-500 text-slate-950 hover:bg-emerald-400 font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-500/20 transition-all">
              Authorize Agent
            </button>
          </>
        ) : (
          <button className="h-12 px-6 rounded-xl text-slate-500 hover:bg-white/5 font-black uppercase tracking-widest text-[10px] transition-all">
            Manage Profile
          </button>
        )}
      </div>
    </div>
  )
}

function Metric({ label, value, small }: { label: string; value: string | number; small?: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className="text-[10px] font-black uppercase text-slate-600 tracking-tighter">{label}</span>
      <span className="text-sm font-black text-slate-200">{value}</span>
    </div>
  )
}
