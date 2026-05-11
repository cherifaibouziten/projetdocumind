/**
 * Explore — Page d'exploration avec filtrage par catégorie (slug → name), search, sort
 * Fix: catégories qui ne filtraient pas (slug envoyé au lieu du name)
 */
import React, { useState, useEffect, useCallback } from 'react'
import { useParams, useSearchParams, Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Search, SlidersHorizontal, X, Grid3X3, List, ArrowLeft, ChevronLeft, ChevronRight } from 'lucide-react'
import { useApp } from '../context/AppContext'
import DocumentCard, { DocumentCardSkeleton } from '../components/ui/DocumentCard'
import axios from 'axios'

const SORTS = [
  { value: 'recent',     label: 'Plus récents' },
  { value: 'popular',    label: 'Plus populaires' },
  { value: 'rating',     label: 'Mieux notés' },
  { value: 'downloads',  label: 'Plus téléchargés' },
  { value: 'price_asc',  label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
]

export default function Explore() {
  const navigate = useNavigate()
  const { category: catParam } = useParams()   // slug from URL
  const [searchParams] = useSearchParams()
  const { categories } = useApp()

  const [documents, setDocuments] = useState([])
  const [loading, setLoading]     = useState(true)
  const [total, setTotal]         = useState(0)
  const [page, setPage]           = useState(1)
  const [pages, setPages]         = useState(1)

  const [search,     setSearch]     = useState(searchParams.get('search') || '')
  const [searchInput,setSearchInput]= useState(searchParams.get('search') || '')
  const [sort,       setSort]       = useState(searchParams.get('sort') || 'recent')
  // FIX: keep both slug and name — API expects name, URL uses slug
  const [catSlug,    setCatSlug]    = useState(catParam || searchParams.get('category') || 'all')
  const [isFree,     setIsFree]     = useState(searchParams.get('filter') === 'free' ? 'true' : '')
  const [showFilters,setShowFilters]= useState(false)
  const [viewMode,   setViewMode]   = useState('grid')

  // Resolve slug → category name for API call
  const getCatName = useCallback((slug) => {
    if (!slug || slug === 'all') return ''
    const found = categories.find(c => c.slug === slug || c.name === slug)
    return found ? found.name : slug
  }, [categories])

  const fetchDocs = useCallback(async (p = 1, overrideSearch) => {
    setLoading(true)
    try {
      const params = { page: p, limit: 12, sort }
      const q = overrideSearch !== undefined ? overrideSearch : search
      if (q) params.search = q
      const catName = getCatName(catSlug)
      if (catName) params.category = catName
      if (isFree === 'true') params.isFree = 'true'
      const { data } = await axios.get('/api/documents', { params })
      if (data.success) {
        setDocuments(data.documents)
        setTotal(data.total)
        setPages(data.pages)
        setPage(p)
      }
    } catch {}
    setLoading(false)
  }, [sort, catSlug, isFree, search, getCatName])

  useEffect(() => {
    if (categories.length > 0 || catSlug === 'all') {
      fetchDocs(1)
    }
  }, [sort, catSlug, isFree, categories])

  useEffect(() => {
    if (catParam) setCatSlug(catParam)
  }, [catParam])

  const handleSearch = (e) => {
    e.preventDefault()
    setSearch(searchInput)
    fetchDocs(1, searchInput)
  }

  const clearFilters = () => {
    setSearchInput(''); setSearch(''); setSort('recent'); setCatSlug('all'); setIsFree('')
  }

  const activeCatName = getCatName(catSlug)

  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8">
      {/* ── Breadcrumb + Back ── */}
      <div className="flex items-center gap-3 mb-6">
        <button onClick={() => navigate(-1)} className="p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white/70 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-sm text-white/40 flex items-center gap-1.5">
          <Link to="/" className="hover:text-white/70">Accueil</Link>
          <span>/</span>
          <span className="text-white/70">Explorer</span>
          {activeCatName && <><span>/</span><span className="text-brand-400">{activeCatName}</span></>}
        </div>
      </div>

      {/* ── Header ── */}
      <div className="mb-8 flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">
            {activeCatName ? `📚 ${activeCatName}` : 'Explorer les documents'}
          </h1>
          <p className="text-white/40 text-sm mt-1">{total} document{total !== 1 ? 's' : ''} trouvé{total !== 1 ? 's' : ''}</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setViewMode('grid')} className={`p-2 rounded-lg transition-colors ${viewMode === 'grid' ? 'bg-brand-500/20 text-brand-400' : 'text-white/30 hover:text-white/60'}`}>
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button onClick={() => setViewMode('list')} className={`p-2 rounded-lg transition-colors ${viewMode === 'list' ? 'bg-brand-500/20 text-brand-400' : 'text-white/30 hover:text-white/60'}`}>
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="flex gap-6">
        {/* ── Sidebar filtres ── */}
        <aside className="hidden lg:block w-56 flex-shrink-0 space-y-5">
          {/* Catégories */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold text-white/70 mb-3 uppercase tracking-wider">Catégorie</h3>
            <div className="space-y-1">
              <button onClick={() => setCatSlug('all')}
                className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${catSlug === 'all' ? 'bg-brand-500/20 text-brand-400' : 'text-white/50 hover:text-white/80 hover:bg-white/5'}`}>
                Toutes
              </button>
              {categories.map(c => (
                <button key={c._id} onClick={() => setCatSlug(c.slug)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors flex items-center gap-2 ${catSlug === c.slug || catSlug === c.name ? 'bg-brand-500/20 text-brand-400' : 'text-white/50 hover:text-white/80 hover:bg-white/5'}`}>
                  <span>{c.icon}</span>
                  <span className="truncate">{c.name}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Filtre prix */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold text-white/70 mb-3 uppercase tracking-wider">Prix</h3>
            <div className="space-y-1">
              {[['', 'Tous'], ['true', '✓ Gratuits'], ['false', '💳 Payants']].map(([v, l]) => (
                <button key={v} onClick={() => setIsFree(v)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${isFree === v ? 'bg-brand-500/20 text-brand-400' : 'text-white/50 hover:text-white/80 hover:bg-white/5'}`}>
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Sort */}
          <div className="glass-card p-4">
            <h3 className="text-sm font-semibold text-white/70 mb-3 uppercase tracking-wider">Trier par</h3>
            <div className="space-y-1">
              {SORTS.map(s => (
                <button key={s.value} onClick={() => setSort(s.value)}
                  className={`w-full text-left px-3 py-2 rounded-xl text-sm transition-colors ${sort === s.value ? 'bg-brand-500/20 text-brand-400' : 'text-white/50 hover:text-white/80 hover:bg-white/5'}`}>
                  {s.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* ── Contenu principal ── */}
        <div className="flex-1 min-w-0">
          {/* Search */}
          <form onSubmit={handleSearch} className="flex gap-2 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 w-4 h-4 text-white/30" />
              <input
                type="text" value={searchInput} onChange={e => setSearchInput(e.target.value)}
                placeholder="Rechercher un document..."
                className="w-full bg-dark-700 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-white/80 placeholder-white/30 text-sm focus:outline-none focus:border-brand-500/50"
              />
              {searchInput && (
                <button type="button" onClick={() => { setSearchInput(''); setSearch(''); fetchDocs(1, '') }}
                  className="absolute right-3 top-3 text-white/30 hover:text-white/60">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button type="submit" className="btn-brand px-4 py-2.5 text-sm">Rechercher</button>
            {(search || catSlug !== 'all' || sort !== 'recent' || isFree) && (
              <button type="button" onClick={clearFilters} className="px-3 py-2.5 rounded-xl border border-white/10 text-white/40 hover:text-white/70 text-sm transition-colors">
                Réinitialiser
              </button>
            )}
          </form>

          {/* Mobile filters */}
          <div className="flex gap-2 mb-4 lg:hidden overflow-x-auto pb-2">
            {categories.slice(0,6).map(c => (
              <button key={c._id} onClick={() => setCatSlug(catSlug === c.slug ? 'all' : c.slug)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-colors border ${catSlug === c.slug ? 'bg-brand-500/20 border-brand-500/40 text-brand-400' : 'border-white/10 text-white/50'}`}>
                {c.icon} {c.name}
              </button>
            ))}
          </div>

          {/* Results */}
          {loading ? (
            <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
              {Array(8).fill(0).map((_, i) => <DocumentCardSkeleton key={i} />)}
            </div>
          ) : documents.length === 0 ? (
            <div className="glass-card p-12 text-center">
              <div className="text-5xl mb-4">📭</div>
              <p className="text-white/50 mb-4">Aucun document trouvé{activeCatName ? ` dans "${activeCatName}"` : ''}.</p>
              <button onClick={clearFilters} className="btn-brand text-sm">Effacer les filtres</button>
            </div>
          ) : (
            <>
              <div className={`grid gap-4 ${viewMode === 'grid' ? 'grid-cols-2 sm:grid-cols-3 xl:grid-cols-4' : 'grid-cols-1'}`}>
                {documents.map((doc, i) => <DocumentCard key={doc._id} doc={doc} index={i} compact={viewMode === 'list'} />)}
              </div>
              {/* Pagination */}
              {pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <button onClick={() => fetchDocs(page - 1)} disabled={page <= 1}
                    className="p-2 rounded-xl hover:bg-white/5 disabled:opacity-30 text-white/50 transition-colors">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  {Array.from({ length: Math.min(pages, 7) }, (_, i) => {
                    const p = i + 1
                    return (
                      <button key={p} onClick={() => fetchDocs(p)}
                        className={`w-9 h-9 rounded-xl text-sm font-medium transition-colors ${p === page ? 'bg-brand-gradient text-white' : 'text-white/40 hover:bg-white/5'}`}>
                        {p}
                      </button>
                    )
                  })}
                  <button onClick={() => fetchDocs(page + 1)} disabled={page >= pages}
                    className="p-2 rounded-xl hover:bg-white/5 disabled:opacity-30 text-white/50 transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
