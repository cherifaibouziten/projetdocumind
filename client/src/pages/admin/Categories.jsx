/**
 * Admin Categories — with image upload support
 */
import React, { useEffect, useState, useRef } from 'react'
import { Tag, Plus, Trash2, Edit, Save, X, Loader2, Image, Check } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast'

const ICONS = ['📄','💻','📐','🔬','🌍','📊','📜','⚖️','🏥','🤔','📚','🎨','🎵','🏋️','🍳','✈️','💼','🌱']
const COLORS = ['#6366f1','#8b5cf6','#a855f7','#ec4899','#10b981','#f59e0b','#3b82f6','#ef4444','#06b6d4','#84cc16','#f97316','#64748b']

export default function AdminCategories() {
  const [cats, setCats]       = useState([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editId, setEditId]   = useState(null)
  const [form, setForm]       = useState({ name: '', icon: '📄', color: '#6366f1', description: '' })
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState('')
  const [saving, setSaving]   = useState(false)
  const imgRef = useRef()

  const load = () => {
    axios.get('/api/categories').then(r => { if (r.data.success) setCats(r.data.categories) }).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const openCreate = () => {
    setEditId(null); setImageFile(null); setImagePreview('')
    setForm({ name: '', icon: '📄', color: '#6366f1', description: '' })
    setShowForm(true)
  }
  const openEdit = (c) => {
    setEditId(c._id); setImageFile(null); setImagePreview(c.image || '')
    setForm({ name: c.name, icon: c.icon || '📄', color: c.color || '#6366f1', description: c.description || '' })
    setShowForm(true)
  }

  const handleImage = (e) => {
    const f = e.target.files[0]
    if (!f) return
    setImageFile(f)
    setImagePreview(URL.createObjectURL(f))
  }

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Nom requis'); return }
    setSaving(true)
    try {
      const fd = new FormData()
      fd.append('name', form.name.trim())
      fd.append('icon', form.icon)
      fd.append('color', form.color)
      fd.append('description', form.description)
      if (imageFile) fd.append('image', imageFile)

      if (editId) {
        const { data } = await axios.put(`/api/categories/${editId}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        if (data.success) { toast.success('Mise à jour'); load(); setShowForm(false) }
        else toast.error(data.message)
      } else {
        const { data } = await axios.post('/api/categories', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        if (data.success) { toast.success('Catégorie créée !'); load(); setShowForm(false) }
        else toast.error(data.message)
      }
    } catch (e) { toast.error(e.message) }
    setSaving(false)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Supprimer cette catégorie ?')) return
    await axios.delete(`/api/categories/${id}`)
    setCats(c => c.filter(x => x._id !== id))
    toast.success('Supprimée')
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Tag className="w-6 h-6 text-brand-400" /> Catégories ({cats.length})
        </h2>
        <button onClick={openCreate} className="btn-brand text-sm flex items-center gap-2">
          <Plus className="w-4 h-4" /> Nouvelle catégorie
        </button>
      </div>

      {/* Modal form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="glass-card w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h3 className="font-bold text-white text-lg">{editId ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h3>
              <button onClick={() => setShowForm(false)} className="text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="space-y-4">
              {/* Image upload */}
              <div>
                <label className="block text-sm text-white/50 mb-1.5">Image (optionnel)</label>
                <input type="file" accept="image/*" ref={imgRef} onChange={handleImage} className="hidden" />
                {imagePreview ? (
                  <div className="relative w-24 h-24">
                    <img src={imagePreview} alt="" className="w-24 h-24 object-cover rounded-xl border border-white/10" />
                    <button onClick={() => { setImageFile(null); setImagePreview('') }}
                      className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white">
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <button onClick={() => imgRef.current?.click()}
                    className="w-24 h-24 border-2 border-dashed border-white/10 hover:border-brand-500/40 rounded-xl flex flex-col items-center justify-center gap-1 text-white/20 hover:text-white/40 transition-colors">
                    <Image className="w-6 h-6" />
                    <span className="text-xs">Image</span>
                  </button>
                )}
              </div>
              <div>
                <label className="block text-sm text-white/50 mb-1.5">Nom *</label>
                <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="Informatique" className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-500/50" />
              </div>
              <div>
                <label className="block text-sm text-white/50 mb-1.5">Icône</label>
                <div className="flex flex-wrap gap-2">
                  {ICONS.map(ic => (
                    <button key={ic} onClick={() => setForm(f => ({ ...f, icon: ic }))}
                      className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center border transition-all ${form.icon === ic ? 'border-brand-500 bg-brand-500/20' : 'border-white/10 hover:border-white/30'}`}>
                      {ic}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-white/50 mb-1.5">Couleur</label>
                <div className="flex flex-wrap gap-2">
                  {COLORS.map(col => (
                    <button key={col} onClick={() => setForm(f => ({ ...f, color: col }))}
                      className="w-7 h-7 rounded-lg border-2 transition-all flex items-center justify-center"
                      style={{ backgroundColor: col, borderColor: form.color === col ? 'white' : 'transparent' }}>
                      {form.color === col && <Check className="w-3 h-3 text-white" />}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-white/50 mb-1.5">Description</label>
                <input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  placeholder="Description courte" className="w-full bg-dark-700 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-brand-500/50" />
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={handleSave} disabled={saving} className="flex-1 btn-brand py-3 disabled:opacity-50 flex items-center justify-center gap-2">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Enregistrement...</> : <><Save className="w-4 h-4" /> {editId ? 'Mettre à jour' : 'Créer'}</>}
                </button>
                <button onClick={() => setShowForm(false)} className="px-4 py-3 rounded-xl border border-white/10 text-white/50 hover:text-white transition-colors">
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Categories grid */}
      {loading ? (
        <div className="flex items-center gap-3 text-white/40 py-10">
          <Loader2 className="w-5 h-5 animate-spin text-brand-400" /> Chargement...
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {cats.map(c => (
            <div key={c._id} className="glass-card p-4 group relative">
              {/* Image or icon */}
              <div className="w-12 h-12 rounded-xl mb-3 flex items-center justify-center overflow-hidden"
                style={{ background: `${c.color}22`, border: `1px solid ${c.color}44` }}>
                {c.image ? (
                  <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
                ) : (
                  <span className="text-2xl">{c.icon}</span>
                )}
              </div>
              <p className="font-semibold text-white text-sm truncate">{c.name}</p>
              <p className="text-xs text-white/30 mt-0.5">{c.docCount || 0} docs</p>
              {c.description && <p className="text-xs text-white/20 mt-1 truncate">{c.description}</p>}
              {/* Actions */}
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(c)} className="p-1.5 rounded-lg bg-dark-700 text-white/50 hover:text-white transition-colors">
                  <Edit className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => handleDelete(c._id)} className="p-1.5 rounded-lg bg-dark-700 text-white/50 hover:text-red-400 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
