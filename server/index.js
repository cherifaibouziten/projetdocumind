import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { config } from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = dirname(__filename)
config({ path: join(__dirname, '.env') })

import connectDB from './config/db.js'
import router from './routes/index.js'

const app  = express()
const PORT = process.env.PORT || 4000

connectDB()

app.use(cors({ origin: process.env.CLIENT_URL, credentials: true }))
app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))
app.use(cookieParser())

// ── Serve uploaded files statically ──────────────────────────────────
app.use('/uploads', express.static(join(__dirname, 'uploads')))

app.use('/api', router)
app.get('/', (_, res) => res.json({ success: true, message: 'DocuMind API v1.0 🚀' }))

app.use((err, req, res, next) => {
  console.error('Error:', err.message)
  res.status(500).json({ success: false, message: err.message })
})

app.listen(PORT, () => console.log(`🚀 DocuMind API → http://localhost:${PORT}`))
