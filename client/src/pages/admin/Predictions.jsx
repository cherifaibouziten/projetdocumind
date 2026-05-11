/**
 * AdminPredictions — Prédictions ML des ventes de documents
 * Régression linéaire + saisonnalité, inspiré d'Electroshop
 */
import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { TrendingUp, TrendingDown, Minus, Brain, ArrowLeft, BarChart2, Zap } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip,
  ResponsiveContainer, CartesianGrid, Legend
} from 'recharts'

const TREND = {
  '📈 En hausse': { icon: TrendingUp,   cls: 'text-green-400 bg-green-500/10 border-green-500/20' },
  '📉 En baisse': { icon: TrendingDown, cls: 'text-red-400 bg-red-500/10 border-red-500/20' },
  '➡️ Stable':    { icon: Minus,        cls: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20' },
}

const Tooltip_ = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-dark-700 border border-white/10 rounded-xl px-3 py-2 text-xs">
      <p className="text-white/60 mb-1 font-medium">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.fill || p.color || '#7c6bfa' }}>
          {p.name}: {p.value?.toLocaleString('fr-FR')}
        </p>
      ))}
    </div>
  )
}

export default function AdminPredictions() {
  const { axios } = useApp()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [selectedDoc, setSelectedDoc] = useState(0)

  useEffect(() => {
    axios.get('/api/dashboard/forecast')
      .then(({ data: d }) => { if (d.success) setData(d) })
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-24 gap-3">
      <Brain className="w-10 h-10 text-brand-400 animate-pulse" />
      <p className="text-white/40 text-sm">Analyse IA en cours...</p>
    </div>
  )
  if (!data) return (
    <div className="p-6 text-center">
      <p className="text-white/40">Erreur de chargement des prédictions.</p>
      <p className="text-white/20 text-sm mt-1">Assurez-vous qu'il y a des données d'achat dans la base.</p>
    </div>
  )

  const { topDocuments = [], monthlyRevenue = [], predictedRevenue = [] } = data

  const now = new Date()
  const MONTHS = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
  const predMonths = [1,2,3].map(i => MONTHS[(now.getMonth() + i) % 12])

  const revenueChart = [
    ...monthlyRevenue.slice(-6).map(m => ({ month: m.month, 'Réel': m.revenue, 'Prédit': undefined })),
    ...predictedRevenue.map((v, i) => ({ month: predMonths[i], 'Réel': undefined, 'Prédit': v })),
  ]

  const doc = topDocuments[selectedDoc]
  const docChart = doc ? [
    ...(doc.historicalMonths || []).map((m, i) => ({
      month: `M-${(doc.historicalMonths.length - 1 - i)}`,
      'Ventes': m.count,
      'Prédit': undefined,
    })),
    ...(doc.predictions || []).map((v, i) => ({ month: `M+${i+1}`, 'Ventes': undefined, 'Prédit': v })),
  ] : []

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link to="/admin" className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white/70 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Brain className="w-5 h-5 text-brand-400" />
            <h1 className="text-2xl font-bold text-white">Prédictions ML des ventes</h1>
          </div>
          <p className="text-white/40 text-sm">Régression linéaire + analyse saisonnière sur données réelles</p>
        </div>
      </div>

      {/* Revenue Forecast */}
      <div className="glass-card p-6 mb-6">
        <h2 className="font-semibold text-white mb-1 flex items-center gap-2">
          <BarChart2 className="w-5 h-5 text-brand-400" /> Revenus mensuels + prévisions 3 mois
        </h2>
        <p className="text-white/30 text-xs mb-4">Barres bleues = historique. Barres violettes = prédiction IA.</p>
        {revenueChart.length === 0 ? (
          <div className="text-center py-8 text-white/30 text-sm">
            Pas assez de données d'achat pour les prévisions. Effectuez des ventes d'abord.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={revenueChart}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} />
              <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 11 }} />
              <Tooltip content={<Tooltip_ />} />
              <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: 12 }} />
              <Bar dataKey="Réel"  fill="#7c6bfa" radius={[4,4,0,0]} />
              <Bar dataKey="Prédit" fill="#a855f7" radius={[4,4,0,0]} opacity={0.7} />
            </BarChart>
          </ResponsiveContainer>
        )}
        {predictedRevenue.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mt-4">
            {predictedRevenue.map((v, i) => (
              <div key={i} className="glass-card p-4 text-center border-brand-500/20">
                <div className="text-xs text-white/40 mb-1">{predMonths[i]}</div>
                <div className="text-xl font-bold text-brand-400">{v.toLocaleString('fr-FR')}€</div>
                <div className="text-xs text-white/30">Revenus prédits</div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top documents predictions */}
      {topDocuments.length > 0 && (
        <div className="glass-card p-6 mb-6">
          <h2 className="font-semibold text-white mb-4 flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" /> Prédictions par document (Top {topDocuments.length})
          </h2>
          {/* Document selector */}
          <div className="flex gap-2 mb-6 flex-wrap">
            {topDocuments.map((d, i) => (
              <button key={d.documentId || i} onClick={() => setSelectedDoc(i)}
                className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all truncate max-w-[140px] border ${
                  selectedDoc === i ? 'bg-brand-500/20 border-brand-500/40 text-brand-400' : 'border-white/10 text-white/50 hover:border-white/20'
                }`}>
                {d.title?.substring(0, 20)}...
              </button>
            ))}
          </div>
          {doc && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-medium text-white/70 truncate flex-1 mr-4">{doc.title}</p>
                  {doc.trend && (
                    <span className={`text-xs px-2 py-1 rounded-lg border flex-shrink-0 ${TREND[doc.trend]?.cls || 'text-white/40 bg-white/5 border-white/10'}`}>
                      {doc.trend}
                    </span>
                  )}
                </div>
                <ResponsiveContainer width="100%" height={160}>
                  <LineChart data={docChart}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis dataKey="month" tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
                    <YAxis tick={{ fill: 'rgba(255,255,255,0.3)', fontSize: 10 }} />
                    <Tooltip content={<Tooltip_ />} />
                    <Legend wrapperStyle={{ color: 'rgba(255,255,255,0.5)', fontSize: 11 }} />
                    <Line type="monotone" dataKey="Ventes"  stroke="#7c6bfa" strokeWidth={2} dot={{ r: 3 }} connectNulls={false} />
                    <Line type="monotone" dataKey="Prédit"  stroke="#a855f7" strokeWidth={2} strokeDasharray="5 5" dot={{ r: 4 }} connectNulls={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                <div className="glass-card p-4">
                  <p className="text-xs text-white/40 mb-1">Ventes historiques totales</p>
                  <p className="text-2xl font-bold text-white">{doc.totalSales || 0}</p>
                </div>
                <div className="glass-card p-4 border-brand-500/20">
                  <p className="text-xs text-white/40 mb-1">Prédiction mois prochain</p>
                  <p className="text-2xl font-bold text-brand-400">{doc.predictions?.[0] ?? '—'} ventes</p>
                </div>
                {doc.predictions?.length > 1 && (
                  <div className="glass-card p-4">
                    <p className="text-xs text-white/40 mb-2">Prévisions 3 mois</p>
                    <div className="flex gap-2">
                      {doc.predictions.map((v, i) => (
                        <div key={i} className="flex-1 text-center">
                          <div className="text-sm font-bold text-white">{v}</div>
                          <div className="text-xs text-white/30">M+{i+1}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

              </div>
            </div>
          )}
        </div>
      )}

      {topDocuments.length === 0 && monthlyRevenue.length === 0 && (
        <div className="glass-card p-12 text-center">
          <Brain className="w-12 h-12 text-brand-400/30 mx-auto mb-4" />
          <h3 className="font-semibold text-white mb-2">Pas encore de données</h3>
          <p className="text-white/40 text-sm">Les prédictions ML apparaîtront dès que des achats auront été effectués sur la plateforme.</p>
        </div>
      )}
    </div>
  )
}
