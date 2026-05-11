import { v2 as cloudinary } from 'cloudinary'
import multer from 'multer'
import { mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)

// Ensure local upload dirs exist
const UPLOADS_DIR  = join(__dirname, '..', 'uploads')
const PDFS_DIR     = join(UPLOADS_DIR, 'pdfs')
const COVERS_DIR   = join(UPLOADS_DIR, 'covers')
const AVATARS_DIR  = join(UPLOADS_DIR, 'avatars')
for (const d of [UPLOADS_DIR, PDFS_DIR, COVERS_DIR, AVATARS_DIR]) {
  mkdirSync(d, { recursive: true })
}

// ── Cloudinary (optional) ────────────────────────────────────────────
export const isCloudinaryConfigured = () =>
  !!(process.env.CLOUDINARY_CLOUD_NAME &&
     process.env.CLOUDINARY_API_KEY &&
     process.env.CLOUDINARY_API_SECRET &&
     !process.env.CLOUDINARY_API_KEY.includes('your_') &&
     !process.env.CLOUDINARY_CLOUD_NAME.includes('your_'))

if (isCloudinaryConfigured()) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
  console.log('✅ Cloudinary configuré')
} else {
  console.log('📁 Cloudinary non configuré — stockage local activé')
}

// ── Multer: memory storage ───────────────────────────────────────────
export const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf','image/jpeg','image/png','image/webp','image/gif']
    allowed.includes(file.mimetype) ? cb(null, true) : cb(new Error('Type non supporté'))
  },
})

// ── Save buffer to local disk ────────────────────────────────────────
import { writeFileSync } from 'fs'

export const saveLocally = (buffer, subdir, filename) => {
  const dir  = join(UPLOADS_DIR, subdir)
  mkdirSync(dir, { recursive: true })
  const safe = filename.replace(/[^a-zA-Z0-9._-]/g, '_')
  const name = `${Date.now()}_${safe}`
  const path = join(dir, name)
  writeFileSync(path, buffer)
  // Return public URL path
  return `/uploads/${subdir}/${name}`
}

// ── Upload to Cloudinary ─────────────────────────────────────────────
export const uploadToCloudinary = (buffer, options = {}) => {
  if (!isCloudinaryConfigured()) return Promise.reject(new Error('CLOUDINARY_NOT_CONFIGURED'))
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(options, (err, result) => {
      if (err) reject(err)
      else resolve(result)
    })
    stream.end(buffer)
  })
}

export const deleteFromCloudinary = async (publicId, resourceType = 'image') => {
  if (!isCloudinaryConfigured()) return
  try { await cloudinary.uploader.destroy(publicId, { resource_type: resourceType }) }
  catch (e) { console.error('Cloudinary delete error:', e.message) }
}

export { cloudinary, PDFS_DIR, COVERS_DIR, AVATARS_DIR }
