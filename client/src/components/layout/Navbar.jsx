import React, { useState, useEffect, useRef } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, BookOpen, User, LogOut, LayoutDashboard, Upload, Shield, Menu, X, ChevronDown, Library, Sparkles, Bell, ShoppingCart } from 'lucide-react'
import { useApp } from '../../context/AppContext'

export default function Navbar() {
  const { user, logout, openAuth, searchQuery, setSearchQuery } = useApp()
  const [scrolled, setScrolled]     = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const location = useLocation()
  const navigate  = useNavigate()
  const userMenuRef = useRef()
  const searchRef   = useRef()

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', handler)
    return () => window.removeEventListener('scroll', handler)
  }, [])

  useEffect(() => {
    setMobileOpen(false)
    setUserMenuOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleSearch = (e) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      navigate(`/explore?search=${encodeURIComponent(searchQuery.trim())}`)
      setSearchOpen(false)
    }
  }

  const navLinks = [
    { href: '/explore', label: 'Explorer' },
    { href: '/explore?filter=free', label: 'Gratuits' },
    { href: '/explore?sort=popular', label: 'Populaires' },
  ]

  const isActive = (href) => location.pathname === href || (href !== '/' && location.pathname.startsWith(href.split('?')[0]))

  const getRoleLabel = () => {
    if (user?.role === 'admin') return { label: 'Admin', color: 'text-red-400' }
    if (user?.role === 'author') return { label: 'Auteur', color: 'text-brand-400' }
    return { label: 'Lecteur', color: 'text-white/50' }
  }

  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-dark-900/80 backdrop-blur-xl border-b border-white/[0.06] shadow-lg'
            : 'bg-transparent'
        }`}
        initial={{ y: -80 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <div className="flex items-center h-16 gap-4">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 flex-shrink-0 group">
              <div className="w-8 h-8 rounded-lg bg-brand-gradient flex items-center justify-center shadow-brand-sm group-hover:shadow-brand transition-all duration-300">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-lg tracking-tight">
                <span className="gradient-text">Docu</span>
                <span className="text-white">Mind</span>
              </span>
            </Link>

            {/* Nav links — desktop */}
            <nav className="hidden md:flex items-center gap-1 ml-4">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  to={link.href}
                  className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                    isActive(link.href)
                      ? 'text-white bg-white/8'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>

            {/* Search bar — desktop */}
            <div className="hidden md:flex flex-1 max-w-sm mx-4">
              <form onSubmit={handleSearch} className="w-full relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 pointer-events-none" />
                <input
                  type="text"
                  placeholder="Rechercher un document..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 rounded-xl bg-white/5 border border-white/8
                             text-sm text-white placeholder-white/30
                             focus:outline-none focus:ring-1 focus:ring-brand-500/40 focus:border-brand-500/30
                             transition-all duration-200"
                />
              </form>
            </div>

            <div className="flex-1" />

            {/* Actions */}
            <div className="flex items-center gap-2">
              {/* Mobile search */}
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="md:hidden p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all"
              >
                <Search className="w-5 h-5" />
              </button>

              {user ? (
                <>
                  {/* Upload button for authors */}
                  {(user.role === 'author' || user.role === 'admin') && (
                    <Link
                      to="/author/upload"
                      className="hidden sm:flex btn-brand text-xs px-4 py-2"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      Publier
                    </Link>
                  )}

                  {/* User menu */}
                  <div className="relative" ref={userMenuRef}>
                    <button
                      onClick={() => setUserMenuOpen(!userMenuOpen)}
                      className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-xl bg-white/5 border border-white/8 hover:border-brand-500/30 transition-all duration-200"
                    >
                      <div className="w-7 h-7 rounded-lg overflow-hidden bg-brand-gradient flex-shrink-0">
                        {user.avatar
                          ? <img src={user.avatar} alt={user.name} className="w-full h-full object-cover" />
                          : <span className="w-full h-full flex items-center justify-center text-xs font-bold text-white">
                              {user.name?.[0]?.toUpperCase()}
                            </span>
                        }
                      </div>
                      <span className="hidden sm:block text-sm font-medium text-white/80 max-w-[120px] truncate">{user.name}</span>
                      <ChevronDown className={`w-3.5 h-3.5 text-white/40 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} />
                    </button>

                    <AnimatePresence>
                      {userMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: 8, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          exit={{ opacity: 0, y: 8, scale: 0.95 }}
                          transition={{ duration: 0.15 }}
                          className="absolute right-0 top-full mt-2 w-56 glass-card py-1.5 shadow-xl"
                        >
                          {/* User info */}
                          <div className="px-4 py-3 border-b border-white/[0.06]">
                            <p className="text-sm font-semibold text-white truncate">{user.name}</p>
                            <p className="text-xs text-white/40 truncate">{user.email}</p>
                            <span className={`text-xs font-medium mt-1 block ${getRoleLabel().color}`}>{getRoleLabel().label}</span>
                          </div>

                          <div className="py-1">
                            <UserMenuItem icon={LayoutDashboard} label="Tableau de bord" to="/dashboard" />
                            <UserMenuItem icon={Library} label="Ma bibliothèque" to="/library" />
                            <UserMenuItem icon={User} label="Mon profil" to="/profile" />
                            {(user.role === 'author' || user.role === 'admin') && (
                              <UserMenuItem icon={Upload} label="Mes documents" to="/author/documents" />
                            )}
                            {user.role === 'admin' && (
                              <UserMenuItem icon={Shield} label="Administration" to="/admin" />
                            )}
                          </div>

                          <div className="border-t border-white/[0.06] py-1">
                            <button
                              onClick={logout}
                              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors"
                            >
                              <LogOut className="w-4 h-4" />
                              Déconnexion
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </>
              ) : (
                <div className="flex items-center gap-2">
                  <button onClick={() => openAuth('login')} className="btn-ghost text-sm px-4 py-2">
                    Connexion
                  </button>
                  <button onClick={() => openAuth('register')} className="btn-brand text-sm px-4 py-2">
                    <Sparkles className="w-3.5 h-3.5" />
                    Commencer
                  </button>
                </div>
              )}

              {/* Mobile menu toggle */}
              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="md:hidden p-2 rounded-lg text-white/60 hover:text-white hover:bg-white/5 transition-all"
              >
                {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile search dropdown */}
        <AnimatePresence>
          {searchOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/[0.06] bg-dark-900/95 backdrop-blur-xl"
            >
              <form onSubmit={handleSearch} className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    autoFocus
                    type="text"
                    placeholder="Rechercher..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input-dark pl-9"
                  />
                </div>
              </form>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile menu */}
        <AnimatePresence>
          {mobileOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-white/[0.06] bg-dark-900/95 backdrop-blur-xl"
            >
              <div className="p-4 space-y-1">
                {navLinks.map(link => (
                  <Link
                    key={link.href}
                    to={link.href}
                    className="flex items-center px-4 py-2.5 rounded-xl text-sm font-medium text-white/70 hover:text-white hover:bg-white/5 transition-all"
                  >
                    {link.label}
                  </Link>
                ))}
                {!user && (
                  <div className="pt-2 flex flex-col gap-2">
                    <button onClick={() => openAuth('login')} className="btn-ghost w-full justify-center">Connexion</button>
                    <button onClick={() => openAuth('register')} className="btn-brand w-full justify-center">Commencer gratuitement</button>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.header>

      {/* Spacer */}
      <div className="h-16" />
    </>
  )
}

function UserMenuItem({ icon: Icon, label, to }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-4 py-2.5 text-sm text-white/70 hover:text-white hover:bg-white/5 transition-colors"
    >
      <Icon className="w-4 h-4 text-white/40" />
      {label}
    </Link>
  )
}
