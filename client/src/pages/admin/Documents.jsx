import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileText, Search, Eye, Star, Trash2, CheckCircle, XCircle, Sparkles, Loader2 } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function AdminDocuments() {
  const [docs, setDocs]     = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [actioning, setActioning] = useState(null)

  useEffect(() => {
    axios.get('/api/admin/documents').then(r => { if (r.data.success) setDocs(r.data.documents); setLoading(false) })
  }, [])

  const moderate = async (id, updates) => {
    setActioning(id)
    const { data } = await axios.put(`/api/admin/documents/${id}`, updates)
    if (data.success) { setDocs(d => d.map(x => x._id === id ? data.document : x)); toast.success('Mis à jour') }
    setActioning(null)
  }

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce document ?')) return
    await axios.delete(`/api/documents/${id}`)
    setDocs(d => d.filter(x => x._id !== id))
    toast.success('Document supprimé')
  }

  const filtered = docs.filter(d => !search || d.title?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="px-4 md:px-8 py-6">
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2"><FileText className="w-7 h-7 text-brand-400" />Documents ({docs.length})</h1>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input type="text" placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="input-dark pl-9 h-10 w-full" />
        </div>
      </div>

      {loading ? <div className="shimmer h-64 rounded-2xl" /> : (
        <div className="space-y-3">
          {filtered.map((doc, i) => (
            <motion.div key={doc._id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.02 }} className="glass-card p-4 flex items-center gap-4">
              <div className="w-10 h-12 rounded-lg overflow-hidden bg-dark-600 flex-shrink-0">
                {doc.coverUrl ? <img src={doc.coverUrl} alt="" className="w-full h-full object-cover" /> : <FileText className="w-4 h-4 text-brand-400 m-auto mt-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link to={`/doc/${doc._id}`} className="text-sm font-semibold text-white hover:text-brand-300 transition-colors truncate">{doc.title}</Link>
                  <span className={`badge text-xs ${doc.status === 'published' ? 'badge-green' : doc.status === 'suspended' ? 'badge-red' : 'badge-amber'}`}>{doc.status}</span>
                  {doc.isFeatured && <span className="badge-brand text-xs"><Sparkles className="w-2.5 h-2.5" />Vedette</span>}
                  {doc.isVerified && <span className="badge-green text-xs">✓ Vérifié</span>}
                </div>
                <p className="text-xs text-white/30 mt-0.5">
                  par {doc.authorId?.name || 'Inconnu'} · {doc.category} · {doc.isFree ? 'Gratuit' : `${doc.price}€`} · {doc.views} vues
                </p>
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <button onClick={() => moderate(doc._id, { isFeatured: !doc.isFeatured })} title="Vedette" className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${doc.isFeatured ? 'text-brand-400 bg-brand-500/15' : 'text-white/30 hover:text-brand-400 hover:bg-brand-500/10'}`}>
                  <Sparkles className="w-4 h-4" />
                </button>
                <button onClick={() => moderate(doc._id, { isVerified: !doc.isVerified })} title="Vérifier" className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${doc.isVerified ? 'text-emerald-400 bg-emerald-500/15' : 'text-white/30 hover:text-emerald-400 hover:bg-emerald-500/10'}`}>
                  <CheckCircle className="w-4 h-4" />
                </button>
                <button onClick={() => moderate(doc._id, { status: doc.status === 'suspended' ? 'published' : 'suspended' })} title="Suspendre/Publier" className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${doc.status === 'suspended' ? 'text-amber-400 bg-amber-500/15' : 'text-white/30 hover:text-amber-400 hover:bg-amber-500/10'}`}>
                  <XCircle className="w-4 h-4" />
                </button>
                <button onClick={() => handleDelete(doc._id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
