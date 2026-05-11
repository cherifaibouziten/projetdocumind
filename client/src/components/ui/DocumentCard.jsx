import React from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Star, Eye, Download, Heart, Lock, Sparkles, FileText, BookOpen, Tag, ShoppingCart } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useApp } from '../../context/AppContext'

export default function DocumentCard({ doc, index = 0, compact = false }) {
  if (!doc) return null
  const { _id, title, authorName, coverUrl, category, isFree, price, rating, numReviews, views, downloads, aiSummary, tags = [], isVerified, isFeatured } = doc

  const { user } = useApp()

  const addToCart = async (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!user) return toast.error('Connectez-vous pour ajouter au panier')
    const res = await axios.post(`/api/cart`, { documentId: _id })
    if (res.data.success) toast.success('Ajouté au panier !')
    else toast.error(res.data.message)
  }

  const categoryColors = {
    'Informatique': '#6366f1', 'Sciences': '#10b981', 'Droit': '#f59e0b',
    'Économie': '#0ea5e9', 'Médecine': '#ef4444', 'Histoire': '#84cc16',
    'Littérature': '#ec4899', 'Art & Design': '#f97316', 'Management': '#a855f7',
    'Mathématiques': '#8b5cf6',
  }
  const catColor = categoryColors[category] || '#7c6bfa'

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4 }}
      whileHover={{ y: -4 }}
      className="doc-card group"
    >
      <Link to={`/doc/${_id}`} className="flex flex-col h-full">
        {/* Add to cart button (shown on hover for paid docs) */}
        {!isFree && (
          <button onClick={addToCart}
            className="absolute top-2 right-2 z-20 p-2 bg-brand-500 text-white rounded-xl opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-brand-600 shadow-lg">
            <ShoppingCart className="w-3.5 h-3.5" />
          </button>
        )}
        {/* Cover */}
        <div className="relative overflow-hidden" style={{ aspectRatio: compact ? '3/2' : '3/4', maxHeight: compact ? 160 : 280 }}>
          {coverUrl ? (
            <img
              src={coverUrl}
              alt={title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${catColor}22, ${catColor}44)` }}>
              <FileText className="w-12 h-12 opacity-30" style={{ color: catColor }} />
            </div>
          )}

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-dark-900 via-dark-900/20 to-transparent" />

          {/* Badges top */}
          <div className="absolute top-3 left-3 flex flex-wrap gap-1.5">
            {isFeatured && (
              <span className="badge bg-brand-500/80 text-white border-0 backdrop-blur-sm">
                <Sparkles className="w-2.5 h-2.5" />
                Vedette
              </span>
            )}
            {isVerified && (
              <span className="badge bg-emerald-500/80 text-white border-0 backdrop-blur-sm">
                ✓ Vérifié
              </span>
            )}
          </div>

          {/* Price badge */}
          <div className="absolute top-3 right-3">
            {isFree ? (
              <span className="badge bg-dark-900/80 text-emerald-400 border border-emerald-500/30 backdrop-blur-sm">
                Gratuit
              </span>
            ) : (
              <span className="badge bg-dark-900/80 text-white border border-white/10 backdrop-blur-sm font-bold">
                <Lock className="w-2.5 h-2.5" />
                {price}€
              </span>
            )}
          </div>

          {/* Bottom overlay info */}
          <div className="absolute bottom-0 left-0 right-0 p-3">
            <span
              className="badge text-xs"
              style={{ background: `${catColor}22`, color: catColor, borderColor: `${catColor}44` }}
            >
              {category}
            </span>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <h3 className="font-semibold text-sm text-white/90 line-clamp-2 leading-snug mb-1.5 group-hover:text-white transition-colors">
            {title}
          </h3>

          <p className="text-xs text-white/40 mb-2">par {authorName}</p>

          {!compact && aiSummary && (
            <p className="text-xs text-white/30 line-clamp-2 mb-3 leading-relaxed">{aiSummary}</p>
          )}

          {/* Stats */}
          <div className="mt-auto flex items-center justify-between">
            <div className="flex items-center gap-3 text-xs text-white/30">
              {rating > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                  <span className="text-white/60">{rating}</span>
                  {numReviews > 0 && <span>({numReviews})</span>}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {views >= 1000 ? `${(views/1000).toFixed(1)}k` : views}
              </span>
            </div>
            <span className="flex items-center gap-1 text-xs text-white/30">
              <Download className="w-3 h-3" />
              {downloads >= 1000 ? `${(downloads/1000).toFixed(1)}k` : downloads}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  )
}

export function DocumentCardSkeleton() {
  return (
    <div className="glass-card overflow-hidden">
      <div className="shimmer" style={{ aspectRatio: '3/4', maxHeight: 280 }} />
      <div className="p-4 space-y-2.5">
        <div className="shimmer h-4 rounded-lg w-4/5" />
        <div className="shimmer h-3 rounded-lg w-2/5" />
        <div className="shimmer h-3 rounded-lg w-full" />
        <div className="shimmer h-3 rounded-lg w-3/4" />
      </div>
    </div>
  )
}
