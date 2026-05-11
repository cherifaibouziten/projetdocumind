import React, { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, Heart, Download, Star, Eye, Share2, Tag, Clock, FileText,
  Sparkles, Brain, MessageSquare, Volume2, VolumeX, Send, Lock,
  ChevronDown, ChevronUp, ExternalLink, ArrowLeft, Check, Play, Pause,
  Loader2, User, AlertTriangle, ShoppingCart
} from 'lucide-react'
import { useApp } from '../context/AppContext'
import StarRating from '../components/ui/StarRating'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function DocumentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, requireAuth, isInLibrary, addToLibraryLocal } = useApp()
  const [doc, setDoc]           = useState(null)
  const [loading, setLoading]   = useState(true)
  const [liked, setLiked]       = useState(false)
  const [inWishlist, setInWishlist] = useState(false)
  const [inLibrary, setInLibrary]   = useState(false)
  const [activeTab, setActiveTab]   = useState('overview')
  const [aiLoading, setAiLoading]   = useState(false)
  const [aiData, setAiData]         = useState(null)
  const [showDisputeModal, setShowDisputeModal] = useState(false)
  const [disputeForm, setDisputeForm] = useState({ reason: '', description: '' })
  const [disputeLoading, setDisputeLoading] = useState(false)
  const [chatMessages, setChatMessages] = useState([])
  const [chatInput, setChatInput]       = useState('')
  const [chatLoading, setChatLoading]   = useState(false)
  const [chatSession, setChatSession]   = useState(null)
  const [isSpeaking, setIsSpeaking]     = useState(false)
  const [commentText, setCommentText]   = useState('')
  const [commentRating, setCommentRating] = useState(0)
  const [submittingComment, setSubmittingComment] = useState(false)
  const [purchasing, setPurchasing]     = useState(false)
  const chatEndRef = useRef()

  useEffect(() => {
    const load = async () => {
      setLoading(true)
      try {
        const { data } = await axios.get(`/api/documents/${id}`)
        if (data.success) {
          setDoc(data.document)
          // Check if in library
          if (user) setInLibrary(isInLibrary(data.document._id))
        }
      } catch {}
      setLoading(false)
    }
    load()
    return () => window.speechSynthesis?.cancel()
  }, [id])

  const handleLike = async () => {
    if (!requireAuth()) return
    try {
      const { data } = await axios.post(`/api/documents/${doc._id}/like`)
      if (data.success) {
        setLiked(data.liked)
        setDoc(d => ({ ...d, likes: data.likes }))
      }
    } catch {}
  }

  const handleWishlist = async () => {
    if (!requireAuth()) return
    try {
      const { data } = await axios.post(`/api/documents/${doc._id}/wishlist`)
      if (data.success) { setInWishlist(data.inWishlist); toast.success(data.inWishlist ? 'Ajouté aux favoris' : 'Retiré des favoris') }
    } catch {}
  }

  const handleAddToLibrary = async () => {
    if (!requireAuth()) return
    if (!doc.isFree) { toast.error('Ce document est payant.'); return }
    try {
      const { data } = await axios.post(`/api/library/${doc._id}`)
      if (data.success) {
        setInLibrary(true)
        addToLibraryLocal(doc)
        toast.success('Ajouté à votre bibliothèque !')
      }
    } catch {}
  }

  const handlePurchase = async () => {
    if (!requireAuth()) return
    setPurchasing(true)
    try {
      const { data } = await axios.post('/api/purchases/intent', { documentId: doc._id })
      if (data.success) {
        // Rediriger vers la page de simulation de paiement
        navigate(`/payment?documentId=${doc._id}&amount=${doc.price}&title=${encodeURIComponent(doc.title)}`)
      } else {
        toast.error(data.message)
      }
    } catch {
      toast.error('Erreur lors de l\'initialisation du paiement')
    }
    setPurchasing(false)
  }

  const handleAddToCart = async () => {
    if (!requireAuth()) return
    try {
      const { data } = await axios.post('/api/cart', { documentId: doc._id })
      if (data.success) toast.success('🛒 Ajouté au panier !')
      else toast.error(data.message)
    } catch { toast.error('Erreur') }
  }

  const handleDispute = async () => {
    if (!requireAuth()) return
    if (!disputeForm.reason.trim() || !disputeForm.description.trim()) {
      toast.error('Motif et description requis')
      return
    }
    setDisputeLoading(true)
    try {
      const { data } = await axios.post('/api/disputes', {
        documentId: doc._id, type: 'document',
        reason: disputeForm.reason, description: disputeForm.description
      })
      if (data.success) {
        toast.success('✅ Signalement envoyé !')
        setShowDisputeModal(false)
        setDisputeForm({ reason: '', description: '' })
      } else toast.error(data.message)
    } catch { toast.error('Erreur lors du signalement') }
    setDisputeLoading(false)
  }

  const handleGetSummary = async () => {
    if (!requireAuth()) return
    setAiLoading(true)
    setActiveTab('ai')
    try {
      const { data } = await axios.get(`/api/ai/summary/${doc._id}`)
      if (data.success) setAiData(data)
      else toast.error(data.message)
    } catch {}
    setAiLoading(false)
  }

  const handleChat = async (e) => {
    e.preventDefault()
    if (!chatInput.trim() || chatLoading) return
    if (!requireAuth()) return
    const msg = chatInput.trim()
    setChatInput('')
    setChatMessages(m => [...m, { role: 'user', content: msg }])
    setChatLoading(true)
    try {
      const { data } = await axios.post(`/api/ai/chat/${doc._id}`, { message: msg, sessionId: chatSession })
      if (data.success) {
        setChatMessages(m => [...m, { role: 'assistant', content: data.response }])
        setChatSession(data.sessionId)
      }
    } catch {}
    setChatLoading(false)
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
  }

  const handleTTS = async () => {
    if (!window.speechSynthesis) { toast.error('Lecture vocale non supportée par votre navigateur'); return }
    if (isSpeaking) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
      return
    }
    try {
      // Fetch rich TTS text from backend (summary + key points)
      const { data } = await axios.get(`/api/ai/tts/${doc._id}`)
      const text = data.success ? data.text : `${doc.title}. ${doc.aiSummary || doc.description || ''}`
      const lang = data.language === 'ar' ? 'ar-SA' : data.language === 'en' ? 'en-US' : 'fr-FR'

      // Split into chunks (browser TTS has 32kb limit per utterance)
      const chunkSize = 500
      const words = text.split(' ')
      const chunks = []
      let current = ''
      for (const word of words) {
        if ((current + ' ' + word).length > chunkSize) { chunks.push(current.trim()); current = word }
        else current += (current ? ' ' : '') + word
      }
      if (current) chunks.push(current.trim())

      setIsSpeaking(true)
      toast.success(`Lecture en cours — ${chunks.length} partie(s)`)

      let i = 0
      const speakNext = () => {
        if (i >= chunks.length) { setIsSpeaking(false); return }
        const utterance = new SpeechSynthesisUtterance(chunks[i++])
        utterance.lang  = lang
        utterance.rate  = 0.88
        utterance.pitch = 1.0
        utterance.volume = 1.0
        utterance.onend = speakNext
        utterance.onerror = () => { setIsSpeaking(false); toast.error('Erreur lecture vocale') }
        window.speechSynthesis.speak(utterance)
      }
      speakNext()
    } catch {
      toast.error('Erreur lors de la lecture vocale')
      setIsSpeaking(false)
    }
  }

  const handleComment = async (e) => {
    e.preventDefault()
    if (!requireAuth()) return
    if (!commentText.trim()) return
    setSubmittingComment(true)
    try {
      const { data } = await axios.post(`/api/documents/${doc._id}/comments`, {
        comment: commentText,
        rating: commentRating || undefined,
      })
      if (data.success) {
        setDoc(data.document)
        setCommentText('')
        setCommentRating(0)
        toast.success('Commentaire publié !')
      }
    } catch {}
    setSubmittingComment(false)
  }

  const canAccess = doc && (doc.isFree || inLibrary || doc.authorId?._id === user?._id || user?.role === 'admin')

  if (loading) return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-10">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1"><div className="shimmer rounded-2xl aspect-[3/4]" /></div>
        <div className="lg:col-span-2 space-y-4">
          {Array(6).fill(0).map((_, i) => <div key={i} className="shimmer h-6 rounded-xl" style={{ width: ['80%','60%','100%','70%','90%','50%'][i] }} />)}
        </div>
      </div>
    </div>
  )

  if (!doc) return (
    <div className="text-center py-20">
      <div className="text-5xl mb-4">📄</div>
      <h2 className="text-xl font-semibold text-white">Document introuvable</h2>
      <Link to="/explore" className="btn-brand mt-4 inline-flex">Retour à l'exploration</Link>
    </div>
  )

  const TABS = [
    { id: 'reader', label: '📖 Lire' },
    { id: 'overview', label: 'Aperçu' },
    { id: 'ai', label: '✨ IA', badge: true },
    { id: 'chat', label: '💬 Chatbot' },
    { id: 'comments', label: `Avis (${doc.numReviews || 0})` },
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-8 py-10">
      {/* Dispute modal */}
      {showDisputeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-400" /> Signaler ce document
              </h3>
              <button onClick={() => setShowDisputeModal(false)} className="text-white/40 hover:text-white">✕</button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm text-white/50 mb-1.5">Motif *</label>
                <select value={disputeForm.reason} onChange={e => setDisputeForm(f => ({ ...f, reason: e.target.value }))}
                  className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-500/50">
                  <option value="">Sélectionner...</option>
                  <option value="Contenu inexact">Contenu inexact</option>
                  <option value="Problème de lecture">Problème de lecture</option>
                  <option value="Contenu inapproprié">Contenu inapproprié</option>
                  <option value="Problème de téléchargement">Problème de téléchargement</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-white/50 mb-1.5">Description *</label>
                <textarea value={disputeForm.description} onChange={e => setDisputeForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Décrivez le problème en détail..." rows={4}
                  className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-3 text-white/80 placeholder-white/30 text-sm resize-none focus:outline-none focus:border-brand-500/50" />
              </div>
              <div className="flex gap-3">
                <button onClick={handleDispute} disabled={disputeLoading} className="flex-1 btn-brand py-2.5 disabled:opacity-50 flex items-center justify-center gap-2">
                  {disputeLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <AlertTriangle className="w-4 h-4" />}
                  Envoyer le signalement
                </button>
                <button onClick={() => setShowDisputeModal(false)} className="px-4 py-2.5 rounded-xl border border-white/10 text-white/50 hover:text-white transition-colors">
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Back */}
      <button onClick={() => navigate(-1)} className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-white transition-colors mb-8">
        <ArrowLeft className="w-4 h-4" /> Retour
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Left: Cover + Actions */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="sticky top-24"
          >
            {/* Cover */}
            <div className="relative rounded-2xl overflow-hidden shadow-brand-lg mb-6" style={{ aspectRatio: '3/4' }}>
              {doc.coverUrl ? (
                <img src={doc.coverUrl} alt={doc.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-brand-gradient/20 flex items-center justify-center">
                  <FileText className="w-20 h-20 text-brand-400/50" />
                </div>
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-dark-900/60 to-transparent" />
              {/* Price overlay */}
              <div className="absolute bottom-4 left-4 right-4">
                {doc.isFree
                  ? <span className="badge bg-emerald-500/80 text-white border-0 text-sm px-3 py-1">Gratuit</span>
                  : <span className="text-2xl font-bold text-white">{doc.price}€</span>
                }
              </div>
            </div>

            {/* CTA */}
            <div className="space-y-3">
              {canAccess ? (
                <>
                  {/* Read: opens /api/pdf/:id inline in browser */}
                  <a
                    href={`/api/pdf/${doc._id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn-brand w-full justify-center py-3"
                  >
                    <ExternalLink className="w-4 h-4" />
                    Lire le document
                  </a>
                  {/* Download: ?download=1 triggers Content-Disposition: attachment */}
                  <a
                    href={`/api/pdf/${doc._id}/download?download=1`}
                    className="btn-ghost w-full justify-center py-3"
                  >
                    <Download className="w-4 h-4" />
                    Télécharger le PDF
                  </a>
                  <button onClick={handleTTS} className={`btn-ghost w-full justify-center py-3 ${isSpeaking ? 'border-brand-500/40 text-brand-400' : ''}`}>
                    {isSpeaking ? <><VolumeX className="w-4 h-4" /> Arrêter la lecture</> : <><Volume2 className="w-4 h-4" /> Écouter (TTS)</>}
                  </button>
                  <button onClick={handleGetSummary} className="btn-outline w-full justify-center py-3">
                    <Brain className="w-4 h-4" />
                    Résumé IA
                  </button>
                </>
              ) : (
                <>
                  {doc.isFree ? (
                    <button onClick={handleAddToLibrary} className="btn-brand w-full justify-center py-3">
                      <BookOpen className="w-4 h-4" />
                      Ajouter à ma bibliothèque
                    </button>
                  ) : (
                    <button
                      onClick={handlePurchase}
                      disabled={purchasing}
                      className="btn-brand w-full justify-center py-3"
                    >
                      {purchasing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                      {purchasing ? 'Traitement...' : `Acheter — ${doc.price}€`}
                    </button>
                  )}
                </>
              )}

              {/* Like & Wishlist */}
              <div className="flex gap-2">
                <button onClick={handleLike} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${liked ? 'border-red-500/30 bg-red-500/10 text-red-400' : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white'}`}>
                  <Heart className={`w-4 h-4 ${liked ? 'fill-red-400' : ''}`} /> {doc.likes || 0}
                </button>
                <button onClick={handleWishlist} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border text-sm font-medium transition-all ${inWishlist ? 'border-amber-500/30 bg-amber-500/10 text-amber-400' : 'border-white/10 text-white/40 hover:border-white/20 hover:text-white'}`}>
                  <Star className={`w-4 h-4 ${inWishlist ? 'fill-amber-400' : ''}`} /> Favoris
                </button>
              </div>
              {/* Cart + Signaler */}
              <div className="flex gap-2">
                {!doc.isFree && !inLibrary && (
                  <button onClick={handleAddToCart} className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 text-white/40 hover:border-brand-500/30 hover:text-brand-400 text-sm font-medium transition-all">
                    <ShoppingCart className="w-4 h-4" /> Panier
                  </button>
                )}
                <button onClick={() => { if (!requireAuth()) return; setShowDisputeModal(true) }}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 text-white/30 hover:border-amber-500/30 hover:text-amber-400 text-sm transition-all">
                  <AlertTriangle className="w-4 h-4" /> Signaler
                </button>
              </div>
            </div>

            {/* Meta */}
            <div className="mt-6 space-y-2.5 text-sm">
              {[
                [Eye, `${doc.views} vues`],
                [Download, `${doc.downloads} téléchargements`],
                [FileText, doc.pageCount ? `${doc.pageCount} pages` : null],
                [Clock, doc.readTime ? `~${doc.readTime} min de lecture` : null],
              ].filter(([, v]) => v).map(([Icon, val], i) => (
                <div key={i} className="flex items-center gap-2 text-white/40">
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  {val}
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Right: Content */}
        <div className="lg:col-span-2">
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            {/* Category + tags */}
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="badge-brand">{doc.category}</span>
              {doc.tags?.map(t => (
                <span key={t} className="badge bg-white/5 text-white/40 border-white/10">
                  <Tag className="w-2.5 h-2.5" />{t}
                </span>
              ))}
            </div>

            {/* Title */}
            <h1 className="text-3xl md:text-4xl font-bold text-white mb-4 leading-tight">{doc.title}</h1>

            {/* Author & rating */}
            <div className="flex items-center gap-4 mb-6 pb-6 border-b border-white/[0.06]">
              <Link to={`/profile/${doc.authorId?._id}`} className="flex items-center gap-2.5 group">
                <div className="w-9 h-9 rounded-xl overflow-hidden bg-brand-gradient">
                  {doc.authorId?.avatar
                    ? <img src={doc.authorId.avatar} alt="" className="w-full h-full object-cover" />
                    : <span className="w-full h-full flex items-center justify-center text-sm font-bold">{doc.authorName?.[0]}</span>
                  }
                </div>
                <div>
                  <p className="text-sm font-medium text-white/80 group-hover:text-white transition-colors">{doc.authorName}</p>
                  <p className="text-xs text-white/30">Auteur</p>
                </div>
              </Link>
              {doc.rating > 0 && (
                <div className="flex items-center gap-2">
                  <StarRating rating={doc.rating} size="sm" />
                  <span className="text-sm font-semibold text-white">{doc.rating}</span>
                  <span className="text-sm text-white/30">({doc.numReviews} avis)</span>
                </div>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 p-1 bg-dark-700/50 rounded-xl border border-white/[0.06] mb-6">
              {TABS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-brand-gradient text-white shadow-brand'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              {activeTab === 'reader' && (
                <motion.div key="reader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {canAccess ? (
                    <div className="glass-card overflow-hidden">
                      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
                        <span className="text-sm font-medium text-white/60">📖 Lecture intégrée</span>
                        <div className="flex items-center gap-2">
                          <a href={`/api/pdf/${doc._id}`} target="_blank" rel="noopener noreferrer"
                            className="text-xs text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1">
                            <ExternalLink className="w-3.5 h-3.5" /> Ouvrir dans un nouvel onglet
                          </a>
                        </div>
                      </div>
                      <iframe
                        src={`/api/pdf/${doc._id}`}
                        className="w-full"
                        style={{ height: '80vh', border: 'none' }}
                        title={doc.title}
                      />
                    </div>
                  ) : (
                    <div className="glass-card p-12 text-center border-amber-500/20">
                      <Lock className="w-12 h-12 text-amber-400/50 mx-auto mb-4" />
                      <h3 className="font-semibold text-white mb-2">Accès restreint</h3>
                      <p className="text-white/50 text-sm mb-4">
                        {doc.isFree ? 'Ajoutez ce document à votre bibliothèque pour le lire.' : `Achetez ce document (${doc.price}€) pour le lire.`}
                      </p>
                    </div>
                  )}
                </motion.div>
              )}
              {activeTab === 'overview' && (
                <motion.div key="overview" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <div className="glass-card p-6 mb-6">
                    <h3 className="text-sm font-semibold text-white/60 uppercase tracking-wide mb-3">Description</h3>
                    <p className="text-white/70 leading-relaxed">{doc.description || 'Aucune description disponible.'}</p>
                  </div>
                  {doc.aiSummary && (
                    <div className="glass-card p-6 border-brand-500/20">
                      <h3 className="text-sm font-semibold text-brand-400 uppercase tracking-wide mb-3 flex items-center gap-2">
                        <Sparkles className="w-4 h-4" /> Résumé IA
                      </h3>
                      <p className="text-white/70 leading-relaxed text-sm">{doc.aiSummary}</p>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'ai' && (
                <motion.div key="ai" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                  {!canAccess && (
                    <div className="glass-card p-6 text-center border-amber-500/20">
                      <Lock className="w-8 h-8 text-amber-400 mx-auto mb-3" />
                      <p className="text-white/60 text-sm">Achetez ou ajoutez ce document à votre bibliothèque pour accéder aux fonctionnalités IA.</p>
                    </div>
                  )}
                  {canAccess && (
                    <>
                      {aiLoading && (
                        <div className="glass-card p-8 text-center">
                          <Loader2 className="w-8 h-8 text-brand-400 animate-spin mx-auto mb-3" />
                          <p className="text-white/40 text-sm">Analyse IA en cours...</p>
                        </div>
                      )}
                      {!aiLoading && !aiData && (
                        <div className="glass-card p-8 text-center">
                          <Brain className="w-12 h-12 text-brand-400/50 mx-auto mb-4" />
                          <h3 className="font-semibold text-white mb-2">Analyse IA disponible</h3>
                          <p className="text-white/40 text-sm mb-4">Générez un résumé intelligent et les points clés de ce document.</p>
                          <button onClick={handleGetSummary} className="btn-brand">
                            <Sparkles className="w-4 h-4" />
                            Générer le résumé IA
                          </button>
                        </div>
                      )}
                      {aiData && (
                        <>
                          <div className="glass-card p-6 border-brand-500/20">
                            <h3 className="text-sm font-semibold text-brand-400 flex items-center gap-2 mb-3">
                              <Brain className="w-4 h-4" /> Résumé intelligent
                            </h3>
                            <p className="text-white/70 leading-relaxed text-sm">{aiData.summary}</p>
                          </div>
                          {aiData.keyPoints?.length > 0 && (
                            <div className="glass-card p-6">
                              <h3 className="text-sm font-semibold text-white/60 mb-3">💡 Points clés</h3>
                              <ul className="space-y-2">
                                {aiData.keyPoints.map((pt, i) => (
                                  <li key={i} className="flex items-start gap-2.5 text-sm text-white/60">
                                    <Check className="w-4 h-4 text-brand-400 flex-shrink-0 mt-0.5" />
                                    {pt}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {aiData.keywords?.length > 0 && (
                            <div className="glass-card p-4">
                              <p className="text-xs text-white/40 mb-2">Mots-clés IA</p>
                              <div className="flex flex-wrap gap-2">
                                {aiData.keywords.map(k => (
                                  <span key={k} className="badge-brand text-xs">{k}</span>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}
                    </>
                  )}
                </motion.div>
              )}

              {activeTab === 'chat' && (
                <motion.div key="chat" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  {!canAccess ? (
                    <div className="glass-card p-6 text-center border-amber-500/20">
                      <Lock className="w-8 h-8 text-amber-400 mx-auto mb-3" />
                      <p className="text-white/60 text-sm">Accédez à ce document pour utiliser le chatbot IA.</p>
                    </div>
                  ) : (
                    <div className="glass-card flex flex-col" style={{ height: 480 }}>
                      {/* Chat header */}
                      <div className="px-4 py-3 border-b border-white/[0.06] flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl bg-brand-gradient flex items-center justify-center">
                          <Sparkles className="w-4 h-4 text-white" />
                        </div>
                        <div>
                          <p className="text-sm font-medium text-white">Assistant DocuMind IA</p>
                          <p className="text-xs text-white/30">Posez des questions sur ce document</p>
                        </div>
                      </div>

                      {/* Messages */}
                      <div className="flex-1 overflow-y-auto p-4 space-y-3">
                        {chatMessages.length === 0 && (
                          <div className="text-center py-8">
                            <MessageSquare className="w-10 h-10 text-white/15 mx-auto mb-3" />
                            <p className="text-sm text-white/30">Posez une question sur "{doc.title}"</p>
                            <div className="flex flex-wrap justify-center gap-2 mt-4">
                              {['Quel est le sujet principal ?', 'Quels sont les points clés ?', 'À qui s\'adresse ce document ?'].map(q => (
                                <button
                                  key={q}
                                  onClick={() => { setChatInput(q) }}
                                  className="text-xs px-3 py-1.5 rounded-full bg-white/5 border border-white/8 text-white/40 hover:text-white/70 hover:border-brand-500/30 transition-all"
                                >
                                  {q}
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                        {chatMessages.map((m, i) => (
                          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            {m.role === 'assistant' && (
                              <div className="w-7 h-7 rounded-lg bg-brand-gradient flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                                <Sparkles className="w-3.5 h-3.5 text-white" />
                              </div>
                            )}
                            <div className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                              m.role === 'user'
                                ? 'bg-brand-gradient text-white'
                                : 'bg-dark-600/60 border border-white/[0.06] text-white/80'
                            }`}>
                              {m.content}
                            </div>
                          </div>
                        ))}
                        {chatLoading && (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-brand-gradient flex items-center justify-center">
                              <Sparkles className="w-3.5 h-3.5 text-white" />
                            </div>
                            <div className="flex gap-1 px-4 py-3 rounded-2xl bg-dark-600/60 border border-white/[0.06]">
                              {[0,1,2].map(i => <div key={i} className="w-1.5 h-1.5 rounded-full bg-white/40 animate-bounce" style={{ animationDelay: `${i*0.15}s` }} />)}
                            </div>
                          </div>
                        )}
                        <div ref={chatEndRef} />
                      </div>

                      {/* Input */}
                      <form onSubmit={handleChat} className="p-3 border-t border-white/[0.06] flex gap-2">
                        <input
                          type="text"
                          placeholder="Posez votre question..."
                          value={chatInput}
                          onChange={e => setChatInput(e.target.value)}
                          className="flex-1 input-dark py-2.5 text-sm"
                        />
                        <button type="submit" disabled={!chatInput.trim() || chatLoading} className="btn-brand px-4 py-2.5">
                          <Send className="w-4 h-4" />
                        </button>
                      </form>
                    </div>
                  )}
                </motion.div>
              )}

              {activeTab === 'comments' && (
                <motion.div key="comments" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="space-y-4">
                  {/* Add comment */}
                  {user ? (
                    <div className="glass-card p-5">
                      <h3 className="text-sm font-semibold text-white mb-3">Laisser un avis</h3>
                      <form onSubmit={handleComment} className="space-y-3">
                        <div>
                          <p className="text-xs text-white/40 mb-2">Note (optionnel)</p>
                          <StarRating rating={commentRating} size="md" interactive onChange={setCommentRating} />
                        </div>
                        <textarea
                          rows={3}
                          placeholder="Partagez votre avis sur ce document..."
                          value={commentText}
                          onChange={e => setCommentText(e.target.value)}
                          className="input-dark resize-none"
                        />
                        <button type="submit" disabled={submittingComment || !commentText.trim()} className="btn-brand">
                          {submittingComment ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare className="w-4 h-4" />}
                          Publier l'avis
                        </button>
                      </form>
                    </div>
                  ) : (
                    <div className="glass-card p-5 text-center">
                      <p className="text-white/40 text-sm">Connectez-vous pour laisser un avis</p>
                    </div>
                  )}

                  {/* Comments list */}
                  {doc.comments?.length === 0 ? (
                    <div className="text-center py-10 text-white/30 text-sm">Aucun avis pour le moment. Soyez le premier !</div>
                  ) : (
                    doc.comments?.map((c, i) => (
                      <motion.div key={c._id || i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }} className="glass-card p-5">
                        <div className="flex items-start gap-3">
                          <div className="w-9 h-9 rounded-xl bg-brand-gradient/20 flex items-center justify-center flex-shrink-0">
                            {c.userAvatar
                              ? <img src={c.userAvatar} alt="" className="w-full h-full object-cover rounded-xl" />
                              : <span className="text-sm font-bold text-brand-400">{c.userName?.[0]}</span>
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                              <span className="text-sm font-medium text-white">{c.userName}</span>
                              {c.rating && <StarRating rating={c.rating} size="sm" />}
                              <span className="text-xs text-white/30">{new Date(c.date).toLocaleDateString('fr-FR')}</span>
                            </div>
                            <p className="text-sm text-white/60 leading-relaxed">{c.comment}</p>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
