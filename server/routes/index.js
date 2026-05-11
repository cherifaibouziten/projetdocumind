/**
 * DocuMind v3 — Routes API complètes (toutes avant export default)
 */
import express from 'express'
import { authUser, authAuthor, authAdmin } from '../middleware/auth.js'
import { upload } from '../middleware/upload.js'
import * as C from '../controllers/index.js'

const r = express.Router()

// ─── AUTH ──────────────────────────────────────────────────────────
r.post('/auth/register', C.register)
r.post('/auth/login',    C.login)
r.get('/auth/logout',    C.logout)
r.get('/auth/me',        authUser, C.getMe)

// ─── PROFILE ───────────────────────────────────────────────────────
r.put('/profile',          authUser, upload.single('avatar'), C.updateProfile)
r.put('/profile/password', authUser, C.changePassword)

// ─── AUTHOR REQUESTS (with AI) ────────────────────────────────────
r.post('/author/request',    authUser,  C.requestAuthorV2)
r.post('/author/request/v2', authUser,  C.requestAuthorV2)  // alias
r.get('/author/pending',     authAdmin, C.getPendingAuthors)
r.put('/author/approve/:id', authAdmin, C.approveAuthor)

// ─── USERS (admin) ─────────────────────────────────────────────────
r.get('/users',              authAdmin, C.getAllUsers)
r.post('/users',             authAdmin, upload.single('avatar'), C.addUser)
r.put('/users/:id',          authAdmin, upload.single('avatar'), C.updateUser)
r.put('/users/:id/role',     authAdmin, C.updateUserRole)
r.put('/users/:id/toggle',   authAdmin, C.toggleUser)
r.delete('/users/:id',       authAdmin, C.deleteUser)

// ─── CATEGORIES ────────────────────────────────────────────────────
r.get('/categories',         C.getCategories)
r.post('/categories',        authAdmin, upload.single('image'), C.addCategory)
r.put('/categories/:id',     authAdmin, upload.single('image'), C.updateCategory)
r.delete('/categories/:id',  authAdmin, C.deleteCategory)

// ─── DOCUMENTS ─────────────────────────────────────────────────────
r.get('/documents',                  C.getDocuments)
r.get('/documents/mine',             authAuthor, C.getMyDocuments)
r.get('/documents/recommendations',  authUser,   C.getRecommendations)
r.get('/documents/:id',              C.getDocumentById)
r.post('/documents', authAuthor,
  upload.fields([{ name: 'pdf', maxCount: 1 }, { name: 'cover', maxCount: 1 }]),
  C.uploadDocument)
r.put('/documents/:id', authAuthor, upload.single('cover'), C.updateDocument)
r.delete('/documents/:id', authAuthor, C.deleteDocument)

// ─── LIKES & WISHLIST ──────────────────────────────────────────────
r.post('/documents/:id/like',     authUser, C.toggleLike)
r.post('/documents/:id/wishlist', authUser, C.toggleWishlist)
r.get('/wishlist',                authUser, C.getWishlist)

// ─── COMMENTS ──────────────────────────────────────────────────────
r.post('/documents/:id/comments',                   authUser,  C.addComment)
r.post('/documents/:id/comments/:commentId/reply',  authUser,  C.addReply)
r.delete('/documents/:id/comments/:commentId',      authAdmin, C.deleteComment)

// ─── LIBRARY ───────────────────────────────────────────────────────
r.get('/library',      authUser, C.getLibrary)
r.post('/library/:id', authUser, C.addToLibrary)

// ─── PURCHASES ─────────────────────────────────────────────────────
r.post('/purchases/intent',  authUser, C.createPaymentIntent)
r.post('/purchases/confirm', authUser, C.confirmPurchase)
r.get('/purchases/mine',     authUser, C.getMyPurchases)

// ─── AI ────────────────────────────────────────────────────────────
r.get('/ai/summary/:id', authUser, C.generateSummary)
r.get('/ai/tts/:id',     authUser, C.getTTSText)
r.post('/ai/chat/:id',   authUser, C.chatWithDocument)

// ─── CART ──────────────────────────────────────────────────────────
r.get('/cart',         authUser, C.getCart)
r.post('/cart',        authUser, C.addToCart)
r.delete('/cart/:id',  authUser, C.removeFromCart)
r.delete('/cart',      authUser, C.clearCart)

// ─── ORDERS ────────────────────────────────────────────────────────
r.post('/orders',          authUser,  C.placeOrder)
r.get('/orders/mine',      authUser,  C.getMyOrders)
r.get('/orders/all',       authAdmin, C.adminGetOrders)
r.put('/orders/:id/cancel',authUser,  C.cancelOrder)

// ─── PROMOTIONS ────────────────────────────────────────────────────
r.get('/promos',               authAdmin, C.adminGetPromotions)
r.post('/promos',              authAdmin, C.adminCreatePromotion)
r.put('/promos/:id',           authAdmin, C.adminUpdatePromotion)
r.patch('/promos/:id/toggle',  authAdmin, C.adminTogglePromotion)
r.delete('/promos/:id',        authAdmin, C.adminDeletePromotion)
r.get('/promos/validate/:code', C.validatePromoCode)

// ─── DISPUTES ──────────────────────────────────────────────────────
r.post('/disputes',              authUser,  C.createDispute)
r.get('/disputes/mine',          authUser,  C.getMyDisputes)
r.get('/disputes/all',           authAdmin, C.adminGetDisputes)
r.put('/disputes/:id',           authAdmin, C.adminResolveDispute)
r.post('/disputes/:id/message',  authUser,  C.addDisputeMessage)

// ─── NOTIFICATIONS ─────────────────────────────────────────────────
r.get('/notifications',      authUser, C.getMyNotifications)
r.patch('/notifications/read',authUser, C.markNotifsRead)

// ─── READING PROGRESS ──────────────────────────────────────────────
r.post('/reading/progress',    authUser, C.saveReadingProgress)
r.get('/reading/progress/:id', authUser, C.getReadingProgress)

// ─── DASHBOARDS ────────────────────────────────────────────────────
r.get('/dashboard/client',   authUser,   C.clientDashboard)
r.get('/dashboard/author',   authAuthor, C.authorDashboard)
r.get('/dashboard/admin',    authAdmin,  C.adminDashboard)
r.get('/dashboard/forecast', authAdmin,  C.getStoreForecast)

// ─── ADMIN MODERATION ──────────────────────────────────────────────
r.get('/admin/documents',      authAdmin, C.getAllDocumentsAdmin)
r.put('/admin/documents/:id',  authAdmin, C.moderateDocument)

// ─── PDF SERVE (streaming sécurisé) ───────────────────────────────
r.get('/pdf/:id',          C.servePdf)
r.get('/pdf/:id/download', C.servePdf)

export default r
