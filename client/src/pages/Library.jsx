import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Library as LibraryIcon, BookOpen, ShoppingBag, Search, Lock } from 'lucide-react'
import { useApp } from '../context/AppContext'
import DocumentCard, { DocumentCardSkeleton } from '../components/ui/DocumentCard'
import axios from 'axios'

export default function Library() {
  const { user, requireAuth, openAuth } = useApp()
  const [library, setLibrary]   = useState([])
  const [purchases, setPurchases] = useState([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('library')
  const [search, setSearch]     = useState('')

  useEffect(() => {
    if (!user) return
    const load = async () => {
      try {
        const [lib, purch] = await Promise.all([
          axios.get('/api/library'),
          axios.get('/api/purchases/mine'),
        ])
        if (lib.data.success)   setLibrary(lib.data.library)
        if (purch.data.success) setPurchases(purch.data.purchases)
      } catch {}
      setLoading(false)
    }
    load()
  }, [user])

  if (!user) return (
    <div className="max-w-xl mx-auto px-4 py-20 text-center">
      <LibraryIcon className="w-16 h-16 text-brand-400/40 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-white mb-2">Votre bibliothèque personnelle</h2>
      <p className="text-white/40 mb-6">Connectez-vous pour accéder à vos documents sauvegardés et vos achats.</p>
      <button onClick={() => openAuth('login')} className="btn-brand px-8 py-3">Se connecter</button>
    </div>
  )

  const filtered = (tab === 'library' ? library : purchases.map(p => p.documentId)).filter(d =>
    !search || d?.title?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-10">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <LibraryIcon className="w-8 h-8 text-brand-400" />
            Ma bibliothèque
          </h1>
          <p className="text-white/40 mt-1 text-sm">{library.length} document{library.length !== 1 ? 's' : ''} dans votre collection</p>
        </div>
        {/* Search */}
        <div className="relative w-full sm:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="input-dark pl-9 h-10 w-full"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-8">
        {[
          { id: 'library',  label: 'Bibliothèque', icon: BookOpen,    count: library.length },
          { id: 'purchases', label: 'Achats',       icon: ShoppingBag, count: purchases.length },
        ].map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium border transition-all ${
              tab === t.id
                ? 'bg-brand-500/15 border-brand-500/30 text-brand-300'
                : 'border-white/10 text-white/50 hover:text-white hover:border-white/20'
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${tab === t.id ? 'bg-brand-500/30 text-brand-300' : 'bg-white/8 text-white/40'}`}>{t.count}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array(6).fill(0).map((_, i) => <DocumentCardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-5xl mb-4">📚</div>
          <h3 className="text-xl font-semibold text-white mb-2">
            {tab === 'library' ? 'Bibliothèque vide' : 'Aucun achat'}
          </h3>
          <p className="text-white/40 text-sm mb-6">
            {tab === 'library'
              ? 'Explorez et ajoutez des documents à votre bibliothèque'
              : 'Achetez des documents premium pour les retrouver ici'}
          </p>
          <Link to="/explore" className="btn-brand">Explorer les documents</Link>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {filtered.filter(Boolean).map((doc, i) => (
            <DocumentCard key={doc._id} doc={doc} index={i} compact />
          ))}
        </div>
      )}

      {/* Purchases history */}
      {tab === 'purchases' && purchases.length > 0 && (
        <div className="mt-10">
          <h3 className="text-lg font-semibold text-white mb-4">Historique des achats</h3>
          <div className="glass-card overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/[0.06]">
                  {['Document', 'Montant', 'Date', 'Statut'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {purchases.map((p, i) => (
                  <tr key={p._id} className="border-b border-white/[0.04] hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3">
                      <Link to={`/doc/${p.documentId?._id}`} className="text-sm font-medium text-white/80 hover:text-white transition-colors line-clamp-1">
                        {p.documentId?.title || 'Document'}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-brand-400">{p.amount}€</td>
                    <td className="px-4 py-3 text-sm text-white/40">{new Date(p.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td className="px-4 py-3">
                      <span className="badge-green">Complété</span>
                    </td>
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
