import React from 'react'
import { Link } from 'react-router-dom'
import { CreditCard, Lock, ArrowLeft } from 'lucide-react'

export default function Checkout() {
  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-brand-gradient flex items-center justify-center mx-auto mb-6 shadow-brand">
        <CreditCard className="w-8 h-8 text-white" />
      </div>
      <h1 className="text-2xl font-bold text-white mb-3">Paiement sécurisé</h1>
      <p className="text-white/50 text-sm mb-6 leading-relaxed">
        L'intégration Stripe est configurée dans le backend. Ajoutez votre clé Stripe dans le fichier <code className="text-brand-300 bg-brand-500/10 px-1.5 py-0.5 rounded">.env</code> pour activer les paiements réels.
      </p>
      <div className="glass-card p-5 text-left mb-6">
        <p className="text-xs text-white/40 uppercase tracking-wide font-semibold mb-3">Fonctionnalités incluses</p>
        {[
          'Paiement par carte bancaire sécurisé',
          'Webhooks Stripe pour confirmation',
          '80% de commission pour les auteurs',
          'Historique des achats complet',
          'Accès immédiat après paiement',
        ].map(f => (
          <div key={f} className="flex items-center gap-2.5 py-2 border-b border-white/[0.04] last:border-0">
            <div className="w-4 h-4 rounded-full bg-emerald-500/15 flex items-center justify-center flex-shrink-0">
              <span className="text-emerald-400 text-xs">✓</span>
            </div>
            <span className="text-sm text-white/60">{f}</span>
          </div>
        ))}
      </div>
      <div className="flex items-center justify-center gap-1.5 text-xs text-white/30 mb-6">
        <Lock className="w-3.5 h-3.5" />
        Paiements sécurisés par Stripe
      </div>
      <Link to="/explore" className="btn-ghost w-full justify-center">
        <ArrowLeft className="w-4 h-4" />
        Retour à l'exploration
      </Link>
    </div>
  )
}
