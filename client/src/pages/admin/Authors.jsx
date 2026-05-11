/**
 * Admin Authors — Demandes auteurs avec score IA (style Electroshop)
 */
import React, { useEffect, useState } from 'react'
import { Brain, Check, X, ChevronDown, ChevronUp, User } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const ScoreBar = ({ score }) => {
  const color = score >= 65 ? 'bg-green-500' : score >= 40 ? 'bg-yellow-400' : 'bg-red-400'
  const textColor = score >= 65 ? 'text-green-400' : score >= 40 ? 'text-yellow-400' : 'text-red-400'
  const label = score >= 65 ? '🟢 IA recommande l\'approbation' : score >= 40 ? '🟡 Révision manuelle recommandée' : '🔴 IA recommande le refus'
  return (
    <div className="mt-3">
      <div className="flex justify-between text-xs mb-1">
        <span className="text-white/40">Score IA</span>
        <span className={`font-bold ${textColor}`}>{score}/100</span>
      </div>
      <div className="w-full bg-white/10 h-2 rounded-full">
        <div className={`h-2 rounded-full transition-all ${color}`} style={{ width: `${score}%` }} />
      </div>
      <p className={`text-xs mt-1 font-semibold ${textColor}`}>{label}</p>
    </div>
  )
}

export default function AdminAuthors() {
  const [pending, setPending]     = useState([])
  const [authors, setAuthors]     = useState([])
  const [loading, setLoading]     = useState(true)
  const [expanded, setExpanded]   = useState(null)
  const [rejectModal, setRejectModal] = useState(null)
  const [rejectReason, setRejectReason] = useState('')

  const load = async () => {
    const [p, a] = await Promise.all([
      axios.get('/api/author/pending'),
      axios.get('/api/users'),
    ])
    if (p.data.success) setPending(p.data.authors)
    if (a.data.success) setAuthors(a.data.users.filter(u => u.role === 'author'))
    setLoading(false)
  }
  useEffect(() => { load() }, [])

  const approve = async (id) => {
    const { data } = await axios.put(`/api/author/approve/${id}`, { approve: true })
    if (data.success) { toast.success('✅ Auteur approuvé !'); load() }
    else toast.error(data.message)
  }

  const reject = async () => {
    const { data } = await axios.put(`/api/author/approve/${rejectModal}`, { approve: false, reason: rejectReason })
    if (data.success) { toast.success('Demande refusée'); setRejectModal(null); setRejectReason(''); load() }
    else toast.error(data.message)
  }

  if (loading) return (
    <div className="flex items-center gap-3 text-white/40 py-10 p-6">
      <div className="w-5 h-5 border-2 border-brand-400 border-t-transparent rounded-full animate-spin" />
      Chargement...
    </div>
  )

  return (
    <div className="p-6">
      {/* Reject modal */}
      {rejectModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6">
            <h3 className="font-bold text-white text-lg mb-4">Motif du refus</h3>
            <textarea value={rejectReason} onChange={e => setRejectReason(e.target.value)}
              placeholder="Expliquez pourquoi la demande est refusée (optionnel)..." rows={3}
              className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder-white/30 text-sm resize-none mb-4 focus:outline-none focus:border-brand-500/50" />
            <div className="flex gap-3">
              <button onClick={reject} className="flex-1 py-2.5 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm font-semibold transition-colors">
                Confirmer le refus
              </button>
              <button onClick={() => { setRejectModal(null); setRejectReason('') }}
                className="flex-1 py-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white text-sm transition-colors">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      <h1 className="text-2xl font-bold text-white mb-2">Gestion des auteurs</h1>
      <p className="text-white/40 text-sm mb-8">Les demandes sont analysées automatiquement par notre IA</p>

      {/* Pending requests */}
      <div className="mb-10">
        <div className="flex items-center gap-3 mb-5">
          <h2 className="text-lg font-semibold text-white">Demandes en attente</h2>
          {pending.length > 0 && (
            <span className="bg-yellow-500/20 text-yellow-400 text-xs font-bold px-2 py-0.5 rounded-full border border-yellow-500/30">{pending.length}</span>
          )}
        </div>

        {pending.length === 0 ? (
          <div className="glass-card p-8 text-center text-white/30">Aucune demande en attente</div>
        ) : (
          <div className="space-y-4">
            {pending.map(u => {
              const vr = u.authorRequest || {}
              const pf = u.publisherForm || {}
              const isExp = expanded === u._id
              const borderColor = u.aiScore >= 65 ? 'border-green-500/30' : u.aiScore >= 40 ? 'border-yellow-500/30' : 'border-red-500/30'

              return (
                <div key={u._id} className={`glass-card border ${borderColor} overflow-hidden`}>
                  <div className="p-5">
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="flex-1">
                        {/* User info */}
                        <div className="flex items-center gap-3 mb-3">
                          <div className="w-10 h-10 rounded-xl overflow-hidden bg-brand-gradient flex-shrink-0 flex items-center justify-center">
                            {u.avatar
                              ? <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                              : <span className="text-white font-bold">{u.name?.[0]}</span>
                            }
                          </div>
                          <div>
                            <p className="font-bold text-white">{u.name}</p>
                            <p className="text-xs text-white/40">{u.email}</p>
                          </div>
                        </div>

                        {/* Publisher form data */}
                        <div className="bg-dark-900/50 p-3 rounded-xl text-sm space-y-1.5 mb-3">
                          {pf.displayName && <p><span className="text-white/40">Nom d'auteur:</span> <span className="text-white font-medium">{pf.displayName}</span></p>}
                          {pf.specialty && <p><span className="text-white/40">Spécialité:</span> <span className="text-white/70">{pf.specialty}</span></p>}
                          {pf.institution && <p><span className="text-white/40">Institution:</span> <span className="text-white/70">{pf.institution}</span></p>}
                          {pf.yearsExperience > 0 && <p><span className="text-white/40">Expérience:</span> <span className="text-white/70">{pf.yearsExperience} ans</span></p>}
                          {pf.documentTypes?.length > 0 && <p><span className="text-white/40">Types:</span> <span className="text-white/70">{pf.documentTypes.join(', ')}</span></p>}
                          <p><span className="text-white/40">Soumis le:</span> <span className="text-white/70">{new Date(vr.requestedAt).toLocaleDateString('fr-FR')}</span></p>
                        </div>

                        {/* AI Score */}
                        {u.aiScore !== undefined && <ScoreBar score={u.aiScore} />}

                        {/* AI Reasoning toggle */}
                        {u.aiReasoning && (
                          <button onClick={() => setExpanded(isExp ? null : u._id)}
                            className="flex items-center gap-1.5 text-xs text-brand-400 hover:text-brand-300 mt-2 transition-colors">
                            <Brain className="w-3.5 h-3.5" />
                            {isExp ? 'Masquer l\'analyse IA' : 'Voir l\'analyse IA complète'}
                            {isExp ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                          </button>
                        )}
                        {isExp && u.aiReasoning && (
                          <div className="mt-3 bg-brand-500/5 border border-brand-500/20 p-3 rounded-xl text-xs text-white/60 whitespace-pre-line leading-relaxed">
                            {u.aiReasoning}
                          </div>
                        )}
                        {pf.motivation && (
                          <p className="text-xs text-white/40 mt-2 italic line-clamp-2">"{pf.motivation}"</p>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex flex-col gap-2 flex-shrink-0">
                        <button onClick={() => approve(u._id)}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30 transition-colors font-medium text-sm">
                          <Check className="w-4 h-4" /> Approuver
                        </button>
                        <button onClick={() => { setRejectModal(u._id); setRejectReason('') }}
                          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors font-medium text-sm">
                          <X className="w-4 h-4" /> Refuser
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Active authors */}
      <div>
        <h2 className="text-lg font-semibold text-white mb-5">Auteurs actifs ({authors.length})</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          {authors.map(a => (
            <div key={a._id} className="glass-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl overflow-hidden bg-brand-gradient flex-shrink-0 flex items-center justify-center">
                {a.avatar
                  ? <img src={a.avatar} alt="" className="w-full h-full object-cover" />
                  : <span className="text-white font-bold text-sm">{a.name?.[0]}</span>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-white text-sm truncate">{a.name}</p>
                <p className="text-xs text-white/40 truncate">{a.email}</p>
                {a.publisherForm?.specialty && <p className="text-xs text-brand-400 mt-0.5 truncate">{a.publisherForm.specialty}</p>}
              </div>
              <span className="text-xs bg-green-500/10 border border-green-500/30 text-green-400 font-semibold px-2 py-0.5 rounded-full flex-shrink-0">Actif</span>
            </div>
          ))}
          {authors.length === 0 && <p className="text-white/30 text-sm col-span-2 text-center py-8">Aucun auteur actif</p>}
        </div>
      </div>
    </div>
  )
}
