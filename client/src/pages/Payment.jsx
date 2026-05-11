/**
 * Payment — Simulation de paiement par carte (style Electroshop)
 * Carte visuelle interactive + animation de traitement multi-étapes
 * Aucun vrai paiement — 100% simulation
 */
import React, { useState, useEffect } from 'react'
import { useSearchParams, useNavigate, Link } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { Shield, Lock, CheckCircle, XCircle, ArrowLeft } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const STEPS = [
  { label: 'Initialisation', desc: 'Connexion sécurisée...' },
  { label: 'Vérification',   desc: 'Vérification des données...' },
  { label: 'Autorisation',   desc: 'Demande auprès de votre banque...' },
  { label: 'Confirmation',   desc: 'Finalisation de la commande...' },
]

export default function Payment() {
  const [params] = useSearchParams()
  const documentId = params.get('documentId')
  const amount     = params.get('amount')
  const title      = params.get('title')
  const { user } = useApp()
  const navigate = useNavigate()

  const [card, setCard] = useState({ number: '', name: '', expiry: '', cvv: '' })
  const [phase, setPhase] = useState('form') // form | processing | success | fail
  const [step,  setStep]  = useState(0)
  const [flipped, setFlipped] = useState(false)

  // Formatage automatique
  const fmtNumber = v => v.replace(/\D/g,'').slice(0,16).replace(/(\d{4})(?=\d)/g,'$1 ')
  const fmtExpiry = v => { const d = v.replace(/\D/g,'').slice(0,4); return d.length > 2 ? d.slice(0,2)+'/'+d.slice(2) : d }

  const cardType  = card.number.startsWith('4') ? 'VISA' :
                    card.number.startsWith('5') ? 'MASTERCARD' :
                    card.number.startsWith('3') ? 'AMEX' : '💳'

  const cardGrad  = card.number.startsWith('4') ? 'from-[#1a1a3e] to-[#2d2d6b]' :
                    card.number.startsWith('5') ? 'from-[#1a2e1a] to-[#2d5a2d]' :
                    'from-dark-700 to-dark-600'

  const pay = async () => {
    if (card.number.replace(/\s/g,'').length < 16) return toast.error('Numéro de carte incomplet')
    if (!card.name.trim())   return toast.error('Nom du titulaire requis')
    if (card.expiry.length < 5) return toast.error('Date d\'expiration incomplète')
    if (card.cvv.length < 3) return toast.error('CVV invalide')

    setPhase('processing')

    // Animation des étapes (simulation réaliste)
    for (let i = 0; i < STEPS.length; i++) {
      setStep(i)
      await new Promise(r => setTimeout(r, 800 + Math.random() * 600))
    }

    // 95% de chance de succès (simulation)
    const success = Math.random() > 0.05

    if (success) {
      try {
        // Confirmer l'achat côté serveur
        await axios.post('/api/purchases/confirm', {
          paymentIntentId: 'sim_' + Date.now(),
          documentId,
        })
        setPhase('success')
      } catch {
        setPhase('success') // mode démo : succès même si erreur réseau
      }
    } else {
      setPhase('fail')
    }
  }

  // ── Phase: Traitement ──────────────────────────────────────────────
  if (phase === 'processing') return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 px-4">
      <div className="glass-card w-full max-w-sm p-10 text-center">
        {/* Spinner */}
        <div className="relative w-16 h-16 mx-auto mb-6">
          <div className="w-16 h-16 border-4 border-white/10 rounded-full" />
          <div className="absolute inset-0 w-16 h-16 border-4 border-t-brand-400 border-r-transparent border-b-transparent border-l-transparent rounded-full animate-spin" />
        </div>
        <h2 className="text-xl font-bold text-white mb-6">Traitement en cours</h2>
        <div className="space-y-3 text-left">
          {STEPS.map((s, i) => (
            <div key={s.label} className={`flex items-center gap-3 text-sm transition-all duration-500 ${i <= step ? 'opacity-100' : 'opacity-20'}`}>
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                i < step  ? 'bg-green-500 text-white' :
                i === step ? 'bg-brand-500 text-white animate-pulse' :
                'bg-white/10 text-white/30'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <div>
                <p className={`font-medium ${i <= step ? 'text-white' : 'text-white/30'}`}>{s.label}</p>
                {i === step && <p className="text-xs text-white/40">{s.desc}</p>}
              </div>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-center gap-2 mt-6 text-xs text-white/20">
          <Lock className="w-3 h-3" /> Connexion SSL sécurisée
        </div>
      </div>
    </div>
  )

  // ── Phase: Succès ──────────────────────────────────────────────────
  if (phase === 'success') return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 px-4">
      <div className="glass-card w-full max-w-sm p-10 text-center">
        <div className="w-20 h-20 rounded-full bg-green-500/20 border-2 border-green-500/40 flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Paiement accepté !</h2>
        <p className="text-white/50 text-sm mb-2">Votre document est maintenant disponible.</p>
        {title && <p className="text-brand-400 font-semibold mb-1 truncate">"{title}"</p>}
        {amount && <p className="text-2xl font-bold text-white mb-1">{amount}€</p>}
        <p className="text-xs text-white/20 font-mono mb-8">
          REF: SIM-{Date.now().toString(36).toUpperCase()}
        </p>
        <div className="space-y-3">
          {documentId && (
            <Link to={`/doc/${documentId}`} className="btn-brand w-full py-3 flex items-center justify-center gap-2">
              Lire le document
            </Link>
          )}
          <Link to="/library" className="block py-3 rounded-xl border border-white/10 text-white/50 hover:text-white hover:border-white/20 transition-colors text-sm">
            Ma bibliothèque
          </Link>
        </div>
      </div>
    </div>
  )

  // ── Phase: Échec ───────────────────────────────────────────────────
  if (phase === 'fail') return (
    <div className="min-h-screen flex items-center justify-center bg-dark-950 px-4">
      <div className="glass-card w-full max-w-sm p-10 text-center">
        <div className="w-20 h-20 rounded-full bg-red-500/20 border-2 border-red-500/30 flex items-center justify-center mx-auto mb-6">
          <XCircle className="w-10 h-10 text-red-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Transaction refusée</h2>
        <p className="text-white/50 text-sm mb-8">
          Votre banque a refusé cette transaction.<br/>Vérifiez vos informations et réessayez.
        </p>
        <div className="space-y-3">
          <button onClick={() => setPhase('form')} className="btn-brand w-full py-3">
            Réessayer
          </button>
          <Link to="/explore" className="block py-3 rounded-xl border border-white/10 text-white/50 hover:text-white transition-colors text-sm">
            Retour à l'exploration
          </Link>
        </div>
      </div>
    </div>
  )

  // ── Phase: Formulaire ──────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-dark-950 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Shield className="w-5 h-5 text-brand-400" />
            <h1 className="text-2xl font-bold text-white">Paiement sécurisé</h1>
          </div>
          <p className="text-white/30 text-sm uppercase tracking-widest">Simulation — aucune transaction réelle</p>
          {title && <p className="text-brand-400 text-sm mt-2 truncate">"{title}" — {amount}€</p>}
        </div>

        {/* Carte visuelle */}
        <div className={`bg-gradient-to-br ${cardGrad} rounded-2xl h-48 p-6 text-white mb-6 relative overflow-hidden shadow-2xl border border-white/10`}>
          {/* Cercles décoratifs */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full" />
          <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-white/5 rounded-full" />
          {/* Contenu carte */}
          <div className="relative z-10 h-full flex flex-col justify-between">
            <div className="flex justify-between items-start">
              <span className="text-white/60 text-sm font-medium">DocuMind</span>
              <span className="text-sm font-bold tracking-widest text-white/80">{cardType}</span>
            </div>
            <div>
              <p className="font-mono text-xl tracking-[0.18em] mb-3 text-white/90">
                {card.number || '•••• •••• •••• ••••'}
              </p>
              <div className="flex justify-between text-xs text-white/50">
                <div>
                  <p className="uppercase mb-0.5">Titulaire</p>
                  <p className="text-white font-semibold uppercase text-sm">
                    {card.name || 'VOTRE NOM'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="uppercase mb-0.5">Expire</p>
                  <p className="text-white font-semibold text-sm">
                    {card.expiry || 'MM/AA'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Formulaire */}
        <div className="glass-card p-6 space-y-4">
          {/* Numéro */}
          <div>
            <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-1.5">
              Numéro de carte
            </label>
            <input
              value={card.number}
              onChange={e => setCard(c => ({ ...c, number: fmtNumber(e.target.value) }))}
              placeholder="1234 5678 9012 3456"
              maxLength={19}
              className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-lg tracking-widest placeholder-white/20 focus:outline-none focus:border-brand-500/50 transition-colors"
            />
          </div>

          {/* Nom */}
          <div>
            <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-1.5">
              Nom du titulaire
            </label>
            <input
              value={card.name}
              onChange={e => setCard(c => ({ ...c, name: e.target.value.toUpperCase() }))}
              placeholder="PRÉNOM NOM"
              className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-white uppercase font-semibold placeholder-white/20 focus:outline-none focus:border-brand-500/50 transition-colors"
            />
          </div>

          {/* Expiry + CVV */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-1.5">
                Expiration
              </label>
              <input
                value={card.expiry}
                onChange={e => setCard(c => ({ ...c, expiry: fmtExpiry(e.target.value) }))}
                placeholder="MM/AA"
                maxLength={5}
                className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-white font-mono placeholder-white/20 focus:outline-none focus:border-brand-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/40 uppercase tracking-widest mb-1.5">
                CVV
              </label>
              <input
                value={card.cvv}
                onChange={e => setCard(c => ({ ...c, cvv: e.target.value.replace(/\D/g,'').slice(0,4) }))}
                onFocus={() => setFlipped(true)}
                onBlur={() => setFlipped(false)}
                placeholder="•••"
                type="password"
                maxLength={4}
                className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-white font-mono placeholder-white/20 focus:outline-none focus:border-brand-500/50 transition-colors"
              />
            </div>
          </div>

          {/* Montant */}
          {amount && (
            <div className="flex items-center justify-between bg-brand-500/10 border border-brand-500/20 rounded-xl px-4 py-3">
              <span className="text-white/60 text-sm">Montant à payer</span>
              <span className="text-brand-400 font-bold text-xl">{amount}€</span>
            </div>
          )}

          {/* Bouton payer */}
          <button
            onClick={pay}
            className="w-full btn-brand py-4 text-base font-semibold flex items-center justify-center gap-2"
          >
            <Lock className="w-4 h-4" />
            Payer maintenant
          </button>

          {/* Sécurité */}
          <div className="flex items-center justify-center gap-4 text-xs text-white/20 pt-1">
            <div className="flex items-center gap-1"><Shield className="w-3 h-3" /> SSL sécurisé</div>
            <div className="flex items-center gap-1"><Lock className="w-3 h-3" /> Données chiffrées</div>
            <span>Simulation</span>
          </div>
        </div>

        {/* Retour */}
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-white/30 hover:text-white/60 transition-colors mx-auto mt-6 text-sm">
          <ArrowLeft className="w-4 h-4" /> Annuler
        </button>
      </div>
    </div>
  )
}
