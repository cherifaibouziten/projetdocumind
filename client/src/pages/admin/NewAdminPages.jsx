/**
 * Admin Orders, Promotions, Disputes — Rewritten with correct API routes
 * Fix: /orders/all, /disputes/all, /promos (not /orders/admin, /disputes/admin)
 */
import { useEffect, useState } from 'react'
import { Package, Tag, AlertTriangle, CheckCircle, Plus, X, Eye, Edit2, Trash2, ToggleLeft, ToggleRight } from 'lucide-react'
import toast from 'react-hot-toast'
import axios from 'axios'

// All calls use axios (global, already has baseURL http://localhost:4000)
// and include /api/ prefix

// ─── ADMIN ORDERS ───────────────────────────────────────────────────────────
export function AdminOrders() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState({})

  useEffect(() => {
    axios.get('/api/orders/all')  // FIXED: was /orders/admin
      .then(r => { setOrders(r.data.orders || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [])

  const toggle = id => setExpanded(e => ({ ...e, [id]: !e[id] }))

  const STATUS_COLOR = {
    paid:      'text-green-400 bg-green-500/10 border-green-500/30',
    pending:   'text-yellow-400 bg-yellow-500/10 border-yellow-500/30',
    cancelled: 'text-red-400 bg-red-500/10 border-red-500/30',
    refunded:  'text-gray-400 bg-gray-500/10 border-gray-500/30',
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <Package className="w-6 h-6 text-brand-400" /> Commandes ({orders.length})
      </h2>

      {loading ? (
        <div className="flex items-center gap-3 text-white/40 py-10">
          <div className="w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
          Chargement...
        </div>
      ) : orders.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Package className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/40">Aucune commande pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map(o => (
            <div key={o._id} className="glass-card overflow-hidden">
              <div className="flex items-center gap-4 p-4 cursor-pointer hover:bg-white/2" onClick={() => toggle(o._id)}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-brand-400 font-mono text-xs font-bold">#{o._id.slice(-8).toUpperCase()}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS_COLOR[o.status] || 'text-white/40'}`}>
                      {o.status === 'paid' ? '✅ Payé' : o.status === 'cancelled' ? '❌ Annulé' : o.status === 'refunded' ? '↩ Remboursé' : '⏳ En attente'}
                    </span>
                  </div>
                  <p className="text-sm text-white/70">{o.userId?.name} · {o.userId?.email}</p>
                  <p className="text-xs text-white/30">{o.items?.length} document(s) · {new Date(o.createdAt).toLocaleDateString('fr-FR')}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-white">{o.finalAmount?.toFixed(2)}€</p>
                  {o.discount > 0 && <p className="text-xs text-green-400">-{o.discount.toFixed(2)}€ remise</p>}
                </div>
              </div>
              {expanded[o._id] && (
                <div className="border-t border-white/[0.06] px-4 py-3 bg-dark-900/30">
                  <p className="text-xs text-white/40 mb-2 uppercase tracking-wider">Documents</p>
                  <div className="space-y-2">
                    {o.items?.map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-8 h-10 bg-dark-600 rounded overflow-hidden flex-shrink-0">
                          {item.coverUrl && <img src={item.coverUrl} alt="" className="w-full h-full object-cover" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-white/80 truncate">{item.title}</p>
                          <p className="text-xs text-white/30">{item.price}€</p>
                        </div>
                      </div>
                    ))}
                  </div>
                  {o.promoCode && <p className="text-xs text-brand-400 mt-2">Code promo: {o.promoCode}</p>}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ─── ADMIN PROMOTIONS ─────────────────────────────────────────────────────────
export function AdminPromotions() {
  const [promos, setPromos] = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({ code: '', discount: 10, minAmount: 0, maxUses: 100, description: '', expiresAt: '' })
  const [saving, setSaving] = useState(false)

  const load = () => {
    axios.get('/api/promos')
      .then(r => { setPromos(r.data.promotions || []); setLoading(false) })
      .catch(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditId(null)
    setForm({ code: '', discount: 10, minAmount: 0, maxUses: 100, description: '', expiresAt: '' })
    setShowForm(true)
  }
  const openEdit = (p) => {
    setEditId(p._id)
    setForm({ code: p.code, discount: p.discount, minAmount: p.minAmount || 0, maxUses: p.maxUses, description: p.description || '', expiresAt: p.expiresAt ? p.expiresAt.split('T')[0] : '' })
    setShowForm(true)
  }

  const submit = async (e) => {
    e.preventDefault()
    if (!form.code.trim()) { toast.error('Code requis'); return }
    setSaving(true)
    try {
      const payload = { ...form, code: form.code.toUpperCase(), discount: Number(form.discount), minAmount: Number(form.minAmount), maxUses: Number(form.maxUses) }
      const r = editId
        ? await axios.put(`/api/promos/${editId}`, payload)
        : await axios.post('/api/promos', payload)
      if (r.data.success) {
        toast.success(editId ? 'Promotion mise à jour !' : 'Promotion créée !')
        setShowForm(false); setEditId(null)
        setForm({ code: '', discount: 10, minAmount: 0, maxUses: 100, description: '', expiresAt: '' })
        load()
      } else toast.error(r.data.message)
    } catch (e) { toast.error(e.message) }
    setSaving(false)
  }

  const toggle = async (id) => {
    await axios.patch(`/api/promos/${id}/toggle`)
    load()
  }
  const del = async (id) => {
    if (!window.confirm('Supprimer cette promotion ?')) return
    await axios.delete(`/api/promos/${id}`)
    toast.success('Promotion supprimée')
    load()
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Tag className="w-6 h-6 text-brand-400" /> Promotions
        </h2>
        <button onClick={openCreate} className="btn-brand text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nouvelle promo
        </button>
      </div>

      {/* Form modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white text-lg">{editId ? 'Modifier la promotion' : 'Nouvelle promotion'}</h3>
              <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/50 mb-1.5">Code promo *</label>
                <input value={form.code} onChange={e => setForm(f => ({ ...f, code: e.target.value.toUpperCase() }))}
                  placeholder="PROMO20" className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono uppercase focus:outline-none focus:border-brand-500/50" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/50 mb-1.5">Réduction (%)</label>
                  <input type="number" min={1} max={100} value={form.discount} onChange={e => setForm(f => ({ ...f, discount: e.target.value }))}
                    className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-500/50" />
                </div>
                <div>
                  <label className="block text-sm text-white/50 mb-1.5">Montant min (€)</label>
                  <input type="number" min={0} value={form.minAmount} onChange={e => setForm(f => ({ ...f, minAmount: e.target.value }))}
                    className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-500/50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-white/50 mb-1.5">Utilisations max</label>
                  <input type="number" min={1} value={form.maxUses} onChange={e => setForm(f => ({ ...f, maxUses: e.target.value }))}
                    className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-500/50" />
                </div>
                <div>
                  <label className="block text-sm text-white/50 mb-1.5">Expiration</label>
                  <input type="date" value={form.expiresAt} onChange={e => setForm(f => ({ ...f, expiresAt: e.target.value }))}
                    className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-500/50" />
                </div>
              </div>
              <div>
                <label className="block text-sm text-white/50 mb-1.5">Description</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Réduction de bienvenue..." className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-500/50" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={submit} disabled={saving} className="flex-1 btn-brand py-3 disabled:opacity-50">
                  {saving ? 'Enregistrement...' : editId ? 'Mettre à jour' : 'Créer la promotion'}
                </button>
                <button onClick={() => setShowForm(false)} className="px-4 py-3 rounded-xl border border-white/10 text-white/50 hover:text-white transition-colors">
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-3 text-white/40 py-10">
          <div className="w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
          Chargement...
        </div>
      ) : promos.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <Tag className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/40 mb-4">Aucune promotion créée.</p>
          <button onClick={openCreate} className="btn-brand text-sm">Créer la première promotion</button>
        </div>
      ) : (
        <div className="glass-card overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/[0.06] text-white/30 text-xs uppercase tracking-wider">
                <th className="text-left p-4">Code</th>
                <th className="text-left p-4">Réduction</th>
                <th className="text-left p-4">Utilisations</th>
                <th className="text-left p-4">Min. achat</th>
                <th className="text-left p-4">Expiration</th>
                <th className="text-left p-4">Statut</th>
                <th className="text-left p-4">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {promos.map(p => (
                <tr key={p._id} className="hover:bg-white/[0.02]">
                  <td className="p-4 font-mono font-bold text-brand-400">{p.code}</td>
                  <td className="p-4 text-white font-semibold">{p.discount}%</td>
                  <td className="p-4 text-white/60">{p.usedCount || 0}/{p.maxUses}</td>
                  <td className="p-4 text-white/60">{p.minAmount > 0 ? `${p.minAmount}€` : '—'}</td>
                  <td className="p-4 text-white/40 text-xs">{p.expiresAt ? new Date(p.expiresAt).toLocaleDateString('fr-FR') : '∞'}</td>
                  <td className="p-4">
                    <span className={`text-xs font-semibold ${p.isActive ? 'text-green-400' : 'text-white/30'}`}>
                      {p.isActive ? '● Actif' : '○ Inactif'}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-1">
                      <button onClick={() => openEdit(p)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors" title="Modifier">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => toggle(p._id)} className="p-1.5 rounded-lg hover:bg-white/10 text-white/40 hover:text-white transition-colors" title={p.isActive ? 'Désactiver' : 'Activer'}>
                        {p.isActive ? <ToggleRight className="w-4 h-4 text-green-400" /> : <ToggleLeft className="w-4 h-4" />}
                      </button>
                      <button onClick={() => del(p._id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-white/40 hover:text-red-400 transition-colors" title="Supprimer">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ─── ADMIN DISPUTES ───────────────────────────────────────────────────────────
export function AdminDisputes() {
  const [disputes, setDisputes] = useState([])
  const [loading, setLoading] = useState(true)
  const [responses, setResponses] = useState({})
  const [expanded, setExpanded] = useState({})

  const load = () => {
    axios.get('/api/disputes/all')  // FIXED: was /disputes/admin
      .then(r => { setDisputes(r.data.disputes || []); setLoading(false) })
      .catch(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const resolve = async (id, status) => {
    const r = await axios.put(`/api/disputes/${id}`, { status, resolution: responses[id] || '' })
    if (r.data.success) { toast.success('Statut mis à jour'); load() }
    else toast.error(r.data.message)
  }

  const STATUS = {
    open:      { label: '🔴 Ouvert',    cls: 'text-red-400 bg-red-500/10 border-red-500/30' },
    in_review: { label: '🟡 En cours',  cls: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' },
    resolved:  { label: '🟢 Résolu',    cls: 'text-green-400 bg-green-500/10 border-green-500/30' },
    closed:    { label: '⚫ Clôturé',   cls: 'text-white/30 bg-white/5 border-white/10' },
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-2">
        <AlertTriangle className="w-6 h-6 text-amber-400" /> Signalements ({disputes.length})
      </h2>

      {loading ? (
        <div className="flex items-center gap-3 text-white/40 py-10">
          <div className="w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
          Chargement...
        </div>
      ) : disputes.length === 0 ? (
        <div className="glass-card p-12 text-center">
          <AlertTriangle className="w-12 h-12 text-white/20 mx-auto mb-3" />
          <p className="text-white/40">Aucun signalement pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {disputes.map(d => (
            <div key={d._id} className="glass-card overflow-hidden">
              <div className="p-5">
                <div className="flex items-start justify-between gap-4 mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-brand-400 font-mono text-xs font-bold">#{d._id.slice(-6).toUpperCase()}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full border ${STATUS[d.status]?.cls || ''}`}>
                        {STATUS[d.status]?.label || d.status}
                      </span>
                    </div>
                    <p className="font-semibold text-white text-sm">{d.reason}</p>
                    <p className="text-xs text-white/40 mt-0.5">
                      {d.clientId?.name} · {d.clientId?.email} · {new Date(d.createdAt).toLocaleDateString('fr-FR')}
                    </p>
                    {d.documentId && <p className="text-xs text-brand-400 mt-1">📄 {d.documentId.title}</p>}
                  </div>
                  <span className="text-xs text-white/30 capitalize">{d.type}</span>
                </div>
                <p className="text-white/60 text-sm mb-4 bg-dark-900/40 p-3 rounded-xl">{d.description}</p>

                {(d.status === 'open' || d.status === 'in_review') && (
                  <div className="space-y-3">
                    <input
                      className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-2.5 text-white/80 placeholder-white/30 text-sm focus:outline-none focus:border-brand-500/50"
                      placeholder="Réponse / résolution..."
                      value={responses[d._id] || ''}
                      onChange={e => setResponses(r => ({ ...r, [d._id]: e.target.value }))}
                    />
                    <div className="flex gap-2 flex-wrap">
                      <button onClick={() => resolve(d._id, 'resolved')}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 text-sm hover:bg-green-500/30 transition-colors">
                        <CheckCircle className="w-3.5 h-3.5" /> Résoudre
                      </button>
                      <button onClick={() => resolve(d._id, 'in_review')}
                        className="px-3 py-2 rounded-xl bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 text-sm hover:bg-yellow-500/20 transition-colors">
                        En cours
                      </button>
                      <button onClick={() => resolve(d._id, 'closed')}
                        className="px-3 py-2 rounded-xl border border-white/10 text-white/40 text-sm hover:text-white hover:bg-white/5 transition-colors">
                        Clôturer
                      </button>
                    </div>
                  </div>
                )}
                {d.resolution && (
                  <div className="mt-3 p-3 bg-green-500/5 border border-green-500/20 rounded-xl">
                    <p className="text-xs text-green-400 font-medium mb-1">Résolution:</p>
                    <p className="text-sm text-white/60">{d.resolution}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
