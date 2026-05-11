import React from 'react'
import { Link } from 'react-router-dom'
import { BookOpen, Twitter, Github, Linkedin, Mail, Sparkles, ArrowRight } from 'lucide-react'

export default function Footer() {
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-white/[0.06] mt-24">
      <div className="max-w-7xl mx-auto px-4 md:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2.5 mb-5 group">
              <div className="w-9 h-9 rounded-xl bg-brand-gradient flex items-center justify-center shadow-brand">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl">
                <span className="gradient-text">Docu</span>
                <span className="text-white">Mind</span>
              </span>
            </Link>
            <p className="text-sm text-white/40 leading-relaxed mb-6">
              La plateforme intelligente pour partager, vendre et découvrir des documents PDF avec l'assistance de l'IA.
            </p>
            <div className="flex items-center gap-3">
              {[Twitter, Github, Linkedin].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center text-white/40 hover:text-white hover:border-brand-500/30 transition-all duration-200"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Plateforme</h4>
            <ul className="space-y-3">
              {[
                { label: 'Explorer les documents', href: '/explore' },
                { label: 'Documents gratuits', href: '/explore?filter=free' },
                { label: 'Populaires', href: '/explore?sort=popular' },
                { label: 'Nouveautés', href: '/explore?sort=recent' },
              ].map(link => (
                <li key={link.href}>
                  <Link to={link.href} className="text-sm text-white/40 hover:text-white/80 transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Pour les auteurs</h4>
            <ul className="space-y-3">
              {[
                { label: 'Devenir auteur', href: '/become-author' },
                { label: 'Publier un document', href: '/author/upload' },
                { label: 'Tableau de bord', href: '/author' },
                { label: 'Mes documents', href: '/author/documents' },
              ].map(link => (
                <li key={link.href}>
                  <Link to={link.href} className="text-sm text-white/40 hover:text-white/80 transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h4 className="text-sm font-semibold text-white mb-4">Newsletter</h4>
            <p className="text-sm text-white/40 mb-4 leading-relaxed">
              Recevez les meilleurs documents et actualités IA chaque semaine.
            </p>
            <form className="flex gap-2" onSubmit={(e) => e.preventDefault()}>
              <input
                type="email"
                placeholder="votre@email.com"
                className="flex-1 px-3 py-2.5 rounded-xl bg-white/5 border border-white/8
                           text-sm text-white placeholder-white/30
                           focus:outline-none focus:ring-1 focus:ring-brand-500/40 min-w-0"
              />
              <button className="btn-brand px-3 py-2.5 flex-shrink-0">
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/[0.06] mt-12 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-sm text-white/30">
            © {year} DocuMind. Tous droits réservés.
          </p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-xs text-white/30">
              <Sparkles className="w-3 h-3 text-brand-400" />
              Propulsé par l'IA
            </span>
            {['Confidentialité', 'CGU', 'Contact'].map(label => (
              <a key={label} href="#" className="text-xs text-white/30 hover:text-white/60 transition-colors">{label}</a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  )
}
