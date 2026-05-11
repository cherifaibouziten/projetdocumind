import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useApp } from '../context/AppContext'
import { ShoppingCart, Trash2, Tag, CreditCard, CheckCircle, ArrowRight, Package } from 'lucide-react'
import toast from 'react-hot-toast'
import api from '../lib/api'

export default function Cart() {
  const { user } = useApp()
  const [cart, setCart]       = useState([])
  const [loading, setLoading] = useState(true)
  const [promoCode, setPromoCode] = useState('')
  const [promo, setPromo]     = useState(null)
  const [promoErr, setPromoErr] = useState('')
  const [placing, setPlacing] = useState(false)
  const [done, setDone]       = useState(false)
  const navigate = useNavigate()

  const load = async () => {
    const res = await api.get('/cart')
    if (res.data.success) setCart(res.data.cart)
    setLoading(false)
  }
  useEffect(() => { if (user) load() }, [user])

  const remove = async (docId) => {
    await api.delete(`/cart/${docId}`)
    load()
    toast.success('Retiré du panier')
  }

  const applyPromo = async () => {
    setPromoErr(''); setPromo(null)
    const res = await api.get(`/promos/validate/${promoCode}`)
    if (res.data.success) { setPromo(res.data.promotion); toast.success(`-${res.data.promotion.discount}% appliqué !`) }
    else setPromoErr(res.data.message)
  }

  const subtotal = cart.reduce((s, c) => s + (c.documentId?.price || 0), 0)
  const discount = promo ? Math.round(subtotal * promo.discount) / 100 : 0
  const total    = subtotal - discount

  const checkout = async () => {
    if (!cart.length) return
    setPlacing(true)
    const res = await api.post('/orders', {
      documentIds: cart.map(c => c.documentId._id),
      promoCode: promo?.code,
      paymentMethod: 'card',
    })
    if (res.data.success) { setDone(true); setCart([]) }
    else { toast.error(res.data.message); setPlacing(false) }
  }

  if (!user) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <ShoppingCart className="w-16 h-16 text-gray-600 mb-4" />
      <h2 className="text-2xl font-bold text-white mb-2">Connectez-vous</h2>
      <p className="text-gray-400 mb-6">Vous devez être connecté pour voir votre panier.</p>
      <Link to="/login" className="btn-primary">Se connecter</Link>
    </div>
  )

  if (done) return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-24 h-24 bg-violet-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
        <CheckCircle className="w-12 h-12 text-violet-400" />
      </div>
      <h2 className="text-3xl font-bold text-white mb-3">Commande confirmée !</h2>
      <p className="text-gray-400 mb-8">Vos documents sont disponibles dans votre bibliothèque.</p>
      <div className="flex gap-3">
        <Link to="/library" className="btn-primary">Ma bibliothèque</Link>
        <Link to="/explore" className="btn-secondary">Continuer</Link>
      </div>
    </div>
  )

  if (loading) return <div className="text-center py-20 text-gray-400">Chargement...</div>

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold text-white mb-8 flex items-center gap-3">
        <ShoppingCart className="w-8 h-8 text-violet-400" /> Mon Panier
        <span className="text-lg text-gray-400 font-normal">({cart.length} document{cart.length > 1 ? 's' : ''})</span>
      </h1>

      {cart.length === 0 ? (
        <div className="text-center py-20">
          <Package className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-400 text-lg mb-6">Votre panier est vide</p>
          <Link to="/explore" className="btn-primary">Explorer les documents</Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Items */}
          <div className="lg:col-span-2 space-y-3">
            {cart.map(item => {
              const doc = item.documentId; if (!doc) return null
              return (
                <div key={item._id} className="glass-card p-4 flex gap-4 items-center">
                  <Link to={`/doc/${doc._id}`}>
                    <img src={doc.coverUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=120&q=80'}
                      alt={doc.title} className="w-16 h-20 object-cover rounded-lg" />
                  </Link>
                  <div className="flex-1 min-w-0">
                    <Link to={`/doc/${doc._id}`} className="font-semibold text-white hover:text-violet-300 line-clamp-2 text-sm transition-colors">{doc.title}</Link>
                    <p className="text-xs text-gray-400 mt-1">{doc.category}</p>
                    <p className="text-violet-300 font-bold mt-2">{doc.price}€</p>
                  </div>
                  <button onClick={() => remove(doc._id)}
                    className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-all">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              )
            })}
          </div>

          {/* Summary */}
          <div className="glass-card p-6 h-fit sticky top-20">
            <h3 className="font-bold text-white text-lg mb-5">Résumé</h3>
            <div className="space-y-2 text-sm mb-5">
              <div className="flex justify-between text-gray-300"><span>Sous-total</span><span>{subtotal.toFixed(2)}€</span></div>
              {discount > 0 && <div className="flex justify-between text-green-400 font-medium"><span>Réduction ({promo.discount}%)</span><span>-{discount.toFixed(2)}€</span></div>}
              <hr className="border-white/10 my-3" />
              <div className="flex justify-between font-bold text-lg text-white"><span>Total</span><span className="text-violet-300">{total.toFixed(2)}€</span></div>
            </div>

            {/* Promo */}
            <div className="mb-5">
              <label className="text-xs font-semibold text-gray-400 flex items-center gap-1.5 mb-2"><Tag className="w-3 h-3" />Code promo</label>
              <div className="flex gap-2">
                <input value={promoCode} onChange={e => { setPromoCode(e.target.value.toUpperCase()); setPromo(null); setPromoErr('') }}
                  placeholder="CODE" className="input flex-1 text-sm py-2 font-mono uppercase" />
                <button onClick={applyPromo} className="btn-secondary text-sm px-3 py-2">OK</button>
              </div>
              {promoErr && <p className="text-red-400 text-xs mt-1">{promoErr}</p>}
              {promo && <p className="text-green-400 text-xs mt-1 font-medium">✓ {promo.description}</p>}
            </div>

            <button onClick={checkout} disabled={placing}
              className="btn-primary w-full flex items-center justify-center gap-2 py-3">
              <CreditCard className="w-4 h-4" />
              {placing ? 'Traitement...' : 'Confirmer la commande'}
            </button>
            <Link to="/explore" className="block text-center text-xs text-gray-500 hover:text-gray-400 mt-3">← Continuer les achats</Link>
          </div>
        </div>
      )}
    </div>
  )
}
