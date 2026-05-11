import React, { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, Sparkles, ArrowRight, BookOpen, Brain, Volume2, Star, Users, FileText, Zap, ChevronRight, Upload } from 'lucide-react'
import { useApp } from '../context/AppContext'
import DocumentCard, { DocumentCardSkeleton } from '../components/ui/DocumentCard'
import axios from 'axios'

export default function Home() {
  const { searchQuery, setSearchQuery, categories, openAuth, user } = useApp()
  const [featured, setFeatured] = useState([])
  const [recent, setRecent]     = useState([])
  const [popular, setPopular]   = useState([])
  const [loading, setLoading]   = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const load = async () => {
      try {
        const [f, r, p] = await Promise.all([
          axios.get('/api/documents', { params: { sort: 'popular', limit: 6 } }),
          axios.get('/api/documents', { params: { sort: 'recent', limit: 8 } }),
          axios.get('/api/documents', { params: { isFree: true, sort: 'popular', limit: 6 } }),
        ])
        if (f.data.success) setFeatured(f.data.documents)
        if (r.data.success) setRecent(r.data.documents)
        if (p.data.success) setPopular(p.data.documents)
      } catch {}
      setLoading(false)
    }
    load()
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) navigate(`/explore?search=${encodeURIComponent(searchQuery.trim())}`)
  }

  const stats = [
    { icon: FileText, label: 'Documents', value: '12,000+' },
    { icon: Users,    label: 'Lecteurs',  value: '85,000+' },
    { icon: BookOpen, label: 'Auteurs',   value: '2,400+' },
    { icon: Star,     label: 'Note moy.', value: '4.8/5' },
  ]

  const features = [
    { icon: Brain, title: 'Résumés IA', desc: 'Obtenez un résumé intelligent et les points clés de chaque document en quelques secondes.', color: '#7c6bfa' },
    { icon: Sparkles, title: 'Chatbot PDF', desc: 'Posez des questions sur n\'importe quel document et obtenez des réponses précises basées sur le contenu.', color: '#a855f7' },
    { icon: Volume2, title: 'Lecture vocale', desc: 'Écoutez vos documents en audio avec des voix naturelles multilingues grâce au TTS avancé.', color: '#ec4899' },
    { icon: Zap, title: 'Recommandations', desc: 'Découvrez des documents personnalisés selon vos intérêts et votre historique de lecture.', color: '#f59e0b' },
  ]

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className="relative min-h-[90vh] flex items-center">
        {/* Background effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-brand-500/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-violet-600/8 rounded-full blur-[100px]" />
          <div className="absolute top-1/4 right-0 w-[300px] h-[300px] bg-pink-500/6 rounded-full blur-[80px]" />
          {/* Grid pattern */}
          <div className="absolute inset-0 opacity-[0.02]" style={{
            backgroundImage: `linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)`,
            backgroundSize: '60px 60px',
          }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 md:px-8 py-20 text-center">
          {/* Badge */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-300 text-sm font-medium mb-8"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Plateforme IA de documents PDF nouvelle génération
          </motion.div>

          {/* Headline */}
          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold leading-[1.1] mb-6 text-balance"
          >
            <span className="text-white">Découvrez la</span>
            <br />
            <span className="gradient-text">connaissance augmentée</span>
            <br />
            <span className="text-white">par l'IA</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-lg md:text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed"
          >
            Publiez, vendez et lisez des documents PDF avec résumés automatiques, chatbot IA, lecture vocale et recommandations intelligentes.
          </motion.p>

          {/* Search bar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="max-w-2xl mx-auto mb-8"
          >
            <form onSubmit={handleSearch} className="relative flex items-center gap-2 p-2 rounded-2xl bg-white/5 border border-white/10 shadow-card backdrop-blur-sm">
              <Search className="absolute left-5 w-5 h-5 text-white/30 pointer-events-none" />
              <input
                type="text"
                placeholder="Rechercher un document, auteur, catégorie..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="flex-1 bg-transparent pl-12 pr-4 py-3 text-white placeholder-white/30 outline-none text-base"
              />
              <button type="submit" className="btn-brand px-6 py-3 flex-shrink-0 text-base">
                Rechercher
              </button>
            </form>
            {/* Popular searches */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
              <span className="text-xs text-white/30">Populaire:</span>
              {['IA', 'Python', 'Finance', 'Droit', 'Biologie'].map(q => (
                <button
                  key={q}
                  onClick={() => { setSearchQuery(q); navigate(`/explore?search=${q}`) }}
                  className="text-xs px-3 py-1 rounded-full bg-white/5 border border-white/8 text-white/50 hover:text-white hover:border-brand-500/30 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </motion.div>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            <Link to="/explore" className="btn-brand px-8 py-3.5 text-base">
              <BookOpen className="w-5 h-5" />
              Explorer les documents
            </Link>
            {!user && (
              <button onClick={() => openAuth('register')} className="btn-ghost px-8 py-3.5 text-base">
                <Upload className="w-5 h-5" />
                Publier gratuitement
              </button>
            )}
          </motion.div>

          {/* Stats */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.6 }}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto mt-20"
          >
            {stats.map(({ icon: Icon, label, value }, i) => (
              <motion.div
                key={label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 + i * 0.1 }}
                className="text-center"
              >
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center mx-auto mb-2">
                  <Icon className="w-5 h-5 text-brand-400" />
                </div>
                <div className="text-2xl font-bold text-white">{value}</div>
                <div className="text-xs text-white/40 mt-0.5">{label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Featured Documents */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-16">
        <SectionHeader
          badge="🔥 Tendances"
          title="Documents populaires"
          subtitle="Les documents les plus appréciés par notre communauté"
          link="/explore?sort=popular"
        />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-8">
          {loading
            ? Array(6).fill(0).map((_, i) => <DocumentCardSkeleton key={i} />)
            : featured.map((doc, i) => <DocumentCard key={doc._id} doc={doc} index={i} compact />)
          }
        </div>
      </section>

      {/* AI Features */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-16">
        <SectionHeader
          badge="✨ IA intégrée"
          title="Augmentez votre lecture"
          subtitle="Des fonctionnalités d'intelligence artificielle pour une expérience de lecture inégalée"
        />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
          {features.map(({ icon: Icon, title, desc, color }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              viewport={{ once: true }}
              className="glass-card-hover p-6 text-center"
            >
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ background: `${color}22`, border: `1px solid ${color}44` }}>
                <Icon className="w-6 h-6" style={{ color }} />
              </div>
              <h3 className="font-semibold text-white mb-2">{title}</h3>
              <p className="text-sm text-white/40 leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Free Documents */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-16">
        <SectionHeader
          badge="🆓 Gratuit"
          title="Accès libre & gratuit"
          subtitle="Des centaines de documents de qualité accessibles sans inscription"
          link="/explore?filter=free"
        />
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mt-8">
          {loading
            ? Array(6).fill(0).map((_, i) => <DocumentCardSkeleton key={i} />)
            : popular.map((doc, i) => <DocumentCard key={doc._id} doc={doc} index={i} compact />)
          }
        </div>
      </section>

      {/* Categories */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-16">
        <SectionHeader
          badge="📂 Catégories"
          title="Explorez par thème"
          subtitle="Trouvez des documents dans votre domaine de prédilection"
        />
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 mt-8">
          {categories.map((cat, i) => (
            <motion.div
              key={cat._id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              viewport={{ once: true }}
            >
              <Link
                to={`/explore/${cat.slug}`}
                className="glass-card-hover p-4 text-center flex flex-col items-center gap-2 group"
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className="text-sm font-medium text-white/70 group-hover:text-white transition-colors">{cat.name}</span>
                <span
                  className="w-12 h-0.5 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300"
                  style={{ background: cat.color }}
                />
              </Link>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Recent Documents */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-16">
        <SectionHeader
          badge="🆕 Nouveautés"
          title="Derniers ajouts"
          subtitle="Fraîchement publiés par notre communauté d'auteurs"
          link="/explore?sort=recent"
        />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
          {loading
            ? Array(4).fill(0).map((_, i) => <DocumentCardSkeleton key={i} />)
            : recent.slice(0, 4).map((doc, i) => <DocumentCard key={doc._id} doc={doc} index={i} />)
          }
        </div>
      </section>

      {/* CTA Banner */}
      <section className="max-w-7xl mx-auto px-4 md:px-8 py-16">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative rounded-3xl overflow-hidden"
        >
          <div className="absolute inset-0 bg-brand-gradient opacity-10" />
          <div className="absolute inset-0 border border-brand-500/20 rounded-3xl" />
          <div className="relative p-12 text-center">
            <span className="badge-brand mb-4">Pour les auteurs</span>
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Monétisez votre expertise
            </h2>
            <p className="text-white/50 max-w-xl mx-auto mb-8">
              Publiez vos documents PDF et gagnez jusqu'à 80% de commission sur chaque vente. Rejoignez plus de 2,400 auteurs qui partagent leur savoir.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              {user
                ? (user.role === 'author' || user.role === 'admin')
                  ? <Link to="/author/upload" className="btn-brand px-8 py-3.5 text-base">Publier un document</Link>
                  : <Link to="/become-author" className="btn-brand px-8 py-3.5 text-base">Devenir auteur</Link>
                : <button onClick={() => openAuth('register')} className="btn-brand px-8 py-3.5 text-base">
                    <Sparkles className="w-5 h-5" />
                    Commencer gratuitement
                  </button>
              }
              <Link to="/explore" className="btn-ghost px-8 py-3.5 text-base">Explorer d'abord</Link>
            </div>
          </div>
        </motion.div>
      </section>
    </div>
  )
}

function SectionHeader({ badge, title, subtitle, link }) {
  return (
    <div className="flex items-end justify-between flex-wrap gap-4">
      <div>
        <span className="badge-brand mb-3">{badge}</span>
        <h2 className="text-2xl md:text-3xl font-bold text-white">{title}</h2>
        <p className="text-white/40 mt-1.5 text-sm">{subtitle}</p>
      </div>
      {link && (
        <Link to={link} className="flex items-center gap-1.5 text-sm text-brand-400 hover:text-brand-300 transition-colors font-medium">
          Voir tout
          <ChevronRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  )
}
