# 📚 DocuMind v3 — Plateforme PDF Intelligente

> Marketplace de documents PDF avec IA (résumé, chatbot RAG, TTS réel), paiements intégrés, prédictions ML des ventes et analytics avancées.

## ✅ Corrections v3 (par rapport à v2)

| Problème | Fix |
|---|---|
| Photos ne s'affichent pas | `/uploads` proxied via Vite + credentials Cloudinary nettoyés |
| PDF "mode démo" erreur | `.env` nettoyé, stockage local par défaut, `/api/pdf/:id` pour lecture |
| Catégories ne filtrent pas | Explore.jsx fixé : slug→name avant envoi à l'API |
| Interface ne se met pas à jour | Explore.jsx réécrit avec `useCallback` + `useEffect` sur dépendances |
| Boutons retour manquants | `navigate(-1)` ajouté dans toutes les pages |
| TTS lit description | `getTTSText` lit le PDF réel via `pdf-parse`, puis résumé IA |
| Commandes "chargement" infini | Orders.jsx réécrit avec gestion d'erreurs + axios direct |
| Signalements ne fonctionnent pas | Disputes.jsx réécrit + route `/disputes/all` fixée |
| Promotions ne se créent pas | NewAdminPages.jsx réécrit, `<form>` supprimé, route `/promos` fixée |
| Routes mortes (Orders/Disputes/Promos) | Toutes les routes déplacées **avant** `export default r` |
| Pas de simulation paiement | Mode démo actif si Stripe absent : achat direct sans carte |
| Photo upload catégories/users | `addCategory`/`updateCategory`/`addUser` supportent Multer + image |
| Filtrage IA demandes auteurs | `requestAuthorV2` + score IA + `Authors.jsx` style Electroshop |
| Prédictions ML absentes | `getStoreForecast` + `AdminPredictions.jsx` avec Recharts |
| Compteur téléchargements | `servePdf` incrémente `downloads` sur `?download=1` |
| PDF intégré manquant | Onglet "📖 Lire" avec iframe `/api/pdf/:id` dans DocumentDetail |

## 🚀 Installation

### Prérequis
- Node.js 18+, MongoDB (local ou Atlas)

### 1. Backend
```bash
cd server
npm install
node config/seed.js    # Crée les données de test
npm run dev            # Lance sur http://localhost:4000
```

### 2. Frontend
```bash
cd client
npm install
npm run dev            # Lance sur http://localhost:5173
```

## 🔑 Comptes de test

| Rôle | Email | Mot de passe |
|------|-------|--------------|
| Admin | admin@documind.com | admin123 |
| Auteur | sarah@example.com | password123 |
| Auteur | ahmed@example.com | password123 |
| Lecteur | jean@test.com | password123 |

## ⚙️ Variables d'environnement (server/.env)

Toutes optionnelles — des modes démo/local s'activent automatiquement:

```env
PORT=4000
MONGODB_URI=mongodb://localhost:27017/documind
JWT_SECRET=change_this_in_production
CLIENT_URL=http://localhost:5173
NODE_ENV=development

# Optionnel — stockage local sinon
# CLOUDINARY_CLOUD_NAME=...
# CLOUDINARY_API_KEY=...
# CLOUDINARY_API_SECRET=...

# Optionnel — mode démo sinon (achat sans paiement)
# STRIPE_SECRET_KEY=sk_test_...

# Optionnel — résumés génériques sinon
# OPENAI_API_KEY=sk-...
```

## 🏗️ Architecture

```
documind_v3/
├── server/
│   ├── index.js              # Express + static /uploads
│   ├── .env                  # Config (tout optionnel)
│   ├── config/
│   │   ├── db.js
│   │   └── seed.js           # Données de démo riches
│   ├── models/index.js       # User, Document, Category, Purchase, Order, Promotion, Dispute, Notification, ChatSession
│   ├── controllers/index.js  # Toute la logique métier
│   ├── routes/index.js       # 50+ routes (toutes avant export default!)
│   └── middleware/
│       ├── auth.js
│       └── upload.js         # Multer + Cloudinary/local
└── client/
    ├── vite.config.js        # Proxy /api et /uploads → port 4000
    └── src/
        ├── App.jsx           # Routes incl. /admin/predictions
        ├── lib/api.js        # axios avec préfixe /api
        ├── context/AppContext.jsx
        ├── components/
        │   ├── layout/Navbar.jsx, Footer.jsx
        │   ├── pdf/PdfViewer.jsx    # react-pdf
        │   └── ui/AuthModal.jsx, DocumentCard.jsx, StarRating.jsx
        └── pages/
            ├── Explore.jsx          # Filtrage catégorie (slug→name) fixé
            ├── DocumentDetail.jsx   # Onglet Lire + Signalement + Panier
            ├── Cart.jsx
            ├── client/
            │   ├── Orders.jsx       # Réécrit
            │   └── Disputes.jsx     # Réécrit
            ├── author/
            │   ├── AuthorLayout.jsx # "Retour au site"
            │   └── UploadDocument.jsx
            └── admin/
                ├── AdminLayout.jsx  # Lien Prédictions ML
                ├── Authors.jsx      # Score IA style Electroshop
                ├── Categories.jsx   # Upload image
                ├── NewAdminPages.jsx # Orders/Promotions/Disputes fixés
                └── Predictions.jsx  # Nouveau — ML avec Recharts
```

## 📡 API Routes principales

| Route | Description |
|-------|-------------|
| `GET /api/pdf/:id` | PDF inline (auth si payant) |
| `GET /api/pdf/:id/download?download=1` | PDF téléchargement (incrémente compteur) |
| `GET /api/dashboard/forecast` | Prédictions ML (régression linéaire) |
| `GET /api/ai/tts/:id` | Texte PDF réel pour TTS |
| `GET /api/documents/recommendations` | Recommandations IA |
| `POST /api/author/request` | Demande auteur (avec score IA) |
| `GET /api/disputes/all` | Tous les signalements (admin) |
| `GET /api/orders/all` | Toutes les commandes (admin) |
