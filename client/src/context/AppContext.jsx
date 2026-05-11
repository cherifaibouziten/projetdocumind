import React, { createContext, useContext, useEffect, useState } from 'react'
import axios from 'axios'
import toast from 'react-hot-toast'
import { useNavigate } from 'react-router-dom'

axios.defaults.baseURL = import.meta.env.VITE_API_URL || 'http://localhost:4000'
axios.defaults.withCredentials = true

const AppContext = createContext()

export const AppProvider = ({ children }) => {
  const navigate = useNavigate()
  const [user, setUser]             = useState(null)
  const [documents, setDocuments]   = useState([])
  const [categories, setCategories] = useState([])
  const [showAuth, setShowAuth]     = useState(false)
  const [authMode, setAuthMode]     = useState('login')
  const [searchQuery, setSearchQuery] = useState('')
  const [loading, setLoading]       = useState(true)
  const [library, setLibrary]       = useState([])

  const fetchUser = async () => {
    try {
      const { data } = await axios.get('/api/auth/me')
      if (data.success && data.user) {
        setUser(data.user)
      }
    } catch {}
    setLoading(false)
  }

  const fetchDocuments = async (params = {}) => {
    try {
      const { data } = await axios.get('/api/documents', { params })
      if (data.success) setDocuments(data.documents)
    } catch {}
  }

  const fetchCategories = async () => {
    try {
      const { data } = await axios.get('/api/categories')
      if (data.success) setCategories(data.categories)
    } catch {}
  }

  const fetchLibrary = async () => {
    if (!user) return
    try {
      const { data } = await axios.get('/api/library')
      if (data.success) setLibrary(data.library)
    } catch {}
  }

  useEffect(() => {
    fetchUser()
    fetchDocuments()
    fetchCategories()
  }, [])

  useEffect(() => {
    if (user) fetchLibrary()
  }, [user])

  const logout = async () => {
    try { await axios.get('/api/auth/logout') } catch {}
    setUser(null)
    setLibrary([])
    toast.success('Déconnecté avec succès')
    navigate('/')
  }

  const requireAuth = (mode = 'login') => {
    if (!user) {
      setAuthMode(mode)
      setShowAuth(true)
      return false
    }
    return true
  }

  const openAuth = (mode = 'login') => {
    setAuthMode(mode)
    setShowAuth(true)
  }

  const isInLibrary = (docId) => library.some(d => d._id === docId || d === docId)

  const addToLibraryLocal = (doc) => {
    setLibrary(prev => [...prev, doc])
  }

  const toastStyle = {
    style: {
      background: 'rgba(18,18,31,0.95)',
      color: '#fff',
      border: '1px solid rgba(124,107,250,0.2)',
      borderRadius: '12px',
      backdropFilter: 'blur(12px)',
      fontFamily: 'Inter, sans-serif',
      fontSize: '14px',
    }
  }

  return (
    <AppContext.Provider value={{
      user, setUser,
      documents, setDocuments, fetchDocuments,
      categories, fetchCategories,
      showAuth, setShowAuth,
      authMode, setAuthMode,
      searchQuery, setSearchQuery,
      loading, navigate, axios,
      logout, requireAuth, openAuth,
      library, setLibrary, fetchLibrary, isInLibrary, addToLibraryLocal,
      toastStyle,
    }}>
      {children}
    </AppContext.Provider>
  )
}

export const useApp = () => useContext(AppContext)
