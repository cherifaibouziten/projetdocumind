/**
 * My Orders — fixed: back button, error handling, correct API
 */
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { Package, ArrowLeft, ChevronDown, ChevronUp, BookOpen } from 'lucide-react'
import axios from 'axios'

const STATUS = {
  paid:      { label: '✅ Payé',       cls: 'text-green-400 bg-green-500/10 border-green-500/30' },
  pending:   { label: '⏳ En attente', cls: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' },
  cancelled: { label: '❌ Annulée',    cls: 'text-red-400 bg-red-500/10 border-red-500/30' },
  refunded:  { label: '↩ Remboursée', cls: 'text-white/40 bg-white/5 border-white/10' },
}

export default function MyOrders() {
  const { user } = useApp()
  const navigate = useNavigate()
  const [orders, setOrders]     = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [expanded, setExpanded] = useState({})

  useEffect(() => {
    if (!user) return
    axios.get('/api/orders/mine')
      .then(r => { setOrders(r.data.orders || []); setLoading(false) })
      .catch(e => { setError(e.message); setLoading(false) })
  }, [user])

  const toggle = id => setExpanded(e => ({ ...e, [id]: !e[id] }))

  if (!user) return (
    <div className="text-center py-20">
      <p className="text-white/50 mb-4">Vous devez être connecté.</p>
      <Link to="/" className="btn-brand">Accueil</Link>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white/70 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Package className="w-6 h-6 text-brand-400" /> Mes Commandes
        </h1>
      </div>

      {loading ? (
        <div className="flex items-center gap-3 text-white/40 py-10">
          <div className="w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
          Chargement...
        </div>
      ) : error ? (
        <div className="glass-card p-8 text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-brand text-sm">Réessayer</button>
        </div>
      ) : orders.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Package className="w-16 h-16 text-white/20 mx-auto mb-4" />
          <p className="text-white/40 mb-6">Aucune commande pour le moment.</p>
          <Link to="/explore" className="btn-brand">Explorer les documents</Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map(order => {
            const s = STATUS[order.status] || STATUS.pending
            return (
              <div key={order._id} className="glass-card overflow-hidden">
                <div className="flex items-center justify-between p-5 cursor-pointer hover:bg-white/[0.02]" onClick={() => toggle(order._id)}>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-brand-400 font-mono text-xs font-bold">#{order._id.slice(-8).toUpperCase()}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${s.cls}`}>{s.label}</span>
                    </div>
                    <p className="text-sm text-white/50">{new Date(order.createdAt).toLocaleDateString('fr-FR', { day:'numeric', month:'short', year:'numeric' })}</p>
                    <p className="text-xs text-white/30 mt-0.5">{order.items?.length} document(s)</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="text-right">
                      <p className="font-bold text-white">{order.finalAmount?.toFixed(2)}€</p>
                      {order.discount > 0 && <p className="text-xs text-green-400">-{order.discount.toFixed(2)}€</p>}
                    </div>
                    {expanded[order._id] ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
                  </div>
                </div>
                {expanded[order._id] && (
                  <div className="border-t border-white/[0.06] p-4 bg-dark-900/30">
                    <p className="text-xs text-white/40 uppercase tracking-wider mb-3">Documents inclus</p>
                    <div className="space-y-3">
                      {order.items?.map((item, i) => (
                        <Link key={i} to={`/doc/${item.documentId}`} className="flex items-center gap-3 hover:bg-white/5 p-2 rounded-xl transition-colors">
                          <div className="w-10 h-12 bg-dark-600 rounded-lg overflow-hidden flex-shrink-0">
                            {item.coverUrl
                              ? <img src={item.coverUrl} alt="" className="w-full h-full object-cover" />
                              : <BookOpen className="w-4 h-4 text-brand-400 m-3" />
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-white/80 truncate">{item.title}</p>
                            <p className="text-xs text-white/30">{item.price > 0 ? `${item.price}€` : 'Gratuit'}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                    {order.promoCode && <p className="text-xs text-brand-400 mt-3">Code promo utilisé: {order.promoCode}</p>}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
