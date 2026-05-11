import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { FileText, Plus, Eye, Download, Star, Edit, Trash2, MoreVertical, Lock, Unlock, Loader2 } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function MyDocuments() {
  const [docs, setDocs]     = useState([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState(null)

  useEffect(() => {
    axios.get('/api/documents/mine').then(r => {
      if (r.data.success) setDocs(r.data.documents)
      setLoading(false)
    }).catch(() => setLoading(false))
  }, [])

  const handleDelete = async (id) => {
    if (!confirm('Supprimer ce document ?')) return
    setDeleting(id)
    try {
      const { data } = await axios.delete(`/api/documents/${id}`)
      if (data.success) { setDocs(d => d.filter(x => x._id !== id)); toast.success('Document supprimé') }
    } catch {}
    setDeleting(null)
  }

  if (loading) return (
    <div className="px-4 md:px-8 py-6">
      <div className="space-y-3">{Array(4).fill(0).map((_, i) => <div key={i} className="shimmer h-20 rounded-2xl" />)}</div>
    </div>
  )

  return (
    <div className="px-4 md:px-8 py-6">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold text-white">Mes documents</h1>
        <Link to="/author/upload" className="btn-brand">
          <Plus className="w-4 h-4" />
          Nouveau
        </Link>
      </div>

      {docs.length === 0 ? (
        <div className="text-center py-20">
          <FileText className="w-16 h-16 text-white/10 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">Aucun document publié</h3>
          <p className="text-white/40 text-sm mb-6">Publiez votre premier document et commencez à partager votre expertise.</p>
          <Link to="/author/upload" className="btn-brand">Publier maintenant</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {docs.map((doc, i) => (
            <motion.div key={doc._id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-4 flex items-center gap-4">
              {/* Cover */}
              <div className="w-12 h-14 rounded-xl overflow-hidden bg-dark-600 flex-shrink-0">
                {doc.coverUrl ? <img src={doc.coverUrl} alt="" className="w-full h-full object-cover" /> : <FileText className="w-5 h-5 text-brand-400 m-auto mt-4" />}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link to={`/doc/${doc._id}`} className="text-sm font-semibold text-white hover:text-brand-300 transition-colors truncate">
                    {doc.title}
                  </Link>
                  <span className={`badge text-xs ${doc.status === 'published' ? 'badge-green' : doc.status === 'suspended' ? 'badge-red' : 'badge-amber'}`}>
                    {doc.status === 'published' ? 'Publié' : doc.status === 'suspended' ? 'Suspendu' : 'Brouillon'}
                  </span>
                  {doc.isFree ? <span className="badge-green text-xs">Gratuit</span> : <span className="badge-brand text-xs">{doc.price}€</span>}
                </div>
                <div className="flex items-center gap-4 mt-1 text-xs text-white/30">
                  <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{doc.views}</span>
                  <span className="flex items-center gap-1"><Download className="w-3 h-3" />{doc.downloads}</span>
                  {doc.rating > 0 && <span className="flex items-center gap-1"><Star className="w-3 h-3 fill-amber-400 text-amber-400" />{doc.rating} ({doc.numReviews})</span>}
                  <span>{new Date(doc.createdAt).toLocaleDateString('fr-FR')}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <button
                  onClick={() => handleDelete(doc._id)}
                  disabled={deleting === doc._id}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
                >
                  {deleting === doc._id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}
