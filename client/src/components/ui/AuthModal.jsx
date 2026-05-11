import React, { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Eye, EyeOff, BookOpen, Sparkles, Lock, Mail, User } from 'lucide-react'
import { useApp } from '../../context/AppContext'
import axios from 'axios'
import toast from 'react-hot-toast'

export default function AuthModal() {
  const { setShowAuth, authMode, setAuthMode, setUser } = useApp()
  const [mode, setMode] = useState(authMode || 'login')
  const [loading, setLoading] = useState(false)
  const [showPass, setShowPass] = useState(false)
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [errors, setErrors] = useState({})

  const validate = () => {
    const errs = {}
    if (mode === 'register' && !form.name.trim()) errs.name = 'Nom requis'
    if (!form.email.trim()) errs.email = 'Email requis'
    if (!form.password || form.password.length < 6) errs.password = 'Mot de passe min. 6 caractères'
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return
    setLoading(true)
    try {
      const endpoint = mode === 'login' ? '/api/auth/login' : '/api/auth/register'
      const { data } = await axios.post(endpoint, form)
      if (data.success) {
        setUser(data.user)
        toast.success(mode === 'login' ? `Bienvenue, ${data.user.name} !` : 'Compte créé avec succès !')
        setShowAuth(false)
      } else {
        toast.error(data.message)
      }
    } catch (e) {
      toast.error('Une erreur est survenue')
    }
    setLoading(false)
  }

  const switchMode = (m) => {
    setMode(m)
    setErrors({})
    setForm({ name: '', email: '', password: '' })
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && setShowAuth(false)}
      >
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ type: 'spring', duration: 0.4 }}
          className="relative w-full max-w-md"
        >
          {/* Glow behind card */}
          <div className="absolute -inset-4 bg-brand-500/10 rounded-3xl blur-2xl" />

          <div className="relative glass-card p-8">
            {/* Close */}
            <button
              onClick={() => setShowAuth(false)}
              className="absolute top-4 right-4 w-8 h-8 rounded-lg flex items-center justify-center text-white/40 hover:text-white hover:bg-white/10 transition-all"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Logo */}
            <div className="flex flex-col items-center mb-8">
              <div className="w-12 h-12 rounded-2xl bg-brand-gradient flex items-center justify-center shadow-brand mb-3">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h2 className="text-xl font-bold text-white">
                {mode === 'login' ? 'Bon retour !' : 'Rejoindre DocuMind'}
              </h2>
              <p className="text-sm text-white/40 mt-1 text-center">
                {mode === 'login'
                  ? 'Connectez-vous pour accéder à votre bibliothèque'
                  : 'Créez votre compte et accédez à des milliers de documents'}
              </p>
            </div>

            {/* Tab switcher */}
            <div className="flex bg-dark-600/60 rounded-xl p-1 mb-6">
              {['login', 'register'].map(m => (
                <button
                  key={m}
                  onClick={() => switchMode(m)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    mode === m
                      ? 'bg-brand-gradient text-white shadow-brand'
                      : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  {m === 'login' ? 'Connexion' : 'Inscription'}
                </button>
              ))}
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {mode === 'register' && (
                  <motion.div
                    key="name"
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                  >
                    <FormField
                      icon={User}
                      type="text"
                      placeholder="Votre nom complet"
                      value={form.name}
                      onChange={v => setForm(f => ({ ...f, name: v }))}
                      error={errors.name}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              <FormField
                icon={Mail}
                type="email"
                placeholder="votre@email.com"
                value={form.email}
                onChange={v => setForm(f => ({ ...f, email: v }))}
                error={errors.email}
              />

              <div className="relative">
                <FormField
                  icon={Lock}
                  type={showPass ? 'text' : 'password'}
                  placeholder="Mot de passe"
                  value={form.password}
                  onChange={v => setForm(f => ({ ...f, password: v }))}
                  error={errors.password}
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-3 top-3 text-white/30 hover:text-white/70 transition-colors"
                >
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="btn-brand w-full justify-center py-3 text-base mt-2"
              >
                {loading ? (
                  <div className="w-5 h-5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    {mode === 'login' ? 'Se connecter' : 'Créer mon compte'}
                  </>
                )}
              </button>
            </form>

            {/* Demo accounts hint */}
            <div className="mt-6 p-3 rounded-xl bg-white/3 border border-white/[0.06]">
              <p className="text-xs text-white/30 text-center mb-1.5 font-medium">Comptes de démo</p>
              <div className="space-y-1">
                {[
                  ['admin@documind.app', 'Admin'],
                  ['sophie@documind.app', 'Auteure'],
                  ['marie@documind.app', 'Lectrice'],
                ].map(([email, role]) => (
                  <button
                    key={email}
                    type="button"
                    onClick={() => setForm({ name: role, email, password: 'password123' })}
                    className="w-full text-left text-xs px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors"
                  >
                    <span className="text-brand-400 font-medium">{role}</span>
                    <span className="text-white/30 ml-2">{email}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

function FormField({ icon: Icon, type, placeholder, value, onChange, error }) {
  return (
    <div>
      <div className="relative">
        <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={e => onChange(e.target.value)}
          className={`input-dark pl-10 ${error ? 'border-red-500/50 focus:ring-red-500/30' : ''}`}
        />
      </div>
      {error && <p className="text-xs text-red-400 mt-1 pl-1">{error}</p>}
    </div>
  )
}
