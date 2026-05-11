/**
 * My Disputes — fixed: back button, error handling, correct axios, non-blocking loading
 */
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../../context/AppContext'
import { AlertTriangle, ArrowLeft, Plus, BookOpen } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const STATUS = {
  open:      { label: '🔴 Ouvert',    cls: 'text-red-400 bg-red-500/10 border-red-500/30' },
  in_review: { label: '🟡 En cours',  cls: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30' },
  resolved:  { label: '🟢 Résolu',    cls: 'text-green-400 bg-green-500/10 border-green-500/30' },
  closed:    { label: '⚫ Clôturé',   cls: 'text-white/30 bg-white/5 border-white/10' },
}

export default function Disputes() {
  const { user } = useApp()
  const navigate = useNavigate()
  const [disputes, setDisputes] = useState([])
  const [loading, setLoading]   = useState(true)
  const [tab, setTab]           = useState('new')
  const [done, setDone]         = useState(false)
  const [form, setForm]         = useState({ type: 'document', reason: '', description: '' })
  const [saving, setSaving]     = useState(false)

  useEffect(() => {
    if (!user) return
    axios.get('/api/disputes/mine')
      .then(r => { setDisputes(r.data.disputes || []); setLoading(false) })
      .catch(() => setLoading(false))
  }, [user])

  const submit = async () => {
    if (!form.reason.trim() || !form.description.trim()) {
      toast.error('Motif et description requis')
      return
    }
    setSaving(true)
    try {
      const { data } = await axios.post('/api/disputes', form)
      if (data.success) {
        setDone(true)
        axios.get('/api/disputes/mine').then(r => setDisputes(r.data.disputes || []))
      } else {
        toast.error(data.message)
      }
    } catch (e) { toast.error(e.message) }
    setSaving(false)
  }

  if (!user) return (
    <div className="text-center py-20">
      <p className="text-white/50 mb-4">Vous devez être connecté.</p>
      <Link to="/" className="btn-brand">Accueil</Link>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white/70 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-400" /> Signalements
          </h1>
          <p className="text-white/40 text-sm mt-0.5">Signalez un problème avec un document ou une commande.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[['new', '✍️ Nouveau signalement'], ['history', `📋 Historique (${disputes.length})`]].map(([t, l]) => (
          <button key={t} onClick={() => { setTab(t); if (t === 'new') setDone(false) }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${tab === t ? 'bg-brand-gradient text-white' : 'glass-card text-white/50 hover:text-white'}`}>
            {l}
          </button>
        ))}
      </div>

      {tab === 'new' && (
        done ? (
          <div className="glass-card p-12 text-center">
            <div className="text-5xl mb-4">✅</div>
            <h3 className="font-bold text-white text-xl mb-2">Signalement envoyé !</h3>
            <p className="text-white/50 mb-6">Notre équipe examinera votre signalement sous 48h.</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => { setDone(false); setForm({ type: 'document', reason: '', description: '' }) }}
                className="btn-brand text-sm">Nouveau signalement</button>
              <button onClick={() => setTab('history')} className="px-4 py-2 rounded-xl border border-white/10 text-white/50 hover:text-white text-sm transition-colors">
                Voir l'historique
              </button>
            </div>
          </div>
        ) : (
          <div className="glass-card p-6 space-y-4">
            <h3 className="font-semibold text-white mb-2">Nouveau signalement</h3>
            <div>
              <label className="block text-sm text-white/50 mb-1.5">Type</label>
              <select value={form.type} onChange={e => setForm(f => ({ ...f, type: e.target.value }))}
                className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-500/50">
                <option value="document">Problème avec un document</option>
                <option value="order">Problème de commande</option>
                <option value="author">Problème avec un auteur</option>
                <option value="other">Autre</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-1.5">Motif *</label>
              <select value={form.reason} onChange={e => setForm(f => ({ ...f, reason: e.target.value }))}
                className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-500/50">
                <option value="">Sélectionner un motif...</option>
                <option value="Contenu inexact ou erroné">Contenu inexact ou erroné</option>
                <option value="Problème de lecture ou téléchargement">Problème de lecture ou téléchargement</option>
                <option value="Contenu inapproprié">Contenu inapproprié</option>
                <option value="Paiement non crédité">Paiement non crédité</option>
                <option value="Document non reçu">Document non reçu</option>
                <option value="Comportement irrespectueux">Comportement irrespectueux</option>
                <option value="Autre problème">Autre problème</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-white/50 mb-1.5">Description détaillée *</label>
              <textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Décrivez le problème en détail..." rows={5}
                className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder-white/30 text-sm resize-none focus:outline-none focus:border-brand-500/50" />
            </div>
            <button onClick={submit} disabled={saving || !form.reason || !form.description.trim()}
              className="w-full btn-brand py-3 disabled:opacity-40 flex items-center justify-center gap-2">
              {saving ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Envoi...</> : <><Plus className="w-4 h-4" /> Envoyer le signalement</>}
            </button>
          </div>
        )
      )}

      {tab === 'history' && (
        loading ? (
          <div className="flex items-center gap-3 text-white/40 py-10">
            <div className="w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" /> Chargement...
          </div>
        ) : disputes.length === 0 ? (
          <div className="glass-card p-12 text-center">
            <AlertTriangle className="w-12 h-12 text-white/20 mx-auto mb-3" />
            <p className="text-white/40">Aucun signalement pour le moment.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {disputes.map(d => {
              const s = STATUS[d.status] || STATUS.open
              return (
                <div key={d._id} className="glass-card p-5">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-brand-400 font-mono text-xs">#{d._id.slice(-6).toUpperCase()}</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full border ${s.cls}`}>{s.label}</span>
                      </div>
                      <p className="text-sm font-medium text-white/80">{d.reason}</p>
                      <p className="text-xs text-white/30 mt-0.5">{new Date(d.createdAt).toLocaleDateString('fr-FR')}</p>
                    </div>
                    <span className="text-xs text-white/30 capitalize">{d.type}</span>
                  </div>
                  <p className="text-sm text-white/50 bg-dark-900/30 p-3 rounded-xl">{d.description}</p>
                  {d.documentId && (
                    <Link to={`/doc/${d.documentId._id}`} className="flex items-center gap-2 mt-3 text-xs text-brand-400 hover:text-brand-300 transition-colors">
                      <BookOpen className="w-3.5 h-3.5" /> {d.documentId.title}
                    </Link>
                  )}
                  {d.resolution && (
                    <div className="mt-3 p-3 bg-green-500/5 border border-green-500/20 rounded-xl">
                      <p className="text-xs text-green-400 font-medium mb-1">Réponse de l'équipe:</p>
                      <p className="text-sm text-white/60">{d.resolution}</p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )
      )}
    </div>
  )
}
