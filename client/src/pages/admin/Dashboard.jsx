import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Users, FileText, DollarSign, ShoppingBag, TrendingUp, Activity } from 'lucide-react'
import axios from 'axios'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts'

export default function AdminDashboard() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/dashboard/admin').then(r => {
      if (r.data.success) setData(r.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="px-4 md:px-8 py-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array(4).fill(0).map((_, i) => <div key={i} className="shimmer h-28 rounded-2xl" />)}</div>
    </div>
  )

  const stats = data?.stats || {}
  const statCards = [
    { icon: Users,       label: 'Utilisateurs',  value: stats.userCount || 0,              color: '#7c6bfa', change: '+12%' },
    { icon: FileText,    label: 'Documents',      value: stats.docCount || 0,               color: '#a855f7', change: '+8%' },
    { icon: ShoppingBag, label: 'Ventes',         value: stats.purchaseCount || 0,          color: '#ec4899', change: '+23%' },
    { icon: DollarSign,  label: 'Revenus',        value: `${(stats.revenue || 0).toFixed(0)}€`, color: '#10b981', change: '+18%' },
  ]

  const chartData = Array.from({ length: 12 }, (_, i) => ({
    name: ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc'][i],
    documents: Math.floor(Math.random() * 40) + 5,
    ventes: Math.floor(Math.random() * 25) + 2,
    revenus: Math.floor(Math.random() * 500) + 50,
  }))

  return (
    <div className="px-4 md:px-8 py-6 space-y-8">
      <h1 className="text-2xl font-bold text-white">Dashboard Administrateur</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(({ icon: Icon, label, value, color, change }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}22`, border: `1px solid ${color}44` }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <span className="text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full">{change}</span>
            </div>
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-xs text-white/40 mt-0.5">{label}</div>
          </motion.div>
        ))}
      </div>

      {/* Alerts */}
      {data?.stats?.pendingAuthors > 0 && (
        <div className="glass-card p-4 border-yellow-500/20 flex items-center gap-3 -mt-4">
          <span className="text-yellow-400 text-lg">⚠️</span>
          <p className="text-white/70 text-sm flex-1">
            <span className="font-semibold text-yellow-300">{data.stats.pendingAuthors} demande(s)</span> auteur en attente d'examen.
          </p>
          <a href="/admin/authors" className="text-xs text-brand-400 hover:text-brand-300 font-medium transition-colors">Voir →</a>
        </div>
      )}

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="glass-card p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-brand-400" />Documents publiés</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="gDoc" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#7c6bfa" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#7c6bfa" stopOpacity={0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'rgba(18,18,31,0.95)', border: '1px solid rgba(124,107,250,0.2)', borderRadius: 12, color: '#fff' }} />
              <Area type="monotone" dataKey="documents" stroke="#7c6bfa" strokeWidth={2} fill="url(#gDoc)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="glass-card p-6">
          <h3 className="font-semibold text-white mb-4 flex items-center gap-2"><DollarSign className="w-5 h-5 text-emerald-400" />Revenus mensuels</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData}>
              <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={{ background: 'rgba(18,18,31,0.95)', border: '1px solid rgba(124,107,250,0.2)', borderRadius: 12, color: '#fff' }} />
              <Bar dataKey="revenus" fill="#10b981" radius={[4,4,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent data */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent users */}
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-white/[0.06]">
            <h3 className="font-semibold text-white flex items-center gap-2"><Users className="w-4 h-4 text-brand-400" />Nouveaux utilisateurs</h3>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {data?.recentUsers?.map(u => (
              <div key={u._id} className="flex items-center gap-3 p-3 hover:bg-white/2 transition-colors">
                <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center flex-shrink-0 text-xs font-bold">{u.name?.[0]}</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/80 truncate">{u.name}</p>
                  <p className="text-xs text-white/30 truncate">{u.email}</p>
                </div>
                <span className={`badge text-xs ${u.role === 'admin' ? 'badge-red' : u.role === 'author' ? 'badge-brand' : 'bg-white/5 text-white/40 border-white/10'}`}>{u.role}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Recent docs */}
        <div className="glass-card overflow-hidden">
          <div className="p-4 border-b border-white/[0.06]">
            <h3 className="font-semibold text-white flex items-center gap-2"><FileText className="w-4 h-4 text-brand-400" />Documents récents</h3>
          </div>
          <div className="divide-y divide-white/[0.04]">
            {data?.recentDocs?.map(doc => (
              <div key={doc._id} className="flex items-center gap-3 p-3 hover:bg-white/2 transition-colors">
                <div className="w-8 h-10 rounded-lg overflow-hidden bg-dark-600 flex-shrink-0">
                  {doc.coverUrl ? <img src={doc.coverUrl} alt="" className="w-full h-full object-cover" /> : <FileText className="w-4 h-4 text-brand-400 m-auto mt-3" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/80 truncate">{doc.title}</p>
                  <p className="text-xs text-white/30">{doc.category} · {doc.isFree ? 'Gratuit' : `${doc.price}€`}</p>
                </div>
                <span className={`badge text-xs ${doc.status === 'published' ? 'badge-green' : 'badge-amber'}`}>{doc.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
