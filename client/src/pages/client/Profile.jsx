import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { User, Lock, Camera, Save, Eye, EyeOff, Loader2, BookOpen, Star, Download, ArrowLeft } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function Profile() {
  const { user, setUser, navigate } = useApp()

  const [tab, setTab]           = useState('profile')
  const [name, setName]         = useState('')
  const [bio, setBio]           = useState('')
  const [avatarFile, setAvatarFile]       = useState(null)
  const [avatarPreview, setAvatarPreview] = useState('')
  const [saving, setSaving]     = useState(false)
  const [curPw, setCurPw]       = useState('')
  const [newPw, setNewPw]       = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [changingPw, setChangingPw] = useState(false)

  // Init from user after all hooks
  React.useEffect(() => {
    if (user) {
      setName(user.name || '')
      setBio(user.bio || '')
      setAvatarPreview(user.avatar || '')
    }
  }, [user])

  if (!user) {
    navigate('/')
    return null
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files[0]
    if (!file) return
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleSave = async (e) => {
    e.preventDefault()
    if (!name.trim()) { toast.error('Le nom est requis'); return }
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('name', name)
      fd.append('bio', bio)
      if (avatarFile) fd.append('avatar', avatarFile)
      const { data } = await axios.put('/api/profile', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      if (data.success) {
        setUser(data.user)
        setAvatarFile(null)
        toast.success('Profil mis à jour !')
      } else {
        toast.error(data.message)
      }
    } catch { toast.error('Erreur lors de la sauvegarde') }
    setSaving(false)
  }

  const handleChangePassword = async (e) => {
    e.preventDefault()
    if (!curPw || !newPw) { toast.error('Remplissez les deux champs'); return }
    if (newPw.length < 6) { toast.error('Nouveau mot de passe trop court'); return }
    setChangingPw(true)
    try {
      const { data } = await axios.put('/api/profile/password', { currentPassword: curPw, newPassword: newPw })
      if (data.success) {
        toast.success('Mot de passe changé !')
        setCurPw(''); setNewPw('')
      } else toast.error(data.message)
    } catch { toast.error('Erreur') }
    setChangingPw(false)
  }

  const roleLabel = user.role === 'admin' ? 'Admin' : user.role === 'author' ? 'Auteur' : 'Lecteur'
  const roleBadgeClass = user.role === 'admin' ? 'bg-red-500/15 text-red-300 border-red-500/20' : user.role === 'author' ? 'badge-brand' : 'bg-white/5 text-white/40 border-white/10'

  return (
    <div className="max-w-2xl mx-auto px-4 md:px-8 py-10">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white/70 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-2xl font-bold text-white">Mon profil</h1>
      </div>

      {/* Stats bar */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { icon: BookOpen, label: 'Bibliothèque', value: user.library?.length || 0, color: 'text-brand-400' },
          { icon: Star,     label: 'Favoris',      value: user.wishlist?.length || 0, color: 'text-amber-400' },
          { icon: Download, label: 'Télécharg.',   value: '—',                         color: 'text-emerald-400' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="glass-card p-4 text-center">
            <Icon className={`w-5 h-5 ${color} mx-auto mb-1`} />
            <div className="text-lg font-bold text-white">{value}</div>
            <div className="text-xs text-white/40">{label}</div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[['profile', 'Informations'], ['security', 'Sécurité']].map(([id, label]) => (
          <button key={id} onClick={() => setTab(id)}
            className={`px-4 py-2 rounded-xl text-sm font-medium border transition-all ${
              tab === id ? 'bg-brand-500/15 border-brand-500/30 text-brand-300' : 'border-white/10 text-white/50 hover:text-white'
            }`}
          >{label}</button>
        ))}
      </div>

      {tab === 'profile' && (
        <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleSave} className="space-y-5">
          {/* Avatar + name preview */}
          <div className="glass-card p-6 flex items-center gap-5">
            <div className="relative flex-shrink-0">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-brand-gradient">
                {avatarPreview
                  ? <img src={avatarPreview} alt="" className="w-full h-full object-cover" />
                  : <span className="w-full h-full flex items-center justify-center text-2xl font-bold text-white">
                      {user.name?.[0]?.toUpperCase()}
                    </span>
                }
              </div>
              <label className="absolute -bottom-1.5 -right-1.5 w-7 h-7 rounded-lg bg-brand-gradient flex items-center justify-center cursor-pointer shadow-brand hover:opacity-90 transition-opacity">
                <Camera className="w-3.5 h-3.5 text-white" />
                <input type="file" accept="image/*" className="sr-only" onChange={handleAvatarChange} />
              </label>
            </div>
            <div>
              <p className="font-semibold text-white text-lg">{user.name}</p>
              <p className="text-sm text-white/40 mb-1.5">{user.email}</p>
              <span className={`badge border text-xs ${roleBadgeClass}`}>{roleLabel}</span>
            </div>
          </div>

          <div className="glass-card p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Nom complet *</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className="input-dark"
                placeholder="Votre nom"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-white/60 mb-2">Bio</label>
              <textarea
                rows={3}
                value={bio}
                onChange={e => setBio(e.target.value)}
                placeholder="Parlez de vous en quelques mots..."
                className="input-dark resize-none"
              />
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn-brand w-full justify-center py-3">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            {saving ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
          </button>
        </motion.form>
      )}

      {tab === 'security' && (
        <motion.form initial={{ opacity: 0 }} animate={{ opacity: 1 }} onSubmit={handleChangePassword} className="glass-card p-6 space-y-5">
          <h3 className="font-semibold text-white">Changer le mot de passe</h3>
          <div>
            <label className="block text-sm text-white/60 mb-2">Mot de passe actuel</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                value={curPw}
                onChange={e => setCurPw(e.target.value)}
                className="input-dark pr-10"
                placeholder="Mot de passe actuel"
              />
              <button type="button" onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/70">
                {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm text-white/60 mb-2">Nouveau mot de passe</label>
            <input
              type={showPw ? 'text' : 'password'}
              value={newPw}
              onChange={e => setNewPw(e.target.value)}
              className="input-dark"
              placeholder="Min. 6 caractères"
            />
          </div>
          <button type="submit" disabled={changingPw || !curPw || !newPw} className="btn-brand w-full justify-center py-3">
            {changingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            {changingPw ? 'Modification...' : 'Changer le mot de passe'}
          </button>
        </motion.form>
      )}
    </div>
  )
}
