import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileText, Eye, Download, DollarSign, Star, TrendingUp, Plus } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import axios from 'axios'
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'

export default function AuthorDashboard() {
  const { user } = useApp()
  const [data, setData]     = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    axios.get('/api/dashboard/author').then(r => {
      if (r.data.success) setData(r.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  if (loading) return <div className="px-6 py-10"><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{Array(4).fill(0).map((_, i) => <div key={i} className="shimmer h-28 rounded-2xl" />)}</div></div>

  const stats = data?.stats || {}
  const statCards = [
    { icon: FileText,   label: 'Documents',   value: stats.docCount || 0,       color: '#7c6bfa' },
    { icon: Eye,        label: 'Vues totales', value: stats.totalViews || 0,    color: '#a855f7' },
    { icon: Download,   label: 'Téléchargements', value: stats.totalDownloads || 0, color: '#ec4899' },
    { icon: DollarSign, label: 'Revenus',      value: `${(stats.totalEarnings || 0).toFixed(2)}€`, color: '#10b981' },
  ]

  // Mock chart data
  const chartData = Array.from({ length: 7 }, (_, i) => ({
    name: ['Lun','Mar','Mer','Jeu','Ven','Sam','Dim'][i],
    vues: Math.floor(Math.random() * 200) + 20,
    téléchargements: Math.floor(Math.random() * 50) + 5,
  }))

  return (
    <div className="px-4 md:px-8 py-6 space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Tableau de bord auteur</h1>
        <Link to="/author/upload" className="btn-brand">
          <Plus className="w-4 h-4" />
          Nouveau document
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map(({ icon: Icon, label, value, color }, i) => (
          <motion.div key={label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="glass-card p-5">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${color}22`, border: `1px solid ${color}44` }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-xs text-white/40 mt-0.5">{label}</div>
          </motion.div>
        ))}
      </div>

      {/* Chart */}
      <div className="glass-card p-6">
        <h3 className="font-semibold text-white mb-6 flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-brand-400" />
          Activité des 7 derniers jours
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="gVues" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#7c6bfa" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#7c6bfa" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="name" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 12 }} axisLine={false} tickLine={false} />
            <Tooltip contentStyle={{ background: 'rgba(18,18,31,0.95)', border: '1px solid rgba(124,107,250,0.2)', borderRadius: 12, color: '#fff' }} />
            <Area type="monotone" dataKey="vues" stroke="#7c6bfa" strokeWidth={2} fill="url(#gVues)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Recent docs */}
      {data?.docs?.length > 0 && (
        <div>
          <h3 className="font-semibold text-white mb-4">Mes documents</h3>
          <div className="glass-card divide-y divide-white/[0.04]">
            {data.docs.slice(0, 5).map(doc => (
              <Link key={doc._id} to={`/doc/${doc._id}`} className="flex items-center gap-4 p-4 hover:bg-white/2 transition-colors">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-dark-600 flex-shrink-0">
                  {doc.coverUrl ? <img src={doc.coverUrl} alt="" className="w-full h-full object-cover" /> : <FileText className="w-5 h-5 text-brand-400 m-auto" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/80 truncate">{doc.title}</p>
                  <p className="text-xs text-white/30">{doc.views} vues · {doc.downloads} téléchargements</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-brand-400">{doc.isFree ? 'Gratuit' : `${doc.price}€`}</p>
                  {doc.rating > 0 && <div className="flex items-center gap-1 justify-end mt-0.5"><Star className="w-3 h-3 fill-amber-400 text-amber-400" /><span className="text-xs text-white/40">{doc.rating}</span></div>}
                </div>
              </Link>
            ))}
          </div>
          <div className="mt-3">
            <Link to="/author/documents" className="text-sm text-brand-400 hover:text-brand-300">Voir tous mes documents →</Link>
          </div>
        </div>
      )}
    </div>
  )
}
