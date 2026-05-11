import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, Upload, DollarSign, Users, Check, Loader2, BookOpen, ChevronRight, ArrowLeft } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import axios from 'axios'
import toast from 'react-hot-toast'

const STEPS = ['Présentation', 'Expertise', 'Liens & Finalisation']
const DOC_TYPES = ['Cours universitaires', 'Guides pratiques', 'Recherche académique', 'Tutoriels', 'Templates', 'Exercices & QCM', 'Livres numériques']

function ScoreMeter({ score }) {
  const color = score >= 65 ? '#10b981' : score >= 40 ? '#f59e0b' : '#ef4444'
  const label = score >= 65 ? '✅ Approbation recommandée' : score >= 40 ? '⚠️ Révision manuelle' : '❌ Non recommandé'
  return (
    <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="glass-card p-8 text-center">
      <div className="relative w-36 h-36 mx-auto mb-6">
        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
          <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12"/>
          <circle cx="60" cy="60" r="52" fill="none" stroke={color} strokeWidth="12"
            strokeDasharray={`${2 * Math.PI * 52}`}
            strokeDashoffset={`${2 * Math.PI * 52 * (1 - score/100)}`}
            strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1.5s ease' }}/>
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-4xl font-black text-white">{score}</span>
          <span className="text-xs text-white/40">/ 100</span>
        </div>
      </div>
      <h3 className="text-xl font-bold text-white mb-2">Score IA</h3>
      <p style={{ color }} className="text-sm font-semibold">{label}</p>
      <p className="text-white/40 text-xs mt-3">Notre IA a analysé votre candidature. L'équipe examinera votre dossier sous 24-48h.</p>
    </motion.div>
  )
}

export default function BecomeAuthor() {
  const { user, navigate } = useApp()
  const [step, setStep]       = useState(0)
  const [loading, setLoading] = useState(false)
  const [aiScore, setAiScore] = useState(null)
  const [form, setForm]       = useState({
    displayName:'', institution:'', specialty:'', yearsExperience:0,
    documentTypes:[], motivation:'', linkedin:'', website:'',
  })
  const set = (k,v) => setForm(f => ({...f,[k]:v}))
  const toggleType = t => set('documentTypes', form.documentTypes.includes(t) ? form.documentTypes.filter(x=>x!==t) : [...form.documentTypes, t])

  if (!user) { navigate('/'); return null }

  if (user.role === 'author' || user.role === 'admin') return (
    <div className="text-center py-20">
      <Check className="w-16 h-16 text-emerald-400 mx-auto mb-4" />
      <h2 className="text-2xl font-bold text-white mb-4">Vous êtes déjà auteur !</h2>
      <button onClick={() => navigate('/author')} className="btn-brand">Accéder au tableau de bord</button>
    </div>
  )

  if (user.authorRequest?.status === 'pending' && aiScore === null) return (
    <div className="max-w-lg mx-auto py-24 text-center px-4">
      <div className="w-20 h-20 rounded-2xl bg-amber-500/15 border border-amber-500/30 flex items-center justify-center mx-auto mb-6">
        <Loader2 className="w-10 h-10 text-amber-400" />
      </div>
      <h2 className="text-2xl font-bold text-white mb-3">Candidature en cours d'examen</h2>
      <p className="text-white/50">Notre équipe analyse votre dossier. Vous serez notifié par email sous 24-48h.</p>
      {user.aiScore > 0 && (
        <div className="mt-6 glass-card p-4">
          <p className="text-white/60 text-sm">Score IA de votre candidature : <strong className="text-brand-300">{user.aiScore}/100</strong></p>
        </div>
      )}
    </div>
  )

  if (aiScore !== null) return (
    <div className="max-w-md mx-auto px-4 py-16">
      <ScoreMeter score={aiScore} />
      <button onClick={() => navigate('/')} className="btn-brand w-full mt-6">Retour à l'accueil</button>
    </div>
  )

  const handleSubmit = async () => {
    if (!form.motivation.trim()) return toast.error('La motivation est requise.')
    setLoading(true)
    try {
      const { data } = await axios.post('/api/author/request/v2', form)
      if (data.success) {
        setAiScore(data.aiScore)
        toast.success('Candidature envoyée !')
      } else toast.error(data.message)
    } catch { toast.error('Erreur réseau.') }
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Back */}
      <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/40 hover:text-white/70 transition-colors mb-6 text-sm">
        <ArrowLeft className="w-4 h-4" /> Retour
      </button>
      {/* Header */}
      <div className="text-center mb-10">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-sm font-medium mb-6">
          <Sparkles className="w-3.5 h-3.5" /> Programme Auteur DocuMind
        </div>
        <h1 className="text-4xl font-bold text-white mb-3">Partagez votre <span className="gradient-text">expertise</span></h1>
        <p className="text-white/50">Candidature analysée par IA · Réponse sous 24-48h · 80% de commission</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center mb-8 gap-0">
        {STEPS.map((s, i) => (
          <React.Fragment key={i}>
            <div className="flex flex-col items-center">
              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all
                ${i < step ? 'bg-emerald-500 text-white' : i === step ? 'bg-brand-500 text-white ring-4 ring-brand-500/20' : 'bg-white/5 text-white/30 border border-white/10'}`}>
                {i < step ? <Check className="w-4 h-4"/> : i+1}
              </div>
              <span className={`text-xs mt-1.5 hidden sm:block ${i===step?'text-brand-300':'text-white/30'}`}>{s}</span>
            </div>
            {i < STEPS.length-1 && <div className={`flex-1 h-0.5 mx-2 mb-4 ${i<step?'bg-emerald-500':'bg-white/10'}`}/>}
          </React.Fragment>
        ))}
      </div>

      <div className="glass-card p-7">
        <AnimatePresence mode="wait">
          <motion.div key={step} initial={{opacity:0,x:20}} animate={{opacity:1,x:0}} exit={{opacity:0,x:-20}} transition={{duration:0.2}}>
            {step === 0 && (
              <div className="space-y-5">
                <h2 className="text-xl font-bold text-white mb-5">Présentation</h2>
                <div>
                  <label className="label">Nom affiché *</label>
                  <input className="input w-full" placeholder="Dr. Karim Meziani" value={form.displayName} onChange={e=>set('displayName',e.target.value)}/>
                </div>
                <div>
                  <label className="label">Institution / Organisme</label>
                  <input className="input w-full" placeholder="Université de Sétif, ESI, USTHB..." value={form.institution} onChange={e=>set('institution',e.target.value)}/>
                </div>
              </div>
            )}
            {step === 1 && (
              <div className="space-y-5">
                <h2 className="text-xl font-bold text-white mb-5">Expertise</h2>
                <div>
                  <label className="label">Domaine de spécialité *</label>
                  <input className="input w-full" placeholder="Informatique, Mathématiques, Droit..." value={form.specialty} onChange={e=>set('specialty',e.target.value)}/>
                </div>
                <div>
                  <label className="label">Années d'expérience</label>
                  <input type="number" min={0} max={50} className="input w-full" value={form.yearsExperience} onChange={e=>set('yearsExperience',Number(e.target.value))}/>
                </div>
                <div>
                  <label className="label">Motivation * <span className="text-white/30 font-normal">(min. 150 caractères recommandés)</span></label>
                  <textarea className="input w-full resize-none" rows={5} placeholder="Pourquoi souhaitez-vous devenir auteur sur DocuMind ? Quel contenu voulez-vous partager ?"
                    value={form.motivation} onChange={e=>set('motivation',e.target.value)}/>
                  <p className="text-xs text-white/30 mt-1">{form.motivation.length} caractères</p>
                </div>
              </div>
            )}
            {step === 2 && (
              <div className="space-y-5">
                <h2 className="text-xl font-bold text-white mb-5">Liens & Finalisation</h2>
                <div>
                  <label className="label">Types de documents (+5 pts chacun)</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {DOC_TYPES.map(t => (
                      <button key={t} type="button" onClick={()=>toggleType(t)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all
                          ${form.documentTypes.includes(t) ? 'bg-brand-500 border-brand-500 text-white' : 'border-white/10 text-white/40 hover:border-brand-500/40 hover:text-white/70'}`}>
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="label">Profil LinkedIn (+8 pts)</label>
                  <input className="input w-full" placeholder="https://linkedin.com/in/..." value={form.linkedin} onChange={e=>set('linkedin',e.target.value)}/>
                </div>
                <div>
                  <label className="label">Site web / Portfolio (+7 pts)</label>
                  <input className="input w-full" placeholder="https://mon-site.com" value={form.website} onChange={e=>set('website',e.target.value)}/>
                </div>
                {/* Score preview */}
                <div className="p-4 rounded-xl bg-brand-500/5 border border-brand-500/20 text-sm text-white/50">
                  <p className="font-medium text-white/70 mb-2">💡 Comment améliorer votre score :</p>
                  <ul className="space-y-1 text-xs">
                    <li className={form.institution ? 'text-emerald-400' : ''}>• Institution renseignée +10 pts</li>
                    <li className={form.motivation.length > 150 ? 'text-emerald-400' : ''}>• Motivation détaillée (150+ car.) +25 pts</li>
                    <li className={form.documentTypes.length >= 3 ? 'text-emerald-400' : ''}>• 3+ types de documents +15 pts</li>
                    <li className={form.linkedin ? 'text-emerald-400' : ''}>• LinkedIn fourni +8 pts</li>
                    <li className={form.website ? 'text-emerald-400' : ''}>• Site web fourni +7 pts</li>
                  </ul>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Nav buttons */}
        <div className="flex justify-between mt-8">
          {step > 0
            ? <button onClick={()=>setStep(s=>s-1)} className="btn-secondary flex items-center gap-2">← Précédent</button>
            : <div/>
          }
          {step < 2
            ? <button onClick={()=>setStep(s=>s+1)} disabled={step===0&&!form.displayName.trim()}
                className="btn-brand flex items-center gap-2 disabled:opacity-40">
                Suivant <ChevronRight className="w-4 h-4"/>
              </button>
            : <button onClick={handleSubmit} disabled={loading||!form.motivation.trim()}
                className="btn-brand flex items-center gap-2 disabled:opacity-40">
                {loading ? <Loader2 className="w-4 h-4 animate-spin"/> : <Sparkles className="w-4 h-4"/>}
                {loading ? 'Analyse IA...' : 'Soumettre ma candidature'}
              </button>
          }
        </div>
      </div>
    </div>
  )
}
