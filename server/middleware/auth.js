import jwt from 'jsonwebtoken'

const verify = (req, res, next, requiredRole = null) => {
  try {
    const token = req.cookies?.token
    if (!token) return res.json({ success: false, message: 'Non authentifié.' })
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.userId = decoded.id
    req.userRole = decoded.role
    if (requiredRole) {
      const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole]
      if (!roles.includes(decoded.role)) {
        return res.json({ success: false, message: 'Accès non autorisé.' })
      }
    }
    next()
  } catch {
    res.json({ success: false, message: 'Token invalide.' })
  }
}

export const authUser   = (req, res, next) => verify(req, res, next)
export const authAuthor = (req, res, next) => verify(req, res, next, ['author', 'admin'])
export const authAdmin  = (req, res, next) => verify(req, res, next, 'admin')
