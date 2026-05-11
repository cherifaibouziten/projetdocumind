import mongoose from 'mongoose'

// ─── USER ─────────────────────────────────────────────────────────────
const userSchema = new mongoose.Schema({
  name:          { type: String, required: true, trim: true },
  email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
  password:      { type: String, required: true, select: false },
  role:          { type: String, enum: ['reader', 'author', 'admin'], default: 'reader' },
  bio:           { type: String, default: '' },
  avatar:        { type: String, default: '' },
  isActive:      { type: Boolean, default: true },
  library:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],  // purchased/free docs
  wishlist:      [{ type: mongoose.Schema.Types.ObjectId, ref: 'Document' }],
  following:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  followers:     [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  totalEarnings: { type: Number, default: 0 },
  authorRequest: {
    status:          { type: String, enum: ['none','pending','approved','rejected'], default: 'none' },
    requestedAt:     Date,
    reviewedAt:      Date,
    reviewedBy:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    reason:          { type: String, default: '' },
  },
  preferences: {
    language:    { type: String, default: 'fr' },
    ttsVoice:    { type: String, default: 'nova' },
    darkMode:    { type: Boolean, default: true },
    categories:  [String],
  },
  stripeCustomerId: { type: String, default: '' },
  cart: [{
    documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
    addedAt: { type: Date, default: Date.now },
  }],
  totalRevenue: { type: Number, default: 0 },
  publisherForm: {
    displayName:     { type: String, default: '' },
    specialty:       { type: String, default: '' },
    institution:     { type: String, default: '' },
    yearsExperience: { type: Number, default: 0 },
    documentTypes:   [String],
    motivation:      { type: String, default: '' },
    linkedin:        { type: String, default: '' },
    website:         { type: String, default: '' },
  },
  aiScore: { type: Number, default: 0 },
  aiDecision: { type: String, default: '' },
  aiReasoning: { type: String, default: '' },
  readingProgress: { type: mongoose.Schema.Types.Mixed, default: {} },
}, { timestamps: true, minimize: false })

// ─── CATEGORY ─────────────────────────────────────────────────────────
const categorySchema = new mongoose.Schema({
  name:        { type: String, required: true, unique: true },
  slug:        { type: String, required: true, unique: true },
  icon:        { type: String, default: '📄' },
  color:       { type: String, default: '#6366f1' },
  image:       { type: String, default: '' },
  description: { type: String, default: '' },
  isActive:    { type: Boolean, default: true },
  order:       { type: Number, default: 0 },
  docCount:    { type: Number, default: 0 },
}, { timestamps: true })

// ─── DOCUMENT ─────────────────────────────────────────────────────────
const commentSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  userName:  String,
  userAvatar:String,
  rating:    { type: Number, min: 1, max: 5 },
  comment:   String,
  likes:     { type: Number, default: 0 },
  likedBy:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  replies:   [{
    userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    userName: String,
    userAvatar:String,
    comment:  String,
    date:     { type: Date, default: Date.now },
  }],
  date:      { type: Date, default: Date.now },
})

const documentSchema = new mongoose.Schema({
  title:         { type: String, required: true, trim: true },
  description:   { type: String, default: '' },
  slug:          { type: String, unique: true, sparse: true },
  authorId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorName:    { type: String, default: '' },
  authorAvatar:  { type: String, default: '' },

  // Files
  pdfUrl:        { type: String, required: true },
  pdfPublicId:   { type: String, default: '' },
  coverUrl:      { type: String, default: '' },
  coverPublicId: { type: String, default: '' },
  previewPages:  [String],      // URLs of first 3 pages as images

  // Metadata
  category:      { type: String, required: true },
  tags:          [String],
  language:      { type: String, default: 'fr' },
  pageCount:     { type: Number, default: 0 },
  fileSize:      { type: String, default: '' },
  readTime:      { type: Number, default: 0 }, // minutes

  // Pricing
  isFree:        { type: Boolean, default: true },
  price:         { type: Number, default: 0 },

  // AI Content
  aiSummary:     { type: String, default: '' },
  aiKeyPoints:   [String],
  aiKeywords:    [String],
  embeddings:    [Number],   // vector for semantic search

  // Stats
  views:         { type: Number, default: 0 },
  downloads:     { type: Number, default: 0 },
  purchases:     { type: Number, default: 0 },
  likes:         { type: Number, default: 0 },
  likedBy:       [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  rating:        { type: Number, default: 0 },
  numReviews:    { type: Number, default: 0 },
  comments:      [commentSchema],

  // Status
  status:        { type: String, enum: ['draft','published','suspended'], default: 'published' },
  isFeatured:    { type: Boolean, default: false },
  isVerified:    { type: Boolean, default: false },

}, { timestamps: true })

documentSchema.pre('save', function(next) {
  // Auto-generate slug
  if (!this.slug) {
    this.slug = this.title
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .substring(0, 80) + '-' + Date.now().toString(36)
  }
  // Recalculate rating
  if (this.comments.length > 0) {
    const withRating = this.comments.filter(c => c.rating)
    if (withRating.length > 0) {
      this.rating = +(withRating.reduce((a, r) => a + r.rating, 0) / withRating.length).toFixed(1)
      this.numReviews = withRating.length
    }
  }
  next()
})

// ─── PURCHASE ─────────────────────────────────────────────────────────
const purchaseSchema = new mongoose.Schema({
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  documentId:    { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
  authorId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  amount:        { type: Number, required: true },
  stripePaymentIntentId: { type: String, default: '' },
  status:        { type: String, enum: ['pending','completed','refunded'], default: 'completed' },
}, { timestamps: true })

// ─── AI CHAT SESSION ──────────────────────────────────────────────────
const chatSessionSchema = new mongoose.Schema({
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
  messages:   [{
    role:    { type: String, enum: ['user','assistant'] },
    content: String,
    date:    { type: Date, default: Date.now },
  }],
}, { timestamps: true })

export const User        = mongoose.model('User',        userSchema)
export const Category    = mongoose.model('Category',    categorySchema)
export const Document    = mongoose.model('Document',    documentSchema)
export const Purchase    = mongoose.model('Purchase',    purchaseSchema)
export const ChatSession = mongoose.model('ChatSession', chatSessionSchema)

// ─── CART ─────────────────────────────────────────────────────────────
const cartItemSchema = new mongoose.Schema({
  documentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Document', required: true },
  addedAt:    { type: Date, default: Date.now },
})

// ─── ORDER ────────────────────────────────────────────────────────────
const orderItemSchema = new mongoose.Schema({
  documentId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
  authorId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  title:       String,
  coverUrl:    String,
  price:       Number,
  authorName:  String,
})

const orderSchema = new mongoose.Schema({
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  items:         [orderItemSchema],
  amount:        { type: Number, required: true },
  discount:      { type: Number, default: 0 },
  finalAmount:   { type: Number, required: true },
  status:        { type: String, enum: ['pending','confirmed','cancelled','refunded'], default: 'confirmed' },
  paymentMethod: { type: String, default: 'card' },
  paymentStatus: { type: String, enum: ['pending','paid','refunded'], default: 'paid' },
  promoCode:     { type: String, default: '' },
  stripePaymentIntentId: { type: String, default: '' },
}, { timestamps: true })

// ─── PROMOTION ────────────────────────────────────────────────────────
const promotionSchema = new mongoose.Schema({
  code:        { type: String, required: true, unique: true, uppercase: true },
  discount:    { type: Number, required: true },
  minAmount:   { type: Number, default: 0 },
  maxUses:     { type: Number, default: 100 },
  usedCount:   { type: Number, default: 0 },
  isActive:    { type: Boolean, default: true },
  expiresAt:   Date,
  description: { type: String, default: '' },
  createdBy:   { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true })

// ─── DISPUTE ──────────────────────────────────────────────────────────
const disputeSchema = new mongoose.Schema({
  orderId:     { type: mongoose.Schema.Types.ObjectId, ref: 'Order' },
  documentId:  { type: mongoose.Schema.Types.ObjectId, ref: 'Document' },
  clientId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  authorId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  type:        { type: String, enum: ['order','document','author','other'], default: 'order' },
  reason:      String,
  description: String,
  status:      { type: String, enum: ['open','in_review','resolved','closed'], default: 'open' },
  resolution:  { type: String, default: '' },
  messages:    [{
    sender:   String,
    senderId: mongoose.Schema.Types.ObjectId,
    text:     String,
    date:     { type: Date, default: Date.now },
  }],
}, { timestamps: true })

// ─── NOTIFICATION ─────────────────────────────────────────────────────
const notificationSchema = new mongoose.Schema({
  userId:  { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type:    { type: String, enum: ['order','purchase','dispute','author_approved','author_rejected','promo','info'], default: 'info' },
  title:   String,
  message: String,
  isRead:  { type: Boolean, default: false },
  link:    { type: String, default: '' },
}, { timestamps: true })

export const Order        = mongoose.model('Order',        orderSchema)
export const Promotion    = mongoose.model('Promotion',    promotionSchema)
export const Dispute      = mongoose.model('Dispute',      disputeSchema)
export const Notification = mongoose.model('Notification', notificationSchema)

// ── Patch User schema to add cart field ──
// (done via migration helper below)
