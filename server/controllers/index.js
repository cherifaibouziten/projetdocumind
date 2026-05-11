import bcrypt from 'bcryptjs'
import https from 'https'
import http from 'http'
import jwt from 'jsonwebtoken'
import Stripe from 'stripe'
import OpenAI from 'openai'
import { User, Document, Category, Purchase, ChatSession } from '../models/index.js'
import { uploadToCloudinary, deleteFromCloudinary, isCloudinaryConfigured, saveLocally } from '../middleware/upload.js'

// Safe init — won't crash if keys are missing/placeholder
const stripe = process.env.STRIPE_SECRET_KEY &&
  !process.env.STRIPE_SECRET_KEY.includes('your_') &&
  (process.env.STRIPE_SECRET_KEY.startsWith('sk_') || process.env.STRIPE_SECRET_KEY.startsWith('rk_'))
  ? new Stripe(process.env.STRIPE_SECRET_KEY)
  : null

const openai = process.env.OPENAI_API_KEY && !process.env.OPENAI_API_KEY.includes('your_')
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null

// ── Extrait le texte brut d'un PDF depuis son URL ────────────────────
async function extractPdfText(pdfUrl) {
  if (!pdfUrl || pdfUrl.startsWith('demo://')) return null
  try {
    // Local file stored on server disk
    if (pdfUrl.startsWith('/uploads/')) {
      const { readFileSync } = await import('fs')
      const { join, dirname } = await import('path')
      const { fileURLToPath } = await import('url')
      const __fn  = fileURLToPath(import.meta.url)
      const __dir = dirname(__fn)
      const localPath = join(__dir, '..', pdfUrl)
      const buffer = readFileSync(localPath)
      const data   = await pdfParse(buffer)
      return data.text.replace(/\s+/g, ' ').trim().substring(0, 12000)
    }
    // Remote URL (Cloudinary etc.)
    return new Promise((resolve) => {
      try {
        const client = pdfUrl.startsWith('https') ? https : http
        client.get(pdfUrl, (res) => {
          const chunks = []
          res.on('data', chunk => chunks.push(chunk))
          res.on('end', async () => {
            try {
              const buffer = Buffer.concat(chunks)
              const data   = await pdfParse(buffer)
              resolve(data.text.replace(/\s+/g, ' ').trim().substring(0, 12000))
            } catch { resolve(null) }
          })
          res.on('error', () => resolve(null))
        }).on('error', () => resolve(null))
      } catch { resolve(null) }
    })
  } catch (e) {
    console.error('extractPdfText error:', e.message)
    return null
  }
}

const COOKIE = () => ({
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
  maxAge: 7 * 24 * 60 * 60 * 1000,
})
const signToken = (payload) => jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' })

// ═══════════════════════════════════════════
// AUTH
// ═══════════════════════════════════════════
export const register = async (req, res) => {
  try {
    const { name, email, password } = req.body
    if (!name || !email || !password)
      return res.json({ success: false, message: 'Tous les champs sont requis.' })
    if (password.length < 6)
      return res.json({ success: false, message: 'Mot de passe trop court (min 6 caractères).' })
    const exists = await User.findOne({ email: email.toLowerCase().trim() })
    if (exists) return res.json({ success: false, message: 'Cet email est déjà utilisé.' })
    const hash = await bcrypt.hash(password, 12)
    const user = await User.create({ name: name.trim(), email: email.toLowerCase().trim(), password: hash })
    const u = user.toObject(); delete u.password
    res.cookie('token', signToken({ id: user._id, role: user.role }), COOKIE())
    res.json({ success: true, user: u })
  } catch (e) {
    res.json({ success: false, message: e.message })
  }
}

export const login = async (req, res) => {
  try {
    const { email, password } = req.body
    if (!email || !password)
      return res.json({ success: false, message: 'Email et mot de passe requis.' })
    const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+password')
    if (!user) return res.json({ success: false, message: 'Email ou mot de passe incorrect.' })
    const ok = await bcrypt.compare(password, user.password)
    if (!ok) return res.json({ success: false, message: 'Email ou mot de passe incorrect.' })
    if (!user.isActive) return res.json({ success: false, message: 'Compte désactivé.' })
    const u = user.toObject(); delete u.password
    res.cookie('token', signToken({ id: user._id, role: user.role }), COOKIE())
    res.json({ success: true, user: u })
  } catch (e) {
    res.json({ success: false, message: e.message })
  }
}

export const logout = (req, res) => {
  res.clearCookie('token', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
  })
  res.json({ success: true })
}

export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password')
    if (!user) return res.json({ success: false, message: 'Utilisateur introuvable.' })
    res.json({ success: true, user })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

// ═══════════════════════════════════════════
// PROFILE
// ═══════════════════════════════════════════
export const updateProfile = async (req, res) => {
  try {
    const { name, bio } = req.body
    const updates = {}
    if (name && name.trim()) updates.name = name.trim()
    if (bio !== undefined) updates.bio = bio

    // Avatar upload — Cloudinary if configured, otherwise local
    if (req.file) {
      if (isCloudinaryConfigured()) {
        try {
          const user = await User.findById(req.userId)
          if (user.avatar && user.avatar.includes('cloudinary')) {
            const pid = user.avatar.split('/').slice(-1)[0].split('.')[0]
            await deleteFromCloudinary(`documind/avatars/${pid}`).catch(() => {})
          }
          const result = await uploadToCloudinary(req.file.buffer, {
            folder: 'documind/avatars',
            transformation: [{ width: 300, height: 300, crop: 'fill', gravity: 'face' }],
          })
          updates.avatar = result.secure_url
        } catch {
          updates.avatar = saveLocally(req.file.buffer, 'avatars', req.file.originalname)
        }
      } else {
        updates.avatar = saveLocally(req.file.buffer, 'avatars', req.file.originalname)
      }
    }

    const user = await User.findByIdAndUpdate(req.userId, updates, { new: true }).select('-password')
    res.json({ success: true, user })
  } catch (e) {
    res.json({ success: false, message: e.message })
  }
}

export const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body
    const user = await User.findById(req.userId).select('+password')
    const ok = await bcrypt.compare(currentPassword, user.password)
    if (!ok) return res.json({ success: false, message: 'Mot de passe actuel incorrect.' })
    if (newPassword.length < 6) return res.json({ success: false, message: 'Nouveau mot de passe trop court.' })
    user.password = await bcrypt.hash(newPassword, 12)
    await user.save()
    res.json({ success: true, message: 'Mot de passe mis à jour.' })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

// ═══════════════════════════════════════════
// AUTHOR REQUESTS
// ═══════════════════════════════════════════
export const requestAuthor = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    if (user.role === 'author' || user.role === 'admin')
      return res.json({ success: false, message: 'Vous êtes déjà auteur.' })
    if (user.authorRequest?.status === 'pending')
      return res.json({ success: false, message: 'Demande déjà en attente.' })
    user.authorRequest = { status: 'pending', requestedAt: new Date() }
    await user.save()
    res.json({ success: true, message: 'Demande envoyée. Vous serez notifié sous 24h.' })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

export const getPendingAuthors = async (req, res) => {
  try {
    const users = await User.find({ 'authorRequest.status': 'pending' })
      .select('-password').sort({ 'authorRequest.requestedAt': 1 })
    res.json({ success: true, users })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

export const approveAuthor = async (req, res) => {
  try {
    const { approve, reason } = req.body
    const status = approve ? 'approved' : 'rejected'
    const role   = approve ? 'author'   : 'reader'
    const user = await User.findByIdAndUpdate(req.params.id, {
      role,
      'authorRequest.status':     status,
      'authorRequest.reviewedAt': new Date(),
      'authorRequest.reviewedBy': req.userId,
      'authorRequest.reason':     reason || '',
    }, { new: true }).select('-password')
    if (!user) return res.json({ success: false, message: 'Utilisateur introuvable.' })
    res.json({ success: true, user })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

// ═══════════════════════════════════════════
// USERS ADMIN
// ═══════════════════════════════════════════
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select('-password').sort({ createdAt: -1 })
    res.json({ success: true, users })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

export const addUser = async (req, res) => {
  try {
    const { name, email, password, role } = req.body
    if (!name || !email || !password) return res.json({ success: false, message: 'Nom, email et mot de passe requis.' })
    const exists = await User.findOne({ email: email.toLowerCase().trim() })
    if (exists) return res.json({ success: false, message: 'Email déjà utilisé.' })
    const hash = await bcrypt.hash(password, 12)
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      password: hash,
      role: role || 'reader',
    })
    const u = user.toObject(); delete u.password
    res.json({ success: true, user: u })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

export const updateUserRole = async (req, res) => {
  try {
    const { role } = req.body
    if (!['reader', 'author', 'admin'].includes(role))
      return res.json({ success: false, message: 'Rôle invalide.' })
    const user = await User.findByIdAndUpdate(req.params.id, { role }, { new: true }).select('-password')
    if (!user) return res.json({ success: false, message: 'Utilisateur introuvable.' })
    res.json({ success: true, user })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

export const toggleUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
    if (!user) return res.json({ success: false, message: 'Introuvable.' })
    user.isActive = !user.isActive
    await user.save()
    res.json({ success: true, user })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

export const deleteUser = async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

// ═══════════════════════════════════════════
// CATEGORIES
// ═══════════════════════════════════════════
export const getCategories = async (req, res) => {
  try {
    const categories = await Category.find({ isActive: true }).sort({ order: 1, name: 1 })
    res.json({ success: true, categories })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

export const addCategory = async (req, res) => {
  try {
    const { name, icon, color, description } = req.body
    const slug = name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')
    let image = ''
    if (req.file) {
      if (isCloudinaryConfigured()) {
        try {
          const r = await uploadToCloudinary(req.file.buffer, { folder: 'documind/categories', transformation: [{ width: 300, height: 300, crop: 'fill' }] })
          image = r.secure_url
        } catch { image = saveLocally(req.file.buffer, 'covers', req.file.originalname) }
      } else { image = saveLocally(req.file.buffer, 'covers', req.file.originalname) }
    }
    const cat = await Category.create({ name, slug, icon: icon || '📄', color: color || '#6366f1', description: description || '', image })
    res.json({ success: true, category: cat })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

export const updateCategory = async (req, res) => {
  try {
    const updates = { ...req.body }
    if (req.file) {
      if (isCloudinaryConfigured()) {
        try {
          const r = await uploadToCloudinary(req.file.buffer, { folder: 'documind/categories', transformation: [{ width: 300, height: 300, crop: 'fill' }] })
          updates.image = r.secure_url
        } catch { updates.image = saveLocally(req.file.buffer, 'covers', req.file.originalname) }
      } else { updates.image = saveLocally(req.file.buffer, 'covers', req.file.originalname) }
    }
    const cat = await Category.findByIdAndUpdate(req.params.id, updates, { new: true })
    res.json({ success: true, category: cat })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

export const deleteCategory = async (req, res) => {
  try {
    await Category.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

// ═══════════════════════════════════════════
// DOCUMENTS
// ═══════════════════════════════════════════
export const getDocuments = async (req, res) => {
  try {
    const { category, search, sort = 'recent', isFree, page = 1, limit = 12 } = req.query
    const query = { status: 'published' }
    if (category && category !== 'all') query.category = category
    if (isFree !== undefined) query.isFree = isFree === 'true'
    if (search) {
      query.$or = [
        { title:       { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags:        { $regex: search, $options: 'i' } },
        { aiKeywords:  { $regex: search, $options: 'i' } },
      ]
    }
    const sortMap = {
      recent:     { createdAt: -1 },
      popular:    { views: -1 },
      rating:     { rating: -1 },
      downloads:  { downloads: -1 },
      price_asc:  { price: 1 },
      price_desc: { price: -1 },
    }
    const sortObj = sortMap[sort] || { createdAt: -1 }
    const skip  = (Number(page) - 1) * Number(limit)
    const total = await Document.countDocuments(query)
    const docs  = await Document.find(query)
      .sort(sortObj).skip(skip).limit(Number(limit))
      .select('-embeddings -comments')
    res.json({ success: true, documents: docs, total, page: Number(page), pages: Math.ceil(total / Number(limit)) })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

export const getDocumentById = async (req, res) => {
  try {
    const doc = await Document.findOne({
      $or: [
        ...(req.params.id.match(/^[a-f\d]{24}$/i) ? [{ _id: req.params.id }] : []),
        { slug: req.params.id },
      ]
    }).select('-embeddings').populate('authorId', 'name avatar bio')
    if (!doc) return res.json({ success: false, message: 'Document introuvable.' })
    await Document.findByIdAndUpdate(doc._id, { $inc: { views: 1 } })
    res.json({ success: true, document: doc })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

// ── Upload with graceful Cloudinary fallback ──────────────────────────
export const uploadDocument = async (req, res) => {
  try {
    const { title, description, category, tags, isFree, price, language } = req.body
    if (!title || !category) return res.json({ success: false, message: 'Titre et catégorie requis.' })

    const author = await User.findById(req.userId)
    if (!author) return res.json({ success: false, message: 'Auteur introuvable.' })

    const pdfFile   = req.files?.pdf?.[0]
    const coverFile = req.files?.cover?.[0]

    if (!pdfFile) return res.json({ success: false, message: 'Fichier PDF requis.' })

    let pdfUrl = '', pdfPublicId = '', coverUrl = '', coverPublicId = ''

    if (isCloudinaryConfigured()) {
      // ── Cloudinary storage ──
      try {
        const pdfResult = await uploadToCloudinary(pdfFile.buffer, {
          folder: 'documind/pdfs', resource_type: 'raw', format: 'pdf',
        })
        pdfUrl = pdfResult.secure_url; pdfPublicId = pdfResult.public_id
        if (coverFile) {
          const cr = await uploadToCloudinary(coverFile.buffer, {
            folder: 'documind/covers',
            transformation: [{ width: 600, height: 800, crop: 'fill' }],
          })
          coverUrl = cr.secure_url; coverPublicId = cr.public_id
        }
      } catch (uploadErr) {
        console.warn('Cloudinary failed, falling back to local:', uploadErr.message)
        pdfUrl   = saveLocally(pdfFile.buffer,   'pdfs',   pdfFile.originalname)
        coverUrl = coverFile ? saveLocally(coverFile.buffer, 'covers', coverFile.originalname) : ''
      }
    } else {
      // ── Local disk storage ──
      pdfUrl   = saveLocally(pdfFile.buffer,   'pdfs',   pdfFile.originalname)
      coverUrl = coverFile ? saveLocally(coverFile.buffer, 'covers', coverFile.originalname) : ''
      console.log('📁 PDF saved locally:', pdfUrl)
    }

    const tagsList   = tags ? (Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim()).filter(Boolean)) : []
    const freeFlag   = isFree === 'true' || isFree === true
    const finalPrice = freeFlag ? 0 : Number(price) || 0

    const doc = await new Document({
      title: title.trim(),
      description: description || '',
      authorId:    req.userId,
      authorName:  author.name,
      authorAvatar:author.avatar,
      pdfUrl, pdfPublicId, coverUrl, coverPublicId,
      category, tags: tagsList,
      language: language || 'fr',
      isFree: freeFlag || finalPrice === 0,
      price:  finalPrice,
    }).save()

    // Async AI summary (only if OpenAI configured)
    if (openai) {
      generateAISummary(doc._id, title, description || '', tagsList, openai).catch(console.error)
    }

    res.json({
      success: true,
      document: doc,
      warning: isCloudinaryConfigured() ? null : 'PDF sauvegardé localement sur le serveur (mode sans Cloudinary).',
    })
  } catch (e) {
    console.error('UPLOAD ERROR:', e)
    res.json({ success: false, message: e.message })
  }
}

// ── AI summary helper ─────────────────────────────────────────────────
async function generateAISummary(docId, title, description, tags, client) {
  try {
    // Récupère le PDF pour extraire son vrai contenu
    const doc     = await Document.findById(docId).select('pdfUrl')
    const pdfText = doc?.pdfUrl ? await extractPdfText(doc.pdfUrl) : null

    const contentBlock = pdfText
      ? `Contenu réel extrait du PDF (${pdfText.length} caractères):\n${pdfText}`
      : `Description: ${description}\nTags: ${tags.join(', ')}`

    const prompt = `Tu es un expert en analyse de documents académiques et professionnels.
Analyse ce document et génère une réponse JSON précise et détaillée.

Titre: "${title}"
${contentBlock}

Génère ce JSON (sans markdown, sans backticks):
{
  "summary": "Résumé expert en 5-6 phrases: contexte, objectifs, méthodes, résultats/apports, public cible et valeur ajoutée.",
  "keyPoints": [
    "Point clé 1 — explication détaillée",
    "Point clé 2 — explication détaillée",
    "Point clé 3 — explication détaillée",
    "Point clé 4 — explication détaillée",
    "Point clé 5 — explication détaillée",
    "Point clé 6 — explication détaillée"
  ],
  "keywords": ["mot1","mot2","mot3","mot4","mot5","mot6","mot7","mot8","mot9","mot10"]
}`

    const response = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 1500,
      temperature: 0.3,
    })

    let raw = response.choices[0].message.content.trim()
    raw = raw.replace(/^```json?\s*/i, '').replace(/\s*```$/i, '')
    const data = JSON.parse(raw)

    await Document.findByIdAndUpdate(docId, {
      aiSummary:   data.summary   || '',
      aiKeyPoints: data.keyPoints || [],
      aiKeywords:  data.keywords  || [],
    })
    console.log(`✅ AI summary generated for: ${title}`)
  } catch (e) {
    console.error('AI Summary Error:', e.message)
  }
}

export const updateDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id)
    if (!doc) return res.json({ success: false, message: 'Document introuvable.' })
    if (doc.authorId.toString() !== req.userId && req.userRole !== 'admin')
      return res.json({ success: false, message: 'Non autorisé.' })

    const { title, description, category, tags, isFree, price, status } = req.body
    const updates = {}
    if (title)              updates.title       = title.trim()
    if (description !== undefined) updates.description = description
    if (category)           updates.category    = category
    if (tags)               updates.tags        = Array.isArray(tags) ? tags : tags.split(',').map(t => t.trim())
    if (isFree !== undefined) {
      updates.isFree = isFree === 'true' || isFree === true
      updates.price  = updates.isFree ? 0 : Number(price) || doc.price
    }
    if (status) updates.status = status

    if (req.file) {
      const cloudinaryReady = process.env.CLOUDINARY_API_KEY && !process.env.CLOUDINARY_API_KEY.includes('your_')
      if (cloudinaryReady) {
        if (doc.coverPublicId) await deleteFromCloudinary(doc.coverPublicId).catch(() => {})
        const result = await uploadToCloudinary(req.file.buffer, { folder: 'documind/covers' })
        updates.coverUrl      = result.secure_url
        updates.coverPublicId = result.public_id
      }
    }

    const updated = await Document.findByIdAndUpdate(req.params.id, updates, { new: true })
    res.json({ success: true, document: updated })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

export const deleteDocument = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id)
    if (!doc) return res.json({ success: false, message: 'Document introuvable.' })
    if (doc.authorId.toString() !== req.userId && req.userRole !== 'admin')
      return res.json({ success: false, message: 'Non autorisé.' })
    if (doc.pdfPublicId)   await deleteFromCloudinary(doc.pdfPublicId, 'raw').catch(() => {})
    if (doc.coverPublicId) await deleteFromCloudinary(doc.coverPublicId).catch(() => {})
    await Document.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

export const getMyDocuments = async (req, res) => {
  try {
    const docs = await Document.find({ authorId: req.userId }).sort({ createdAt: -1 }).select('-embeddings')
    res.json({ success: true, documents: docs })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

// ═══════════════════════════════════════════
// LIKES & WISHLIST
// ═══════════════════════════════════════════
export const toggleLike = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id)
    if (!doc) return res.json({ success: false, message: 'Document introuvable.' })
    const uid   = req.userId
    const liked = doc.likedBy.map(String).includes(String(uid))
    if (liked) { doc.likedBy.pull(uid); doc.likes = Math.max(0, doc.likes - 1) }
    else        { doc.likedBy.push(uid); doc.likes += 1 }
    await doc.save()
    res.json({ success: true, liked: !liked, likes: doc.likes })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

export const toggleWishlist = async (req, res) => {
  try {
    const user       = await User.findById(req.userId)
    const docId      = req.params.id
    const inWishlist = user.wishlist.map(String).includes(String(docId))
    if (inWishlist) user.wishlist.pull(docId)
    else            user.wishlist.push(docId)
    await user.save()
    res.json({ success: true, inWishlist: !inWishlist })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

export const getWishlist = async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('wishlist', '-embeddings -comments')
    res.json({ success: true, wishlist: user.wishlist })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

// ═══════════════════════════════════════════
// COMMENTS
// ═══════════════════════════════════════════
export const addComment = async (req, res) => {
  try {
    const { comment, rating } = req.body
    if (!comment?.trim()) return res.json({ success: false, message: 'Commentaire vide.' })
    const user = await User.findById(req.userId)
    const doc  = await Document.findById(req.params.id)
    if (!doc) return res.json({ success: false, message: 'Document introuvable.' })
    doc.comments.push({
      userId:    req.userId,
      userName:  user.name,
      userAvatar:user.avatar,
      rating:    rating ? Number(rating) : undefined,
      comment:   comment.trim(),
    })
    await doc.save()
    res.json({ success: true, document: doc })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

export const addReply = async (req, res) => {
  try {
    const { comment } = req.body
    const user = await User.findById(req.userId)
    const doc  = await Document.findById(req.params.id)
    const c    = doc.comments.id(req.params.commentId)
    if (!c) return res.json({ success: false, message: 'Commentaire introuvable.' })
    c.replies.push({ userId: req.userId, userName: user.name, userAvatar: user.avatar, comment })
    await doc.save()
    res.json({ success: true })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

export const deleteComment = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id)
    doc.comments.pull({ _id: req.params.commentId })
    await doc.save()
    res.json({ success: true })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

// ═══════════════════════════════════════════
// LIBRARY
// ═══════════════════════════════════════════
export const getLibrary = async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('library', '-embeddings')
    res.json({ success: true, library: user.library })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

export const addToLibrary = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    const doc  = await Document.findById(req.params.id)
    if (!doc) return res.json({ success: false, message: 'Document introuvable.' })
    if (!doc.isFree) return res.json({ success: false, message: 'Ce document est payant.' })
    if (!user.library.map(String).includes(String(req.params.id))) {
      user.library.push(req.params.id)
      await user.save()
      await Document.findByIdAndUpdate(req.params.id, { $inc: { downloads: 1 } })
    }
    res.json({ success: true })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

// ═══════════════════════════════════════════
// PURCHASES / STRIPE (mode démo toujours actif)
// ═══════════════════════════════════════════
export const createPaymentIntent = async (req, res) => {
  try {
    const { documentId } = req.body
    const doc = await Document.findById(documentId)
    if (!doc) return res.json({ success: false, message: 'Document introuvable.' })
    if (doc.isFree) return res.json({ success: false, message: 'Ce document est gratuit.' })

    const existing = await Purchase.findOne({ userId: req.userId, documentId, status: 'completed' })
    if (existing) return res.json({ success: false, message: 'Vous possédez déjà ce document.' })

    // Mode démo : simule un paiement sans Stripe
    res.json({
      success: true,
      clientSecret: 'demo_' + Date.now(),
      amount: doc.price,
      demo: true,
    })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

export const confirmPurchase = async (req, res) => {
  try {
    const { paymentIntentId, documentId } = req.body
    const doc = await Document.findById(documentId)
    if (!doc) return res.json({ success: false, message: 'Document introuvable.' })

    await Purchase.create({
      userId: req.userId, documentId, authorId: doc.authorId,
      amount: doc.price, stripePaymentIntentId: paymentIntentId, status: 'completed',
    })
    await User.findByIdAndUpdate(req.userId, { $addToSet: { library: documentId } })
    await Document.findByIdAndUpdate(documentId, { $inc: { purchases: 1, downloads: 1 } })
    await User.findByIdAndUpdate(doc.authorId, { $inc: { totalEarnings: doc.price * 0.8 } })
    res.json({ success: true })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

export const getMyPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find({ userId: req.userId, status: 'completed' })
      .populate('documentId', '-embeddings').sort({ createdAt: -1 })
    res.json({ success: true, purchases })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

// ═══════════════════════════════════════════
// AI FEATURES
// ═══════════════════════════════════════════
export const generateSummary = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id)
    if (!doc) return res.json({ success: false, message: 'Document introuvable.' })

    if (!doc.isFree) {
      const purchase  = await Purchase.findOne({ userId: req.userId, documentId: req.params.id, status: 'completed' })
      const inLibrary = await User.findOne({ _id: req.userId, library: req.params.id })
      if (!purchase && !inLibrary && String(doc.authorId) !== String(req.userId))
        return res.json({ success: false, message: "Accès refusé. Achetez ce document d'abord." })
    }

    // Return cached
    if (doc.aiSummary && doc.aiKeyPoints.length > 0) {
      return res.json({ success: true, summary: doc.aiSummary, keyPoints: doc.aiKeyPoints, keywords: doc.aiKeywords, cached: true })
    }

    // No OpenAI key → rich demo summary
    if (!openai) {
      const demoSummary = `"${doc.title}" est un document complet sur le thème de ${doc.category}. Il couvre en profondeur les concepts fondamentaux et avancés du domaine, en proposant une approche structurée et pédagogique. Ce document est particulièrement utile pour les étudiants, professionnels et chercheurs souhaitant approfondir leurs connaissances. Les auteurs présentent des exemples concrets et des cas d'usage réels pour illustrer chaque concept clé.`
      const demoPoints = [
        `Introduction aux concepts fondamentaux de ${doc.category}`,
        'Méthodologie détaillée avec exemples concrets et études de cas',
        'Analyse approfondie des principes théoriques et applications pratiques',
        'Exercices et ressources pour consolider les apprentissages',
        `Perspectives avancées et tendances actuelles dans le domaine de ${doc.category}`,
      ]
      await Document.findByIdAndUpdate(doc._id, { aiSummary: demoSummary, aiKeyPoints: demoPoints, aiKeywords: doc.tags.slice(0, 8) })
      return res.json({ success: true, summary: demoSummary, keyPoints: demoPoints, keywords: doc.tags, demo: true })
    }

    await generateAISummary(doc._id, doc.title, doc.description, doc.tags, openai)
    const updated = await Document.findById(doc._id)
    res.json({ success: true, summary: updated.aiSummary, keyPoints: updated.aiKeyPoints, keywords: updated.aiKeywords })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

export const getTTSText = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id).select('title description aiSummary aiKeyPoints category isFree authorId pdfUrl language tags')
    if (!doc) return res.json({ success: false, message: 'Document introuvable.' })

    if (!doc.isFree) {
      const purchase  = await Purchase.findOne({ userId: req.userId, documentId: req.params.id, status: 'completed' })
      const inLibrary = await User.findOne({ _id: req.userId, library: req.params.id })
      if (!purchase && !inLibrary && String(doc.authorId) !== String(req.userId))
        return res.json({ success: false, message: 'Accès refusé.' })
    }

    // Priority: real PDF text > AI summary > description
    let ttsText = ''
    const pdfText = await extractPdfText(doc.pdfUrl)
    if (pdfText && pdfText.length > 200) {
      // Use real PDF content (first 3000 chars for TTS)
      ttsText = `Document: ${doc.title}.\n\n${pdfText.substring(0, 3000)}`
    } else if (doc.aiSummary) {
      ttsText = `Titre: ${doc.title}.\n\nRésumé: ${doc.aiSummary}`
      if (doc.aiKeyPoints?.length) ttsText += `\n\nPoints clés: ${doc.aiKeyPoints.join('. ')}.`
    } else {
      ttsText = `Titre: ${doc.title}. Catégorie: ${doc.category}. ${doc.description || ''}`
    }

    res.json({ success: true, text: ttsText, language: doc.language || 'fr' })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

export const chatWithDocument = async (req, res) => {
  try {
    const { message, sessionId } = req.body
    const doc = await Document.findById(req.params.id)
    if (!doc) return res.json({ success: false, message: 'Document introuvable.' })

    if (!doc.isFree) {
      const purchase  = await Purchase.findOne({ userId: req.userId, documentId: req.params.id, status: 'completed' })
      const inLibrary = await User.findOne({ _id: req.userId, library: req.params.id })
      if (!purchase && !inLibrary && String(doc.authorId) !== String(req.userId))
        return res.json({ success: false, message: 'Accès refusé.' })
    }

    let session = sessionId ? await ChatSession.findById(sessionId).catch(() => null) : null
    if (!session) {
      session = await ChatSession.create({ userId: req.userId, documentId: req.params.id, messages: [] })
    }

    session.messages.push({ role: 'user', content: message })

    let aiResponse = ''
    if (!openai) {
      const q = message.toLowerCase()
      const title    = doc.title
      const category = doc.category
      const summary  = doc.aiSummary || doc.description || ''
      const points   = doc.aiKeyPoints || []
      const keywords = doc.aiKeywords || doc.tags || []
      const author   = doc.authorName || 'un auteur DocuMind'
      const pages    = doc.pageCount > 0 ? `${doc.pageCount} pages` : 'non renseigné'
      const price    = doc.isFree ? 'gratuit' : `${doc.price}€`
      const lang     = doc.language === 'fr' ? 'français' : doc.language === 'en' ? 'anglais' : doc.language

      if (q.includes('page') || q.includes('combien') || q.includes('long') || q.includes('taille'))
        aiResponse = `Le nombre de pages de "${title}" est ${pages}. La taille du fichier est ${doc.fileSize || 'non renseignée'}. Le temps de lecture estimé est ${doc.readTime > 0 ? doc.readTime + ' minutes' : 'non calculé'}.`
      else if (q.includes('résumé') || q.includes('sujet') || q.includes('parle') || q.includes('contenu') || q.includes('traite'))
        aiResponse = summary
          ? `📄 Ce document traite de : ${summary}`
          : `"${title}" est un document de la catégorie ${category}. Il couvre les aspects fondamentaux de ce domaine.`
      else if (q.includes('point') || q.includes('clé') || q.includes('important') || q.includes('apprend') || q.includes('apprendre'))
        aiResponse = points.length > 0
          ? `💡 Points clés de "${title}" : ` + points.map((p, i) => `${i+1}. ${p}`).join(' | ')
          : `Ce document couvre les aspects essentiels de ${category}.`
      else if (q.includes('mot') || q.includes('keyword') || q.includes('thème') || q.includes('tag'))
        aiResponse = keywords.length > 0
          ? `🏷️ Mots-clés et thèmes : ${keywords.join(', ')}`
          : `Ce document porte sur : ${category}`
      else if (q.includes('auteur') || q.includes('qui a') || q.includes('écrit') || q.includes('rédigé'))
        aiResponse = `✍️ Ce document a été rédigé par **${author}**.`
      else if (q.includes('prix') || q.includes('coût') || q.includes('gratuit') || q.includes('payant') || q.includes('acheter'))
        aiResponse = doc.isFree
          ? `✅ Ce document est **gratuit** ! Vous pouvez l'ajouter à votre bibliothèque immédiatement.`
          : `💳 Ce document est disponible au prix de **${doc.price}€**. Après achat, vous aurez un accès illimité.`
      else if (q.includes('langue') || q.includes('language') || q.includes('français') || q.includes('anglais'))
        aiResponse = `🌍 Ce document est rédigé en **${lang}**.`
      else if (q.includes('catégorie') || q.includes('domaine') || q.includes('type'))
        aiResponse = `📂 Catégorie : **${category}**. Tags : ${keywords.slice(0,5).join(', ') || 'non renseignés'}.`
      else if (q.includes('note') || q.includes('avis') || q.includes('évaluation') || q.includes('rating'))
        aiResponse = doc.rating > 0
          ? `⭐ Ce document est noté **${doc.rating}/5** basé sur ${doc.numReviews} avis. ${doc.rating >= 4.5 ? 'Excellent document !' : doc.rating >= 4 ? 'Très bien noté.' : 'Document apprécié.'}`
          : `Ce document n'a pas encore de notes.`
      else if (q.includes('télécharg') || q.includes('download'))
        aiResponse = `📥 Ce document a été téléchargé **${doc.downloads} fois**${doc.isFree ? '. Vous pouvez le télécharger gratuitement.' : ' après achat.'}`
      else
        aiResponse = `Je suis l'assistant IA de "${title}" (mode démo). Vous pouvez me demander : le résumé, les points clés, le nombre de pages, l'auteur, le prix, la langue, les mots-clés. Configurez OPENAI_API_KEY dans .env pour des réponses intelligentes basées sur le contenu réel du PDF.`
    } else {
      // Extrait le vrai texte du PDF pour un contexte maximal
      const pdfText = await extractPdfText(doc.pdfUrl)

      const contextBlock = pdfText
        ? `\n\nCONTENU RÉEL DU PDF (extrait):\n${pdfText}`
        : `\n\nRésumé IA: ${doc.aiSummary || 'Non disponible'}\nPoints clés: ${(doc.aiKeyPoints || []).join(' | ')}`

      const systemPrompt = `Tu es un assistant IA expert et pédagogue, spécialisé dans l'analyse du document suivant.

INFORMATIONS DU DOCUMENT:
- Titre: "${doc.title}"
- Catégorie: ${doc.category}
- Auteur: ${doc.authorName}
- Description: ${doc.description}
- Mots-clés: ${(doc.aiKeywords || doc.tags || []).join(', ')}
${contextBlock}

INSTRUCTIONS:
- Réponds en français, de façon précise, structurée et pédagogique
- Cite des passages spécifiques du document si disponibles
- Si une question dépasse le contenu du document, dis-le clairement
- Utilise des exemples concrets tirés du document
- Sois exhaustif mais concis`

      const history  = session.messages.slice(-12).map(m => ({ role: m.role, content: m.content }))
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [{ role: 'system', content: systemPrompt }, ...history],
        max_tokens: 1000,
        temperature: 0.2,
      })
      aiResponse = response.choices[0].message.content
    }

    session.messages.push({ role: 'assistant', content: aiResponse })
    await session.save()
    res.json({ success: true, response: aiResponse, sessionId: session._id })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

export const getRecommendations = async (req, res) => {
  try {
    const user         = await User.findById(req.userId)
    const preferredCats= user.preferences?.categories || []
    let docs
    if (preferredCats.length > 0) {
      docs = await Document.find({ status: 'published', category: { $in: preferredCats } })
        .sort({ rating: -1, views: -1 }).limit(8).select('-embeddings -comments')
    }
    if (!docs || docs.length < 4) {
      docs = await Document.find({ status: 'published' })
        .sort({ views: -1, rating: -1 }).limit(8).select('-embeddings -comments')
    }
    res.json({ success: true, documents: docs })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

// ═══════════════════════════════════════════
// DASHBOARDS
// ═══════════════════════════════════════════
export const clientDashboard = async (req, res) => {
  try {
    const user      = await User.findById(req.userId).populate('library', 'title coverUrl category isFree')
    const purchases = await Purchase.find({ userId: req.userId })
      .populate('documentId', 'title coverUrl').sort({ createdAt: -1 }).limit(5)
    const recentDocs= await Document.find({ status: 'published' })
      .sort({ createdAt: -1 }).limit(6).select('-embeddings -comments')
    res.json({ success: true, user, purchases, recentDocs, libraryCount: user.library.length })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

export const authorDashboard = async (req, res) => {
  try {
    const docs      = await Document.find({ authorId: req.userId }).select('-embeddings').sort({ createdAt: -1 })
    const purchases = await Purchase.find({ authorId: req.userId })
      .populate('documentId', 'title').sort({ createdAt: -1 }).limit(10)
    const author    = await User.findById(req.userId).select('-password')
    const totalViews    = docs.reduce((a, d) => a + d.views, 0)
    const totalDownloads= docs.reduce((a, d) => a + d.downloads, 0)
    const totalPurchases= docs.reduce((a, d) => a + d.purchases, 0)
    res.json({ success: true, docs, purchases, author,
      stats: { totalViews, totalDownloads, totalPurchases, totalEarnings: author.totalEarnings, docCount: docs.length } })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

export const adminDashboard = async (req, res) => {
  try {
    const [userCount, docCount, purchaseCount, recentUsers, recentDocs, purchases] = await Promise.all([
      User.countDocuments(),
      Document.countDocuments(),
      Purchase.countDocuments({ status: 'completed' }),
      User.find().select('-password').sort({ createdAt: -1 }).limit(5),
      Document.find().sort({ createdAt: -1 }).limit(5).select('-embeddings'),
      Purchase.find({ status: 'completed' }).sort({ createdAt: -1 }).limit(10)
        .populate('documentId', 'title').populate('userId', 'name'),
    ])
    const revenue = await Purchase.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ])
    res.json({ success: true,
      stats: { userCount, docCount, purchaseCount, revenue: revenue[0]?.total || 0 },
      recentUsers, recentDocs, purchases })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

export const getAllDocumentsAdmin = async (req, res) => {
  try {
    const docs = await Document.find().select('-embeddings').sort({ createdAt: -1 }).populate('authorId', 'name')
    res.json({ success: true, documents: docs })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

export const moderateDocument = async (req, res) => {
  try {
    const { status, isFeatured, isVerified } = req.body
    const updates = {}
    if (status !== undefined)      updates.status      = status
    if (isFeatured !== undefined)  updates.isFeatured  = isFeatured
    if (isVerified !== undefined)  updates.isVerified  = isVerified
    const doc = await Document.findByIdAndUpdate(req.params.id, updates, { new: true })
    res.json({ success: true, document: doc })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

// ═══════════════════════════════════════════
// SERVE PDF (auth-gated)
// ═══════════════════════════════════════════
export const servePdf = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id).select('pdfUrl isFree authorId')
    if (!doc) return res.status(404).json({ success: false, message: 'Document introuvable.' })

    // Access check
    if (!doc.isFree) {
      const token = req.cookies?.token
      if (!token) return res.status(401).json({ success: false, message: 'Connexion requise.' })
      const { verify } = await import('jsonwebtoken')
      let decoded
      try { decoded = verify(token, process.env.JWT_SECRET) } catch { return res.status(401).json({ success: false, message: 'Token invalide.' }) }
      const userId = decoded.id
      const purchase  = await Purchase.findOne({ userId, documentId: req.params.id, status: 'completed' })
      const inLibrary = await User.findOne({ _id: userId, library: req.params.id })
      const isAuthor  = String(doc.authorId) === String(userId)
      const isAdmin   = decoded.role === 'admin'
      if (!purchase && !inLibrary && !isAuthor && !isAdmin)
        return res.status(403).json({ success: false, message: 'Accès refusé.' })
    }

    const pdfUrl = doc.pdfUrl
    if (!pdfUrl) return res.status(404).json({ success: false, message: 'Fichier non trouvé.' })

    // Increment download count only for explicit downloads (not inline viewing)
    if (req.query.download === '1') {
      Document.findByIdAndUpdate(req.params.id, { $inc: { downloads: 1 } }).catch(() => {})
    }

    // Local file
    if (pdfUrl.startsWith('/uploads/')) {
      const { createReadStream, existsSync } = await import('fs')
      const { join, dirname } = await import('path')
      const { fileURLToPath } = await import('url')
      const __dir = dirname(fileURLToPath(import.meta.url))
      const localPath = join(__dir, '..', pdfUrl)
      if (!existsSync(localPath)) return res.status(404).json({ success: false, message: 'Fichier introuvable sur le serveur.' })
      const inline = req.query.download !== '1'
      res.setHeader('Content-Type', 'application/pdf')
      res.setHeader('Content-Disposition', `${inline ? 'inline' : 'attachment'}; filename="${encodeURIComponent(doc.title || 'document')}.pdf"`)
      createReadStream(localPath).pipe(res)
      return
    }

    // Remote URL — redirect
    res.redirect(pdfUrl)
  } catch (e) {
    res.status(500).json({ success: false, message: e.message })
  }
}

// ═══════════════════════════════════════════════════════════════════════
// NEW: CART
// ═══════════════════════════════════════════════════════════════════════
import { Order, Promotion, Dispute, Notification } from '../models/index.js'

// helper
const createNotif = async (userId, type, title, message, link='') => {
  try { await Notification.create({ userId, type, title, message, link }) } catch {}
}

export const getCart = async (req, res) => {
  try {
    const user = await User.findById(req.userId).populate('cart.documentId', '-embeddings -comments')
    res.json({ success: true, cart: (user.cart || []).filter(c => c.documentId) })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

export const addToCart = async (req, res) => {
  try {
    const { documentId } = req.body
    const doc = await Document.findById(documentId)
    if (!doc) return res.json({ success: false, message: 'Document introuvable.' })
    if (doc.isFree) return res.json({ success: false, message: 'Les documents gratuits sont accessibles directement.' })
    const user = await User.findById(req.userId)
    const already = (user.cart || []).find(c => c.documentId?.toString() === documentId)
    if (already) return res.json({ success: false, message: 'Déjà dans le panier.' })
    const owned = await Purchase.findOne({ userId: req.userId, documentId, status: 'completed' })
    if (owned) return res.json({ success: false, message: 'Vous possédez déjà ce document.' })
    user.cart = user.cart || []
    user.cart.push({ documentId })
    await user.save()
    res.json({ success: true, message: 'Ajouté au panier.' })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

export const removeFromCart = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    user.cart = (user.cart || []).filter(c => c.documentId?.toString() !== req.params.id)
    await user.save()
    res.json({ success: true })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

export const clearCart = async (req, res) => {
  try {
    await User.findByIdAndUpdate(req.userId, { cart: [] })
    res.json({ success: true })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

// ═══════════════════════════════════════════════════════════════════════
// NEW: ORDERS (panier → commande)
// ═══════════════════════════════════════════════════════════════════════
export const placeOrder = async (req, res) => {
  try {
    const { documentIds, promoCode, paymentMethod } = req.body
    if (!documentIds?.length) return res.json({ success: false, message: 'Panier vide.' })

    const docs = await Document.find({ _id: { $in: documentIds }, status: 'published' })
    if (!docs.length) return res.json({ success: false, message: 'Documents introuvables.' })

    // Check already owned
    for (const doc of docs) {
      if (!doc.isFree) {
        const owned = await Purchase.findOne({ userId: req.userId, documentId: doc._id, status: 'completed' })
        if (owned) return res.json({ success: false, message: `Vous possédez déjà "${doc.title}".` })
      }
    }

    const amount = docs.reduce((s, d) => s + (d.isFree ? 0 : d.price), 0)
    let discount = 0, promoDoc = null

    if (promoCode) {
      promoDoc = await Promotion.findOne({ code: promoCode.toUpperCase(), isActive: true })
      if (!promoDoc) return res.json({ success: false, message: 'Code promo invalide.' })
      if (promoDoc.expiresAt && promoDoc.expiresAt < new Date()) return res.json({ success: false, message: 'Code promo expiré.' })
      if (promoDoc.usedCount >= promoDoc.maxUses) return res.json({ success: false, message: 'Code promo épuisé.' })
      if (amount < promoDoc.minAmount) return res.json({ success: false, message: `Montant minimum: ${promoDoc.minAmount}€` })
      discount = Math.round(amount * promoDoc.discount) / 100
    }

    const finalAmount = Math.max(amount - discount, 0)
    const order = await Order.create({
      userId: req.userId,
      items: docs.map(d => ({ documentId: d._id, authorId: d.authorId, title: d.title, coverUrl: d.coverUrl, price: d.isFree ? 0 : d.price, authorName: d.authorName })),
      amount, discount, finalAmount,
      paymentMethod: paymentMethod || 'card',
      paymentStatus: 'paid',
      promoCode: promoCode || '',
    })

    // Create purchases + update library
    const user = await User.findById(req.userId)
    for (const doc of docs) {
      await Purchase.findOneAndUpdate(
        { userId: req.userId, documentId: doc._id },
        { userId: req.userId, documentId: doc._id, authorId: doc.authorId, amount: doc.price, status: 'completed' },
        { upsert: true, new: true }
      )
      if (!user.library.map(String).includes(String(doc._id))) user.library.push(doc._id)
      await Document.findByIdAndUpdate(doc._id, { $inc: { purchases: 1, downloads: 1 } })
      if (!doc.isFree) {
        await User.findByIdAndUpdate(doc.authorId, { $inc: { totalEarnings: doc.price * 0.8, totalRevenue: doc.price * 0.8 } })
        await createNotif(doc.authorId, 'purchase', '💰 Nouvelle vente !', `"${doc.title}" a été acheté.`, '/author')
      }
    }
    user.cart = (user.cart || []).filter(c => !documentIds.includes(c.documentId?.toString()))
    await user.save()

    if (promoDoc) { promoDoc.usedCount += 1; await promoDoc.save() }
    await createNotif(req.userId, 'order', '✅ Commande confirmée', `Votre commande de ${finalAmount}€ a été traitée.`, '/dashboard')

    res.json({ success: true, order })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.userId }).sort({ createdAt: -1 })
    res.json({ success: true, orders })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

export const adminGetOrders = async (req, res) => {
  try {
    const orders = await Order.find().populate('userId', 'name email').sort({ createdAt: -1 })
    res.json({ success: true, orders })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

// ═══════════════════════════════════════════════════════════════════════
// NEW: PROMOTIONS
// ═══════════════════════════════════════════════════════════════════════
export const validatePromoCode = async (req, res) => {
  try {
    const promo = await Promotion.findOne({ code: req.params.code.toUpperCase(), isActive: true })
    if (!promo) return res.json({ success: false, message: 'Code invalide.' })
    if (promo.expiresAt && promo.expiresAt < new Date()) return res.json({ success: false, message: 'Code expiré.' })
    if (promo.usedCount >= promo.maxUses) return res.json({ success: false, message: 'Code épuisé.' })
    res.json({ success: true, promotion: promo })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

export const adminGetPromotions = async (req, res) => {
  try {
    const promos = await Promotion.find().sort({ createdAt: -1 })
    res.json({ success: true, promotions: promos })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

export const adminCreatePromotion = async (req, res) => {
  try {
    const promo = await Promotion.create({ ...req.body, createdBy: req.userId, code: req.body.code.toUpperCase() })
    res.json({ success: true, promotion: promo })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

export const adminTogglePromotion = async (req, res) => {
  try {
    const p = await Promotion.findById(req.params.id)
    if (!p) return res.json({ success: false, message: 'Introuvable.' })
    p.isActive = !p.isActive; await p.save()
    res.json({ success: true, promotion: p })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

export const adminDeletePromotion = async (req, res) => {
  try {
    await Promotion.findByIdAndDelete(req.params.id)
    res.json({ success: true })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

// ═══════════════════════════════════════════════════════════════════════
// NEW: DISPUTES
// ═══════════════════════════════════════════════════════════════════════
export const createDispute = async (req, res) => {
  try {
    const { orderId, documentId, type, reason, description } = req.body
    if (!reason?.trim() || !description?.trim()) return res.json({ success: false, message: 'Motif et description requis.' })
    const dispute = await Dispute.create({ orderId, documentId, clientId: req.userId, type: type || 'order', reason, description })
    await createNotif(req.userId, 'dispute', '📋 Signalement enregistré', 'Votre signalement a été pris en charge.', '/dashboard')
    res.json({ success: true, dispute })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

export const getMyDisputes = async (req, res) => {
  try {
    const disputes = await Dispute.find({ clientId: req.userId })
      .populate('documentId', 'title coverUrl').populate('orderId', 'amount createdAt')
      .sort({ createdAt: -1 })
    res.json({ success: true, disputes })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

export const adminGetDisputes = async (req, res) => {
  try {
    const disputes = await Dispute.find()
      .populate('clientId', 'name email').populate('documentId', 'title')
      .sort({ createdAt: -1 })
    res.json({ success: true, disputes })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

export const adminResolveDispute = async (req, res) => {
  try {
    const { status, resolution } = req.body
    const d = await Dispute.findByIdAndUpdate(req.params.id, { status, resolution: resolution || '' }, { new: true })
    if (d) await createNotif(d.clientId, 'dispute', '📋 Signalement mis à jour', `Votre signalement est maintenant: ${status}`, '/dashboard')
    res.json({ success: true, dispute: d })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

// ═══════════════════════════════════════════════════════════════════════
// NEW: NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════
export const getMyNotifications = async (req, res) => {
  try {
    const notifs = await Notification.find({ userId: req.userId }).sort({ createdAt: -1 }).limit(30)
    const unread = await Notification.countDocuments({ userId: req.userId, isRead: false })
    res.json({ success: true, notifications: notifs, unread })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

export const markNotifsRead = async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.userId, isRead: false }, { isRead: true })
    res.json({ success: true })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

// ═══════════════════════════════════════════════════════════════════════
// NEW: AI SCORE for author request (ElectroShop style)
// ═══════════════════════════════════════════════════════════════════════
function computeAiScore(form) {
  let score = 0; const notes = []
  const exp = Number(form.yearsExperience) || 0
  if (exp >= 10)     { score += 25; notes.push('Expert confirmé (10+ ans)') }
  else if (exp >= 5) { score += 18; notes.push('Expérience solide (5+ ans)') }
  else if (exp >= 2) { score += 10; notes.push('Expérience modérée') }
  else               { score += 3;  notes.push('Peu d\'expérience déclarée') }

  if (form.specialty?.length > 3)    { score += 10; notes.push('Spécialité renseignée') }
  if (form.institution?.length > 3)  { score += 10; notes.push('Institution renseignée') }

  const motLen = (form.motivation || '').length
  if (motLen > 400)      { score += 25; notes.push('Motivation très détaillée') }
  else if (motLen > 150) { score += 15; notes.push('Motivation correcte') }
  else if (motLen > 50)  { score += 7;  notes.push('Motivation trop courte') }
  else                   { notes.push('Motivation insuffisante') }

  if (form.documentTypes?.length >= 3) { score += 15; notes.push('Types de documents variés') }
  else if (form.documentTypes?.length >= 1) { score += 8; notes.push('Types partiels') }

  if (form.linkedin) { score += 8;  notes.push('LinkedIn fourni') }
  if (form.website)  { score += 7;  notes.push('Site web fourni') }

  return { score: Math.min(score, 100), reasoning: notes.join(' | '), decision: score >= 65 ? 'recommended' : score >= 40 ? 'review' : 'not_recommended' }
}

export const requestAuthorV2 = async (req, res) => {
  try {
    const user = await User.findById(req.userId)
    if (['author','admin'].includes(user.role)) return res.json({ success: false, message: 'Vous êtes déjà auteur.' })
    if (user.authorRequest?.status === 'pending') return res.json({ success: false, message: 'Demande déjà en attente.' })

    const { displayName, specialty, institution, yearsExperience, documentTypes, motivation, linkedin, website } = req.body
    if (!motivation?.trim()) return res.json({ success: false, message: 'La motivation est requise.' })

    const form = { displayName, specialty, institution, yearsExperience, documentTypes, motivation, linkedin, website }
    const ai   = computeAiScore(form)

    user.publisherForm = form
    user.aiScore       = ai.score
    user.aiDecision    = ai.decision
    user.aiReasoning   = ai.reasoning
    user.authorRequest = { status: 'pending', requestedAt: new Date() }
    await user.save()

    res.json({ success: true, message: 'Candidature envoyée.', aiScore: ai.score, aiDecision: ai.decision })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

// ═══════════════════════════════════════════════════════════════════════
// NEW: SALES PREDICTION (ML linear regression)
// ═══════════════════════════════════════════════════════════════════════
function linReg(ys) {
  const n = ys.length; if (n < 2) return { slope: 0, intercept: ys[0] || 0 }
  const xm = (n-1)/2, ym = ys.reduce((a,b)=>a+b,0)/n
  let num=0, den=0
  ys.forEach((y,i) => { num+=(i-xm)*(y-ym); den+=(i-xm)**2 })
  const s = den ? num/den : 0
  return { slope: s, intercept: ym - s*xm }
}
const SEASON_BOOST = { 'Mathématiques': {12:1.5,1:1.5,2:1.4,6:0.7,7:0.6,8:0.6}, 'Informatique': {9:1.4,10:1.4,1:1.3,7:0.8} }
function getBoost(cat, month) { return SEASON_BOOST[cat]?.[month] || 1.0 }

export const getSalesPrediction = async (req, res) => {
  try {
    const doc = await Document.findById(req.params.id)
    if (!doc) return res.json({ success: false, message: 'Introuvable.' })
    if (doc.authorId.toString() !== req.userId && req.userRole !== 'admin')
      return res.json({ success: false, message: 'Non autorisé.' })

    const now = new Date()
    const boost = getBoost(doc.category, now.getMonth() + 1)
    const sixAgo = new Date(); sixAgo.setMonth(sixAgo.getMonth() - 6)

    const monthly = await Purchase.aggregate([
      { $match: { documentId: doc._id, createdAt: { $gte: sixAgo }, status: 'completed' } },
      { $group: { _id: { y: { $year:'$createdAt' }, m: { $month:'$createdAt' } }, count: { $sum:1 }, revenue: { $sum:'$amount' } } },
      { $sort: { '_id.y':1,'_id.m':1 } },
    ])

    const counts = monthly.map(m => m.count)
    const { slope, intercept } = linReg(counts)
    const predicted = Math.max(Math.round((intercept + slope * counts.length) * boost), 0)
    const trend = slope > 0.3 ? '📈 En hausse' : slope < -0.3 ? '📉 En baisse' : '➡️ Stable'

    res.json({ success: true, prediction: {
      documentId: doc._id, title: doc.title, category: doc.category,
      historicalMonths: monthly, predictedNextMonth: predicted,
      predictedRevenue: predicted * doc.price,
      trend, seasonBoost: boost, season: ['Hiver','Hiver','Printemps','Printemps','Printemps','Été','Été','Été','Automne','Automne','Automne','Hiver'][now.getMonth()],
      confidence: Math.min(Math.round((counts.length / 6) * 90 + 10), 95),
    }})
  } catch (e) { res.json({ success: false, message: e.message }) }
}

// ═══════════════════════════════════════════════════════════════════════
// NEW: ENHANCED ADMIN DASHBOARD (with revenue/orders)
// ═══════════════════════════════════════════════════════════════════════
export const adminDashboardV2 = async (req, res) => {
  try {
    const [userCount, docCount, purchaseCount, openDisputes, pendingAuthors] = await Promise.all([
      User.countDocuments(), Document.countDocuments(),
      Purchase.countDocuments({ status:'completed' }),
      Dispute.countDocuments({ status:'open' }),
      User.countDocuments({ 'authorRequest.status':'pending' }),
    ])
    const revenueAgg = await Purchase.aggregate([{ $match:{status:'completed'} },{ $group:{_id:null,total:{$sum:'$amount'}} }])
    const totalRevenue = revenueAgg[0]?.total || 0
    const sixAgo = new Date(); sixAgo.setMonth(sixAgo.getMonth()-6)
    const [monthlyRevenue, monthlyUsers, topDocs, recentOrders] = await Promise.all([
      Purchase.aggregate([
        { $match:{status:'completed',createdAt:{$gte:sixAgo}} },
        { $group:{_id:{y:{$year:'$createdAt'},m:{$month:'$createdAt'}},revenue:{$sum:'$amount'},count:{$sum:1}} },
        { $sort:{'_id.y':1,'_id.m':1} },
      ]),
      User.aggregate([
        { $match:{createdAt:{$gte:sixAgo}} },
        { $group:{_id:{y:{$year:'$createdAt'},m:{$month:'$createdAt'}},count:{$sum:1}} },
        { $sort:{'_id.y':1,'_id.m':1} },
      ]),
      Document.find({status:'published'}).sort({purchases:-1}).limit(5).select('title purchases price authorName coverUrl'),
      Order.find().sort({createdAt:-1}).limit(10).populate('userId','name email'),
    ])
    res.json({ success:true, stats:{ userCount,docCount,purchaseCount,openDisputes,pendingAuthors,totalRevenue }, monthlyRevenue,monthlyUsers,topDocs,recentOrders })
  } catch(e){ res.json({success:false,message:e.message}) }
}

// ═══════════════════════════════════════════════════════════════════════
// MISSING FUNCTIONS — Added in v3
// ═══════════════════════════════════════════════════════════════════════

export const updateUser = async (req, res) => {
  try {
    const { name, email, role, bio } = req.body
    const updates = {}
    if (name) updates.name = name.trim()
    if (email) updates.email = email.toLowerCase().trim()
    if (role) updates.role = role
    if (bio !== undefined) updates.bio = bio
    if (req.file) {
      if (isCloudinaryConfigured()) {
        try {
          const r = await uploadToCloudinary(req.file.buffer, { folder: 'documind/avatars', transformation: [{ width: 200, height: 200, crop: 'fill', gravity: 'face' }] })
          updates.avatar = r.secure_url
        } catch { updates.avatar = saveLocally(req.file.buffer, 'avatars', req.file.originalname) }
      } else { updates.avatar = saveLocally(req.file.buffer, 'avatars', req.file.originalname) }
    }
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password')
    if (!user) return res.json({ success: false, message: 'Introuvable.' })
    res.json({ success: true, user })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

export const cancelOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id)
    if (!order) return res.json({ success: false, message: 'Commande introuvable.' })
    if (order.userId.toString() !== req.userId) return res.json({ success: false, message: 'Non autorisé.' })
    if (order.status === 'cancelled') return res.json({ success: false, message: 'Déjà annulée.' })
    order.status = 'cancelled'
    await order.save()
    res.json({ success: true, order })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

export const addDisputeMessage = async (req, res) => {
  try {
    const dispute = await Dispute.findById(req.params.id)
    if (!dispute) return res.json({ success: false, message: 'Signalement introuvable.' })
    const user = await User.findById(req.userId).select('name role')
    if (!dispute.messages) dispute.messages = []
    dispute.messages.push({ senderId: req.userId, senderName: user.name, senderRole: user.role, message: req.body.message, date: new Date() })
    await dispute.save()
    res.json({ success: true, dispute })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

export const adminUpdatePromotion = async (req, res) => {
  try {
    const p = await Promotion.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!p) return res.json({ success: false, message: 'Introuvable.' })
    res.json({ success: true, promotion: p })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

export const saveReadingProgress = async (req, res) => {
  try {
    const { documentId, page, percentage, bookmarks } = req.body
    // Store in user or separate model — use User.preferences to avoid extra model
    const user = await User.findById(req.userId)
    if (!user.readingProgress) user.readingProgress = {}
    user.readingProgress[documentId] = { page, percentage, bookmarks: bookmarks || [], updatedAt: new Date() }
    user.markModified('readingProgress')
    await user.save()
    res.json({ success: true })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

export const getReadingProgress = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('readingProgress')
    const progress = user?.readingProgress?.[req.params.id] || null
    res.json({ success: true, progress })
  } catch (e) { res.json({ success: false, message: e.message }) }
}

// ═══════════════════════════════════════════════════════════════════════
// STORE-WIDE FORECAST (admin — for /api/dashboard/forecast)
// Adapted from ElectroShop getStoreForecast
// ═══════════════════════════════════════════════════════════════════════
export const getStoreForecast = async (req, res) => {
  try {
    const now = new Date()
    const MONTHS_FR = ['Jan','Fév','Mar','Avr','Mai','Jun','Jul','Aoû','Sep','Oct','Nov','Déc']
    const season = m => m>=3&&m<=5?'Printemps':m>=6&&m<=8?'Été':m>=9&&m<=11?'Automne':'Hiver'
    const boost  = (cat, m) => ({ 'Mathématiques':{12:1.5,1:1.5,2:1.4,6:0.7,7:0.6,8:0.6}, 'Informatique':{9:1.4,10:1.4,1:1.3,7:0.8} }[cat]?.[m] || 1.0)

    // Top 8 documents par achats
    const topPurchases = await Purchase.aggregate([
      { $match: { status: 'completed' } },
      { $group: { _id: '$documentId', totalSales: { $sum: 1 }, totalRevenue: { $sum: '$amount' } } },
      { $sort: { totalSales: -1 } }, { $limit: 8 },
    ])

    const topDocuments = []
    for (const tp of topPurchases) {
      const doc = await Document.findById(tp._id).select('title category price')
      if (!doc) continue
      // Historical monthly sales (last 6 months)
      const historicalMonths = []
      for (let i = 5; i >= 0; i--) {
        const start = new Date(now.getFullYear(), now.getMonth() - i, 1)
        const end   = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59)
        const cnt = await Purchase.countDocuments({ documentId: tp._id, status: 'completed', createdAt: { $gte: start, $lte: end } })
        historicalMonths.push({ month: MONTHS_FR[start.getMonth()], count: cnt })
      }
      // Linear regression
      const ys = historicalMonths.map(m => m.count)
      const { slope, intercept } = linReg(ys)
      const n = ys.length
      const currentBoost = boost(doc.category, now.getMonth()+1)
      const predictions = [1,2,3].map(i => {
        const fm = ((now.getMonth() + i) % 12) + 1
        const fb = boost(doc.category, fm)
        const base = Math.max(0, intercept + slope * (n-1+i))
        return Math.round(base * (fb / Math.max(currentBoost, 0.1)))
      })
      const trendLabel = slope > 0.3 ? '📈 En hausse' : slope < -0.3 ? '📉 En baisse' : '➡️ Stable'
      topDocuments.push({
        documentId: tp._id, title: doc.title, category: doc.category,
        totalSales: tp.totalSales, totalRevenue: tp.totalRevenue,
        historicalMonths, predictions, trend: trendLabel,
        season: season(now.getMonth()+1), seasonBoost: currentBoost,
      })
    }

    // Monthly revenue (last 12 months)
    const monthlyRevenue = []
    for (let i = 11; i >= 0; i--) {
      const start = new Date(now.getFullYear(), now.getMonth()-i, 1)
      const end   = new Date(now.getFullYear(), now.getMonth()-i+1, 0, 23,59,59)
      const agg = await Purchase.aggregate([
        { $match: { status: 'completed', createdAt: { $gte: start, $lte: end } } },
        { $group: { _id: null, revenue: { $sum: '$amount' }, count: { $sum: 1 } } }
      ])
      monthlyRevenue.push({ month: MONTHS_FR[start.getMonth()], revenue: agg[0]?.revenue || 0, count: agg[0]?.count || 0 })
    }

    // Predict revenue (next 3 months) via linear regression on last 6 months
    const last6Rev = monthlyRevenue.slice(-6).map(m => m.revenue)
    const { slope: rs, intercept: ri } = linReg(last6Rev)
    const predictedRevenue = [1,2,3].map(i => {
      const fm = ((now.getMonth()+i) % 12) + 1
      const sb = fm>=6&&fm<=8?1.3:fm>=11||fm<=1?1.2:1.0
      return Math.max(0, Math.round((ri + rs*(last6Rev.length-1+i))*sb))
    })

    res.json({ success: true, topDocuments, monthlyRevenue, predictedRevenue })
  } catch (e) { res.json({ success: false, message: e.message }) }
}
