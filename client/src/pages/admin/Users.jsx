import React, { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Users, Search, UserX, UserCheck, Trash2, Loader2, UserPlus, X, ChevronDown, Shield, Edit3 } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const ROLES = ['reader', 'author', 'admin']

export default function AdminUsers() {
  const [users,     setUsers]     = useState([])
  const [loading,   setLoading]   = useState(true)
  const [search,    setSearch]    = useState('')
  const [actioning, setActioning] = useState(null)
  const [showAdd,   setShowAdd]   = useState(false)
  const [editRole,  setEditRole]  = useState(null) // { id, current }

  // Add user form
  const [addForm, setAddForm] = useState({ name: '', email: '', password: '', role: 'reader' })
  const [addLoading, setAddLoading] = useState(false)

  useEffect(() => {
    axios.get('/api/users').then(r => {
      if (r.data.success) setUsers(r.data.users)
      setLoading(false)
    })
  }, [])

  const handleToggle = async (id) => {
    setActioning(id)
    const { data } = await axios.put(`/api/users/${id}/toggle`)
    if (data.success) setUsers(u => u.map(x => x._id === id ? data.user : x))
    else toast.error(data.message)
    setActioning(null)
  }

  const handleDelete = async (id) => {
    if (!confirm('Supprimer cet utilisateur définitivement ?')) return
    setActioning(id)
    const { data } = await axios.delete(`/api/users/${id}`)
    if (data.success) { setUsers(u => u.filter(x => x._id !== id)); toast.success('Utilisateur supprimé') }
    else toast.error(data.message)
    setActioning(null)
  }

  const handleRoleChange = async (id, role) => {
    setActioning(id)
    const { data } = await axios.put(`/api/users/${id}/role`, { role })
    if (data.success) {
      setUsers(u => u.map(x => x._id === id ? data.user : x))
      toast.success(`Rôle changé → ${role}`)
    } else toast.error(data.message)
    setEditRole(null)
    setActioning(null)
  }

  const handleAddUser = async (e) => {
    e.preventDefault()
    if (!addForm.name || !addForm.email || !addForm.password) { toast.error('Tous les champs sont requis'); return }
    setAddLoading(true)
    const fd = new FormData()
    fd.append('name', addForm.name); fd.append('email', addForm.email)
    fd.append('password', addForm.password); fd.append('role', addForm.role)
    if (addForm.avatarFile) fd.append('avatar', addForm.avatarFile)
    const { data } = await axios.post('/api/users', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
    if (data.success) {
      setUsers(u => [data.user, ...u])
      toast.success('Utilisateur créé !')
      setShowAdd(false)
      setAddForm({ name: '', email: '', password: '', role: 'reader', avatarFile: null, avatarPreview: '' })
    } else toast.error(data.message)
    setAddLoading(false)
  }

  const filtered = users.filter(u =>
    !search ||
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  )

  const roleBadge = (role) => {
    if (role === 'admin')  return 'bg-red-500/15 text-red-300 border-red-500/20'
    if (role === 'author') return 'bg-brand-500/15 text-brand-300 border-brand-500/20'
    return 'bg-white/5 text-white/40 border-white/10'
  }

  return (
    <div className="px-4 md:px-8 py-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8 flex-wrap gap-4">
        <h1 className="text-2xl font-bold text-white flex items-center gap-2">
          <Users className="w-7 h-7 text-brand-400" />
          Utilisateurs
          <span className="badge bg-white/5 border-white/10 text-white/40 ml-1">{users.length}</span>
        </h1>
        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative w-56">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text" placeholder="Rechercher..."
              value={search} onChange={e => setSearch(e.target.value)}
              className="input-dark pl-9 h-10 w-full"
            />
          </div>
          <button onClick={() => setShowAdd(true)} className="btn-brand h-10 px-4">
            <UserPlus className="w-4 h-4" />
            Ajouter
          </button>
        </div>
      </div>

      {/* Add user modal */}
      <AnimatePresence>
        {showAdd && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={e => e.target === e.currentTarget && setShowAdd(false)}
          >
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <motion.div
              initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 20 }}
              className="relative glass-card p-6 w-full max-w-md"
            >
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-lg font-bold text-white">Nouvel utilisateur</h3>
                <button onClick={() => setShowAdd(false)} className="text-white/40 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleAddUser} className="space-y-4">
                <div>
                  <label className="block text-sm text-white/60 mb-1.5">Nom complet</label>
                  <input type="text" value={addForm.name} onChange={e => setAddForm(f => ({ ...f, name: e.target.value }))}
                    className="input-dark" placeholder="Jean Dupont" required />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1.5">Email</label>
                  <input type="email" value={addForm.email} onChange={e => setAddForm(f => ({ ...f, email: e.target.value }))}
                    className="input-dark" placeholder="jean@example.com" required />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1.5">Mot de passe</label>
                  <input type="password" value={addForm.password} onChange={e => setAddForm(f => ({ ...f, password: e.target.value }))}
                    className="input-dark" placeholder="Min. 6 caractères" required />
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1.5">Rôle</label>
                  <select value={addForm.role} onChange={e => setAddForm(f => ({ ...f, role: e.target.value }))} className="input-dark cursor-pointer">
                    {ROLES.map(r => <option key={r} value={r}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-white/60 mb-1.5">Photo de profil (optionnel)</label>
                  <input type="file" accept="image/*" onChange={e => {
                    const f = e.target.files[0]
                    if (f) setAddForm(af => ({ ...af, avatarFile: f, avatarPreview: URL.createObjectURL(f) }))
                  }} className="w-full text-sm text-white/50 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:bg-brand-500/20 file:text-brand-400 hover:file:bg-brand-500/30 cursor-pointer" />
                  {addForm.avatarPreview && <img src={addForm.avatarPreview} alt="" className="w-12 h-12 rounded-xl mt-2 object-cover" />}
                </div>
                <div className="flex gap-3 pt-2">
                  <button type="button" onClick={() => setShowAdd(false)} className="btn-ghost flex-1 justify-center">Annuler</button>
                  <button type="submit" disabled={addLoading} className="btn-brand flex-1 justify-center">
                    {addLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                    Créer
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Table */}
      {loading ? (
        <div className="space-y-3">
          {Array(5).fill(0).map((_, i) => <div key={i} className="shimmer h-16 rounded-xl" />)}
        </div>
      ) : (
        <div className="glass-card overflow-x-auto">
          <table className="w-full min-w-[640px]">
            <thead>
              <tr className="border-b border-white/[0.06]">
                {['Utilisateur', 'Rôle', 'Statut', 'Inscrit le', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-white/40 uppercase tracking-wide">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={5} className="px-4 py-12 text-center text-white/30 text-sm">Aucun utilisateur trouvé</td></tr>
              ) : filtered.map((u, i) => (
                <motion.tr key={u._id}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }}
                  className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                >
                  {/* User info */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-brand-gradient flex-shrink-0 overflow-hidden flex items-center justify-center text-sm font-bold">
                        {u.avatar ? <img src={u.avatar} alt="" className="w-full h-full object-cover" /> : u.name?.[0]?.toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-white/80">{u.name}</p>
                        <p className="text-xs text-white/30">{u.email}</p>
                      </div>
                    </div>
                  </td>

                  {/* Role with inline edit */}
                  <td className="px-4 py-3">
                    <div className="relative">
                      <button
                        onClick={() => setEditRole(editRole?.id === u._id ? null : { id: u._id, current: u.role })}
                        className={`badge border flex items-center gap-1.5 cursor-pointer hover:opacity-80 transition-opacity ${roleBadge(u.role)}`}
                      >
                        {u.role}
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      <AnimatePresence>
                        {editRole?.id === u._id && (
                          <motion.div
                            initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 4 }}
                            className="absolute left-0 top-full mt-1 z-20 glass-card py-1 min-w-[120px] shadow-xl"
                          >
                            {ROLES.map(role => (
                              <button
                                key={role}
                                onClick={() => handleRoleChange(u._id, role)}
                                disabled={actioning === u._id}
                                className={`w-full text-left px-3 py-2 text-sm transition-colors ${
                                  role === u.role ? 'text-brand-400 bg-brand-500/10' : 'text-white/60 hover:text-white hover:bg-white/5'
                                }`}
                              >
                                {role.charAt(0).toUpperCase() + role.slice(1)}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span className={`badge border ${u.isActive ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/20' : 'bg-red-500/15 text-red-300 border-red-500/20'}`}>
                      {u.isActive ? 'Actif' : 'Suspendu'}
                    </span>
                  </td>

                  {/* Date */}
                  <td className="px-4 py-3 text-sm text-white/30">
                    {new Date(u.createdAt).toLocaleDateString('fr-FR')}
                  </td>

                  {/* Actions */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggle(u._id)}
                        disabled={actioning === u._id}
                        title={u.isActive ? 'Suspendre' : 'Activer'}
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-amber-400 hover:bg-amber-500/10 transition-all"
                      >
                        {actioning === u._id
                          ? <Loader2 className="w-4 h-4 animate-spin" />
                          : u.isActive ? <UserX className="w-4 h-4" /> : <UserCheck className="w-4 h-4" />
                        }
                      </button>
                      {u.role !== 'admin' && (
                        <button
                          onClick={() => handleDelete(u._id)}
                          disabled={actioning === u._id}
                          title="Supprimer"
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
