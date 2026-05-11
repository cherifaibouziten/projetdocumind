import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { Upload, FileText, Image, Tag, DollarSign, Globe, BookOpen, Sparkles, Loader2, Check, X, ArrowLeft } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import axios from 'axios'
import toast from 'react-hot-toast'

const CATEGORIES = ['Sciences', 'Informatique', 'Littérature', 'Droit', 'Économie', 'Médecine', 'Histoire', 'Art & Design', 'Management', 'Mathématiques']
const LANGUAGES  = [{ value: 'fr', label: 'Français' }, { value: 'en', label: 'Anglais' }, { value: 'ar', label: 'Arabe' }]

export default function UploadDocument() {
  const { user, navigate } = useApp()
  const [form, setForm] = useState({
    title: '', description: '', category: '', tags: '', language: 'fr', isFree: 'true', price: '',
  })
  const [pdfFile,   setPdfFile]   = useState(null)
  const [coverFile, setCoverFile] = useState(null)
  const [coverPrev, setCoverPrev] = useState('')
  const [loading, setLoading]     = useState(false)
  const [success, setSuccess]     = useState(false)

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleCover = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setCoverFile(f)
    setCoverPrev(URL.createObjectURL(f))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!pdfFile) { toast.error('Sélectionnez un fichier PDF'); return }
    if (!form.title.trim()) { toast.error('Titre requis'); return }
    if (!form.category) { toast.error('Catégorie requise'); return }
    if (form.isFree === 'false' && !form.price) { toast.error('Prix requis pour un document payant'); return }

    setLoading(true)
    try {
      const fd = new FormData()
      fd.append('pdf',         pdfFile)
      if (coverFile) fd.append('cover', coverFile)
      Object.entries(form).forEach(([k, v]) => fd.append(k, v))

      const { data } = await axios.post('/api/documents', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      if (data.success) {
        setSuccess(true)
        toast.success('Document publié avec succès !')
        setTimeout(() => navigate('/author/documents'), 2000)
      } else {
        toast.error(data.message)
      }
    } catch (e) {
      toast.error('Erreur lors de la publication')
    }
    setLoading(false)
  }

  if (success) return (
    <div className="flex items-center justify-center h-full py-20">
      <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-center">
        <div className="w-20 h-20 rounded-3xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
          <Check className="w-10 h-10 text-emerald-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-2">Document publié !</h2>
        <p className="text-white/40">Redirection vers vos documents...</p>
      </motion.div>
    </div>
  )

  const [showConfigGuide, setShowConfigGuide] = React.useState(true)

  return (
    <div className="px-4 md:px-8 py-6 max-w-3xl">
      <div className="mb-8 flex items-center gap-3">
        <button type="button" onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white/70 transition-colors flex-shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Upload className="w-7 h-7 text-brand-400" />
            Publier un document
          </h1>
          <p className="text-white/40 text-sm mt-1">Partagez votre expertise avec la communauté DocuMind</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* PDF + Cover upload */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* PDF */}
          <div className="glass-card p-4">
            <p className="text-sm font-medium text-white mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4 text-brand-400" />
              Fichier PDF *
            </p>
            <label className={`block border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${pdfFile ? 'border-emerald-500/40 bg-emerald-500/5' : 'border-white/10 hover:border-brand-500/40 hover:bg-brand-500/5'}`}>
              {pdfFile ? (
                <div>
                  <FileText className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <p className="text-sm font-medium text-emerald-400 truncate">{pdfFile.name}</p>
                  <p className="text-xs text-white/30 mt-1">{(pdfFile.size / 1024 / 1024).toFixed(1)} MB</p>
                </div>
              ) : (
                <div>
                  <Upload className="w-8 h-8 text-white/20 mx-auto mb-2" />
                  <p className="text-xs text-white/40">Cliquez pour sélectionner un PDF</p>
                  <p className="text-xs text-white/20 mt-1">Max 50 MB</p>
                </div>
              )}
              <input type="file" accept=".pdf" className="sr-only" onChange={e => setPdfFile(e.target.files[0])} />
            </label>
          </div>

          {/* Cover */}
          <div className="glass-card p-4">
            <p className="text-sm font-medium text-white mb-3 flex items-center gap-2">
              <Image className="w-4 h-4 text-brand-400" />
              Image de couverture
            </p>
            <label className={`block border-2 border-dashed rounded-xl overflow-hidden cursor-pointer transition-all ${coverFile ? 'border-transparent' : 'border-white/10 hover:border-brand-500/40'}`} style={{ aspectRatio: '3/2' }}>
              {coverPrev ? (
                <img src={coverPrev} alt="Cover preview" className="w-full h-full object-cover" />
              ) : (
                <div className="h-full flex flex-col items-center justify-center gap-2">
                  <Image className="w-8 h-8 text-white/20" />
                  <p className="text-xs text-white/40">Image de couverture (opt.)</p>
                </div>
              )}
              <input type="file" accept="image/*" className="sr-only" onChange={handleCover} />
            </label>
          </div>
        </div>

        {/* Title */}
        <div className="glass-card p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Titre *</label>
            <input type="text" placeholder="Ex: Introduction à la Machine Learning" value={form.title} onChange={e => set('title', e.target.value)} className="input-dark" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Description</label>
            <textarea rows={4} placeholder="Décrivez le contenu, le public cible, ce que les lecteurs vont apprendre..." value={form.description} onChange={e => set('description', e.target.value)} className="input-dark resize-none" />
          </div>
        </div>

        {/* Category + Language */}
        <div className="glass-card p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Catégorie *</label>
            <select value={form.category} onChange={e => set('category', e.target.value)} className="input-dark cursor-pointer" required>
              <option value="">Sélectionner...</option>
              {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/60 mb-2">Langue</label>
            <select value={form.language} onChange={e => set('language', e.target.value)} className="input-dark cursor-pointer">
              {LANGUAGES.map(l => <option key={l.value} value={l.value}>{l.label}</option>)}
            </select>
          </div>
        </div>

        {/* Tags */}
        <div className="glass-card p-5">
          <label className="block text-sm font-medium text-white/60 mb-2 flex items-center gap-2">
            <Tag className="w-4 h-4" />
            Tags (séparés par des virgules)
          </label>
          <input type="text" placeholder="IA, Python, Machine Learning, Deep Learning" value={form.tags} onChange={e => set('tags', e.target.value)} className="input-dark" />
        </div>

        {/* Pricing */}
        <div className="glass-card p-5">
          <label className="block text-sm font-medium text-white/60 mb-3">Type de publication</label>
          <div className="grid grid-cols-2 gap-3 mb-4">
            {[['true', '🆓', 'Gratuit', 'Accessible à tous sans frais'], ['false', '💎', 'Payant', 'Définissez votre prix de vente']].map(([val, emoji, label, desc]) => (
              <button
                key={val}
                type="button"
                onClick={() => set('isFree', val)}
                className={`p-4 rounded-xl border-2 text-left transition-all ${form.isFree === val ? 'border-brand-500/50 bg-brand-500/10' : 'border-white/8 hover:border-white/15'}`}
              >
                <span className="text-xl mb-2 block">{emoji}</span>
                <p className="text-sm font-semibold text-white">{label}</p>
                <p className="text-xs text-white/40 mt-0.5">{desc}</p>
              </button>
            ))}
          </div>

          {form.isFree === 'false' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
              <label className="block text-sm font-medium text-white/60 mb-2">Prix (€)</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="number"
                  step="0.01"
                  min="0.99"
                  placeholder="9.99"
                  value={form.price}
                  onChange={e => set('price', e.target.value)}
                  className="input-dark pl-9"
                />
              </div>
              <p className="text-xs text-white/30 mt-1.5">Vous recevrez 80% du montant de chaque vente.</p>
            </motion.div>
          )}
        </div>

        {/* Submit */}
        <button type="submit" disabled={loading} className="btn-brand w-full justify-center py-4 text-base">
          {loading
            ? <><Loader2 className="w-5 h-5 animate-spin" /> Publication en cours...</>
            : <><Sparkles className="w-5 h-5" /> Publier le document</>
          }
        </button>

        {loading && (
          <p className="text-xs text-white/30 text-center">
            Upload en cours + génération du résumé IA... Cela peut prendre quelques secondes.
          </p>
        )}
      </form>
    </div>
  )
}
