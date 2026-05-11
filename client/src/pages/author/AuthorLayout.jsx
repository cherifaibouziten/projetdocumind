import React from 'react'
import { Outlet, NavLink, Navigate, Link } from 'react-router-dom'
import { LayoutDashboard, FileText, Upload, Home, TrendingUp } from 'lucide-react'
import { useApp } from '../../context/AppContext'

export default function AuthorLayout() {
  const { user, loading } = useApp()
  if (loading) return null
  if (!user || (user.role !== 'author' && user.role !== 'admin')) return <Navigate to="/become-author" />

  const navItems = [
    { to: '/author',           icon: LayoutDashboard, label: 'Tableau de bord', end: true },
    { to: '/author/documents', icon: FileText,         label: 'Mes documents' },
    { to: '/author/upload',    icon: Upload,           label: 'Publier' },
  ]

  return (
    <div className="flex min-h-screen">
      <aside className="hidden md:flex w-64 flex-shrink-0 flex-col bg-dark-800/60 backdrop-blur-sm border-r border-white/[0.06] pt-20 px-4 pb-6">
        <div className="mb-6 px-3">
          <p className="text-xs font-semibold text-white/30 uppercase tracking-widest mb-1">Espace Auteur</p>
          <p className="text-sm font-medium text-white">{user.name}</p>
          <Link to="/" className="mt-3 flex items-center gap-1.5 text-xs text-white/30 hover:text-white/60 transition-colors">
            <Home className="w-3 h-3" /> Retour au site
          </Link>
        </div>
        <nav className="space-y-0.5 flex-1">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink key={to} to={to} end={end} className={({ isActive }) => isActive ? 'sidebar-item-active' : 'sidebar-item'}>
              <Icon className="w-4 h-4" />
              {label}
            </NavLink>
          ))}
        </nav>
      </aside>
      <main className="flex-1 min-w-0 pt-4 pb-10">
        <Outlet />
      </main>
    </div>
  )
}
