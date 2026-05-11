import React from 'react'
import { Outlet, NavLink, Navigate, Link } from 'react-router-dom'
import { LayoutDashboard, Users, FileText, Tag, UserCheck, Shield, ShoppingCart, AlertTriangle, Gift, TrendingUp, ArrowLeft, Home } from 'lucide-react'
import { useApp } from '../../context/AppContext'

export default function AdminLayout() {
  const { user, loading } = useApp()
  if (loading) return null
  if (!user || user.role !== 'admin') return <Navigate to="/" />

  const navItems = [
    { to: '/admin',              icon: LayoutDashboard, label: 'Dashboard',          end: true },
    { to: '/admin/users',        icon: Users,           label: 'Utilisateurs' },
    { to: '/admin/documents',    icon: FileText,        label: 'Documents' },
    { to: '/admin/categories',   icon: Tag,             label: 'Catégories' },
    { to: '/admin/authors',      icon: UserCheck,       label: 'Demandes auteurs' },
    { to: '/admin/orders',       icon: ShoppingCart,    label: 'Commandes' },
    { to: '/admin/promotions',   icon: Gift,            label: 'Promotions' },
    { to: '/admin/disputes',     icon: AlertTriangle,   label: 'Signalements' },
    { to: '/admin/predictions',  icon: TrendingUp,      label: 'Prédictions ML' },
  ]

  return (
    <div className="flex min-h-screen">
      <aside className="hidden md:flex w-64 flex-shrink-0 flex-col bg-dark-800/60 backdrop-blur-sm border-r border-white/[0.06] pt-20 px-4 pb-6">
        <div className="mb-6 px-3">
          <div className="flex items-center gap-2 mb-3">
            <Shield className="w-4 h-4 text-red-400" />
            <p className="text-xs font-semibold text-red-400/80 uppercase tracking-widest">Administration</p>
          </div>
          <p className="text-sm font-medium text-white">{user.name}</p>
          {/* Back to site */}
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
