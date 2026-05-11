import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, ShoppingBag, Heart, TrendingUp, Library, Sparkles, ArrowRight, Clock, User } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import DocumentCard from '../../components/ui/DocumentCard'
import axios from 'axios'

export default function ClientDashboard() {
  const { user, navigate } = useApp()
  const [data, setData]   = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) { navigate('/'); return }
    axios.get('/api/dashboard/client').then(r => {
      if (r.data.success) setData(r.data)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [user])

  if (!user) return null

  const stats = data ? [
    { icon: Library,     label: 'Bibliothèque',  value: data.libraryCount || 0,             color: '#7c6bfa' },
    { icon: ShoppingBag, label: 'Achats',         value: data.purchases?.length || 0,        color: '#a855f7' },
    { icon: Heart,       label: 'Favoris',        value: user.wishlist?.length || 0,          color: '#ec4899' },
    { icon: TrendingUp,  label: 'Docs lus',       value: data.libraryCount || 0,             color: '#10b981' },
  ] : []

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
      {/* Welcome */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl overflow-hidden bg-brand-gradient flex-shrink-0">
            {user.avatar
              ? <img src={user.avatar} alt="" className="w-full h-full object-cover" />
              : <span className="w-full h-full flex items-center justify-center text-xl font-bold">{user.name?.[0]}</span>
            }
          </div>
          <div>
            <p className="text-white/40 text-sm">Bon retour,</p>
            <h1 className="text-2xl font-bold text-white">{user.name} 👋</h1>
          </div>
        </div>
      </motion.div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {stats.map(({ icon: Icon, label, value, color }, i) => (
          <motion.div
            key={label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card p-5"
          >
            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: `${color}22`, border: `1px solid ${color}44` }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div className="text-2xl font-bold text-white">{value}</div>
            <div className="text-xs text-white/40 mt-0.5">{label}</div>
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
        {[
          { icon: BookOpen, label: 'Explorer', desc: 'Découvrir de nouveaux documents', href: '/explore', color: '#7c6bfa' },
          { icon: Library,  label: 'Bibliothèque', desc: 'Accéder à vos documents', href: '/library', color: '#a855f7' },
          { icon: User,     label: 'Profil', desc: 'Gérer votre compte', href: '/profile', color: '#ec4899' },
        ].map(({ icon: Icon, label, desc, href, color }) => (
          <Link key={href} to={href} className="glass-card-hover p-5 flex items-center gap-4">
            <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}22`, border: `1px solid ${color}44` }}>
              <Icon className="w-5 h-5" style={{ color }} />
            </div>
            <div>
              <p className="font-semibold text-white text-sm">{label}</p>
              <p className="text-xs text-white/40">{desc}</p>
            </div>
            <ArrowRight className="w-4 h-4 text-white/20 ml-auto" />
          </Link>
        ))}
      </div>

      {/* Recent purchases */}
      {data?.purchases?.length > 0 && (
        <div className="mb-10">
          <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-brand-400" />
            Achats récents
          </h2>
          <div className="glass-card divide-y divide-white/[0.04]">
            {data.purchases.slice(0, 5).map(p => (
              <div key={p._id} className="flex items-center gap-4 p-4 hover:bg-white/2 transition-colors">
                <div className="w-10 h-10 rounded-xl bg-dark-600 overflow-hidden flex-shrink-0">
                  {p.documentId?.coverUrl
                    ? <img src={p.documentId.coverUrl} alt="" className="w-full h-full object-cover" />
                    : <BookOpen className="w-5 h-5 text-brand-400 m-auto" />
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white/80 truncate">{p.documentId?.title}</p>
                  <p className="text-xs text-white/30">{new Date(p.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
                <span className="text-sm font-bold text-brand-400">{p.amount}€</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recommended docs */}
      {data?.recentDocs?.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-400" />
              Documents suggérés
            </h2>
            <Link to="/explore" className="text-sm text-brand-400 hover:text-brand-300">Voir tout →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {data.recentDocs.map((doc, i) => <DocumentCard key={doc._id} doc={doc} index={i} compact />)}
          </div>
        </div>
      )}

      {/* Become author CTA */}
      {user.role === 'reader' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-10 glass-card p-6 border-brand-500/20 flex items-center gap-4 flex-wrap"
        >
          <div className="w-12 h-12 rounded-2xl bg-brand-gradient flex items-center justify-center flex-shrink-0">
            <Sparkles className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-white">Partagez votre expertise</h3>
            <p className="text-sm text-white/40">Devenez auteur et gagnez jusqu'à 80% sur vos ventes de documents.</p>
          </div>
          <Link to="/become-author" className="btn-brand flex-shrink-0">Devenir auteur</Link>
        </motion.div>
      )}
    </div>
  )
}
