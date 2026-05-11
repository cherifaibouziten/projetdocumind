import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { User, Category, Document, Purchase, Order, Promotion, Dispute } from '../models/index.js'

const rand = (a,b) => Math.floor(Math.random()*(b-a+1))+a
const pick = arr => arr[Math.floor(Math.random()*arr.length)]
const ago  = n => new Date(Date.now() - n*86400000)

const COVERS = {
  math:'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=500&q=80',
  code:'https://images.unsplash.com/photo-1587620962725-abab7fe55159?w=500&q=80',
  biz: 'https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=500&q=80',
  design:'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=500&q=80',
  lang:'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=500&q=80',
  science:'https://images.unsplash.com/photo-1507413245164-6160d8298b31?w=500&q=80',
  med:'https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=500&q=80',
  law:'https://images.unsplash.com/photo-1589829545856-d10d557cf95f?w=500&q=80',
  finance:'https://images.unsplash.com/photo-1611974789855-9c2a0a7236a3?w=500&q=80',
  cv:'https://images.unsplash.com/photo-1586281380349-632531db7ed4?w=500&q=80',
}

const CATS = [
  {name:'Mathématiques',slug:'mathematiques',icon:'📐',color:'#6366f1',order:1},
  {name:'Informatique',slug:'informatique',icon:'💻',color:'#8b5cf6',order:2},
  {name:'Business & Gestion',slug:'business',icon:'💼',color:'#f59e0b',order:3},
  {name:'Finance & Économie',slug:'finance',icon:'💰',color:'#10b981',order:4},
  {name:'Design & Créativité',slug:'design',icon:'🎨',color:'#ec4899',order:5},
  {name:'Langues',slug:'langues',icon:'🌍',color:'#06b6d4',order:6},
  {name:'Sciences',slug:'sciences',icon:'🔬',color:'#7c3aed',order:7},
  {name:'Médecine & Santé',slug:'medecine',icon:'🏥',color:'#ef4444',order:8},
  {name:'Droit & Juridique',slug:'droit',icon:'⚖️',color:'#78716c',order:9},
  {name:'Templates & Outils',slug:'templates',icon:'📋',color:'#0ea5e9',order:10},
]

const AUTHORS_DATA = [
  {name:'Dr. Karim Meziani',email:'meziani@documind.dz',specialty:'Mathématiques',institution:'Université de Sétif',exp:15,linkedin:'linkedin.com/in/meziani'},
  {name:'Yasmine Benhacine',email:'yasmine@documind.dz',specialty:'Informatique & IA',institution:'ESI Alger',exp:8,linkedin:'linkedin.com/in/yasmine'},
  {name:'Prof. Hadj Hamza',email:'hadj@documind.dz',specialty:'Business & Droit',institution:'HEC Alger',exp:20,linkedin:'linkedin.com/in/hadj'},
  {name:'Sara Aouali',email:'sara@documind.dz',specialty:'Design & UX',institution:'École des Beaux-Arts',exp:6,website:'sara-design.dz'},
  {name:'Dr. Nadia Ouahmed',email:'nadia@documind.dz',specialty:'Médecine',institution:'Faculté de Médecine Annaba',exp:18,linkedin:'linkedin.com/in/nadia'},
]

const DOCS_DATA = [
  // Maths
  {title:'Algèbre Linéaire — Cours Complet L1/L2',desc:'Vecteurs, matrices, déterminants, espaces vectoriels. 250 exercices corrigés. Prépa grandes écoles.',cat:'Mathématiques',tags:['algèbre','L1','prépa'],isFree:false,price:12,pages:180,views:1240,purchases:89,cover:'math',authorIdx:0,featured:true},
  {title:'Probabilités et Statistiques — Exercices',desc:'Lois de probabilités, tests d\'hypothèses, régressions. 200 exercices avec solutions.',cat:'Mathématiques',tags:['stats','probabilités'],isFree:false,price:9,pages:150,views:980,purchases:64,cover:'math',authorIdx:0,featured:false},
  {title:'Analyse Mathématique — L1 Cours Complet',desc:'Suites, limites, continuité, dérivation, intégration. TD corrigés inclus.',cat:'Mathématiques',tags:['analyse','L1'],isFree:true,price:0,pages:120,views:3200,purchases:0,cover:'math',authorIdx:0,featured:true},
  // Info
  {title:'Python pour la Data Science',desc:'NumPy, Pandas, Matplotlib, Scikit-learn. 50 projets pratiques ML.',cat:'Informatique',tags:['python','ML','data'],isFree:false,price:18,pages:240,views:4100,purchases:203,cover:'code',authorIdx:1,featured:true},
  {title:'React & Node.js — Full Stack',desc:'Créez des applications modernes. React Hooks, Express, MongoDB, JWT.',cat:'Informatique',tags:['react','nodejs'],isFree:false,price:20,pages:310,views:3200,purchases:178,cover:'code',authorIdx:1,featured:true},
  {title:'Algorithmes & Structures — C/C++',desc:'Tri, graphes, arbres, programmation dynamique. 100 exercices.',cat:'Informatique',tags:['algorithmes','C++'],isFree:false,price:13,pages:200,views:1800,purchases:95,cover:'code',authorIdx:1,featured:false},
  {title:'Base de Données SQL — Cours & TP',desc:'Modélisation, normalisation, SQL avancé. Exercices Oracle/MySQL.',cat:'Informatique',tags:['SQL','BDD'],isFree:true,price:0,pages:140,views:5400,purchases:0,cover:'code',authorIdx:1,featured:false},
  {title:'Cybersécurité — Fondamentaux',desc:'Cryptographie, OWASP Top 10, tests de pénétration éthiques.',cat:'Informatique',tags:['cybersec','réseaux'],isFree:false,price:16,pages:290,views:2600,purchases:143,cover:'code',authorIdx:1,featured:true},
  // Business
  {title:'Business Plan — Guide Algérie 2025',desc:'BP solide adapté au marché algérien. ANSEJ, CNAC, financement.',cat:'Business & Gestion',tags:['BP','entrepreneuriat'],isFree:false,price:22,pages:95,views:6800,purchases:267,cover:'biz',authorIdx:2,featured:true},
  {title:'Marketing Digital — Réseaux Sociaux',desc:'Facebook Ads, Instagram, TikTok, SEO. Marché algérien & MENA.',cat:'Business & Gestion',tags:['marketing','digital'],isFree:false,price:15,pages:160,views:4200,purchases:189,cover:'biz',authorIdx:2,featured:true},
  {title:'Comptabilité — Plan Comptable Algérien',desc:'PCG algérien, journal, grand livre, bilan, compte de résultat.',cat:'Finance & Économie',tags:['comptabilité','PCG'],isFree:false,price:12,pages:220,views:3100,purchases:134,cover:'finance',authorIdx:2,featured:false},
  {title:'Économie Algérienne 2024 — Rapport',desc:'PIB, inflation, hydrocarbures, investissements. Rapport complet.',cat:'Finance & Économie',tags:['économie','Algérie'],isFree:true,price:0,pages:80,views:7200,purchases:0,cover:'finance',authorIdx:2,featured:false},
  // Design
  {title:'Figma — UI/UX Design de A à Z',desc:'Wireframes, prototypes, design systems. Apprenez Figma en partant de zéro.',cat:'Design & Créativité',tags:['Figma','UX'],isFree:false,price:14,pages:180,views:4000,purchases:201,cover:'design',authorIdx:3,featured:true},
  {title:'Adobe Photoshop — Guide Complet',desc:'Outils essentiels, retouche portrait, montage créatif.',cat:'Design & Créativité',tags:['Photoshop','design'],isFree:false,price:11,pages:130,views:3500,purchases:156,cover:'design',authorIdx:3,featured:false},
  // Médecine
  {title:'Anatomie Humaine — Atlas Illustré',desc:'Systèmes osseux, musculaire, nerveux. Schémas couleur. Médecine 2A.',cat:'Médecine & Santé',tags:['anatomie','atlas'],isFree:false,price:25,pages:320,views:4200,purchases:134,cover:'med',authorIdx:4,featured:true},
  {title:'Pharmacologie Générale — Bases',desc:'Pharmacocinétique, pharmacodynamique. Concours Pharmacie.',cat:'Médecine & Santé',tags:['pharmacologie'],isFree:false,price:18,pages:240,views:2100,purchases:89,cover:'med',authorIdx:4,featured:false},
  // Droit
  {title:'Droit Commercial Algérien — Annoté',desc:'Code de commerce annoté. Sociétés, contrats, fonds de commerce.',cat:'Droit & Juridique',tags:['droit','commerce'],isFree:false,price:20,pages:280,views:2900,purchases:112,cover:'law',authorIdx:2,featured:true},
  // Templates
  {title:'Pack 50 CV Professionnels — Word',desc:'50 modèles CV modernes. Lettres de motivation incluses.',cat:'Templates & Outils',tags:['CV','Word'],isFree:false,price:6,pages:55,views:9200,purchases:389,cover:'cv',authorIdx:3,featured:true},
  {title:'Pack Business Plan — 20 Templates Excel',desc:'Tableaux financiers automatisés. Compatible Excel/Google Sheets.',cat:'Templates & Outils',tags:['BP','excel'],isFree:false,price:8,pages:30,views:5600,purchases:223,cover:'cv',authorIdx:3,featured:true},
]

const CLIENTS_DATA = [
  {name:'Mohamed Cherif',email:'cherif@gmail.com'},
  {name:'Fatima Hamidi',email:'fatima@gmail.com'},
  {name:'Youcef Belaidi',email:'youcef@gmail.com'},
  {name:'Amina Mansouri',email:'amina@gmail.com'},
  {name:'Riad Benaissa',email:'riad@gmail.com'},
  {name:'Nour Ghezali',email:'nour@gmail.com'},
  {name:'Sofiane Mebarki',email:'sofiane@gmail.com'},
  {name:'Lila Bencherif',email:'lila@gmail.com'},
]

const PROMOS_DATA = [
  {code:'BIENVENUE',discount:15,minAmount:0,maxUses:500,description:'Réduction de bienvenue 15%',expiresAt:new Date(2026,11,31)},
  {code:'ETUDIANT20',discount:20,minAmount:10,maxUses:1000,description:'Réduction étudiants 20%',expiresAt:new Date(2026,11,31)},
  {code:'FLASH30',discount:30,minAmount:20,maxUses:100,description:'Offre flash 30% limitée',expiresAt:new Date(2025,11,31)},
  {code:'FREE10',discount:10,minAmount:0,maxUses:200,description:'10% sur premier achat',expiresAt:new Date(2026,11,31)},
]

const COMMENTS_POS = [
  'Excellent document, très bien structuré !',
  'Exactement ce que je cherchais. Je recommande !',
  'Contenu de qualité, les exercices corrigés sont utiles.',
  'Meilleur cours trouvé en ligne. Merci à l\'auteur.',
  'Parfait pour la préparation aux concours. 5 étoiles !',
]
const COMMENTS_NEG = [
  'Correct mais quelques coquilles typographiques.',
  'Utile mais j\'aurais aimé plus d\'exemples pratiques.',
]

const seed = async () => {
  await mongoose.connect(process.env.MONGODB_URI)
  console.log('\n🗄️  MongoDB connecté')

  await Promise.all([
    User.deleteMany({}), Category.deleteMany({}), Document.deleteMany({}),
    Purchase.deleteMany({}), Order.deleteMany({}), Promotion.deleteMany({}), Dispute.deleteMany({}),
  ])
  console.log('🧹  Base nettoyée')

  const [adminPwd, authorPwd, clientPwd] = await Promise.all([
    bcrypt.hash('Admin@2025', 12), bcrypt.hash('Author@2025', 12), bcrypt.hash('Reader@2025', 12),
  ])

  // Admin
  const admin = await User.create({
    name:'Administrateur DocuMind', email:'admin@documind.dz', password:adminPwd, role:'admin', isActive:true,
  })
  console.log('👑  Admin: admin@documind.dz / Admin@2025')

  // Categories
  const cats = await Category.insertMany(CATS)
  console.log(`📂  ${cats.length} catégories`)

  // Promotions
  const promos = await Promotion.insertMany(PROMOS_DATA.map(p => ({...p, createdBy:admin._id})))
  console.log(`🎟️  ${promos.length} promotions`)

  // Authors
  const authorDocs = []
  for (const a of AUTHORS_DATA) {
    const aiScore = rand(70, 98)
    const u = await User.create({
      name:a.name, email:a.email, password:authorPwd, role:'author', isActive:true,
      bio:`Expert en ${a.specialty} depuis ${a.exp} ans. ${a.institution}.`,
      totalEarnings: rand(500, 5000), totalRevenue: rand(500, 5000),
      aiScore, aiDecision: 'recommended',
      aiReasoning: `Score IA: ${aiScore}/100 — ✅ APPROBATION RECOMMANDÉE | Expert confirmé (${a.exp} ans) | Institution: ${a.institution}`,
      publisherForm: {
        displayName: a.name, specialty: a.specialty, institution: a.institution,
        yearsExperience: a.exp, documentTypes:['Cours','Exercices','Guides'],
        motivation: `Je souhaite partager ${a.exp} années d'expérience en ${a.specialty}.`,
        linkedin: a.linkedin||'', website: a.website||'',
      },
      authorRequest: { status:'approved', requestedAt:ago(rand(90,365)), reviewedAt:ago(rand(30,89)), reviewedBy:admin._id },
    })
    authorDocs.push(u)
  }
  console.log(`✍️  ${AUTHORS_DATA.length} auteurs`)

  // Documents
  // ─── Mapping PDFs réels → documents ─────────────────────────────────
  // Noms exacts des fichiers dans server/uploads/pdfs/
  const PDF_MAP = {
    'Python pour la Data Science':               'TP3_Big Data.pdf',
    'React & Node.js — Full Stack':              'chapitre1_1.pdf',
    'Algorithmes & Structures — C/C++':          'chapitre_2.pdf',
    'Base de Données SQL — Cours & TP':          'chapitre3_2025.pdf',
    'Cybersécurité — Fondamentaux':              'chapitre4_2025.pdf',
    'Algèbre Linéaire — Cours Complet L1/L2':   'chapitre5_2025.pdf',
    'Probabilités et Statistiques — Exercices':  'TP5_M1GL.pdf',
    'Analyse Mathématique — L1 Cours Complet':   'chapitre1_1.pdf',
    'Économie Algérienne 2024 — Rapport':        'History of computers (3).pdf',
    'Business Plan — Guide Algérie 2025':        'Crystal Method for Appliance E-commerce.pdf',
    'Marketing Digital — Réseaux Sociaux':       'chapitre_2.pdf',
    'Comptabilité — Plan Comptable Algérien':    'chapitre3_2025.pdf',
    'Figma — UI/UX Design de A à Z':            'chapitre4_2025.pdf',
    'Adobe Photoshop — Guide Complet':           'chapitre5_2025.pdf',
    'Anatomie Humaine — Atlas Illustré':         'TP5_M1GL.pdf',
    'Pharmacologie Générale — Bases':            'chapitre1_1.pdf',
    'Droit Commercial Algérien — Annoté':        'Crystal Method for Appliance E-commerce.pdf',
    'Pack 50 CV Professionnels — Word':          'TP3_Big Data.pdf',
    'Pack Business Plan — 20 Templates Excel':   'History of computers (3).pdf',
  }

  const DEFAULT_PDF = 'chapitre1_1.pdf'

  const docDocs = []
  for (const d of DOCS_DATA) {
    const author = authorDocs[d.authorIdx] || authorDocs[0]
    const doc = await Document.create({
      title: d.title, description: d.desc, category: d.cat, tags: d.tags,
      isFree: d.isFree, price: d.price, pageCount: d.pages, language:'fr',
      coverUrl: COVERS[d.cover] || '', pdfUrl: `/uploads/pdfs/${PDF_MAP[d.title] || DEFAULT_PDF}`,
      authorId: author._id, authorName: author.name, authorAvatar: author.avatar||'',
      views: d.views, purchases: d.purchases, downloads: Math.round(d.views*0.3),
      isFeatured: d.featured, status:'published', fileType:'PDF', domain: d.cat,
      aiSummary: `Ce document traite de ${d.cat}. ${d.desc}`,
      aiKeyPoints: [`Introduction à ${d.cat}`, 'Méthodologie et exemples', 'Exercices pratiques', 'Synthèse et conclusion'],
      aiKeywords: d.tags,
    })
    docDocs.push(doc)
  }
  console.log(`📄  ${docDocs.length} documents`)

  // Clients
  const clientDocs = []
  for (const c of CLIENTS_DATA) {
    const u = await User.create({ name:c.name, email:c.email, password:clientPwd, role:'reader', isActive:true })
    clientDocs.push(u)
  }
  console.log(`👥  ${clientDocs.length} lecteurs`)

  // Comments
  let commentCount = 0
  for (const doc of docDocs) {
    if (doc.purchases > 0) {
      const num = Math.min(rand(2,6), clientDocs.length)
      const reviewers = [...clientDocs].sort(()=>Math.random()-0.5).slice(0,num)
      for (const r of reviewers) {
        const pos = Math.random() > 0.2
        doc.comments.push({
          userId:r._id, userName:r.name, userAvatar:'',
          rating: pos ? rand(4,5) : rand(3,4),
          comment: pick(pos ? COMMENTS_POS : COMMENTS_NEG),
          date: ago(rand(1,120)),
        })
        commentCount++
      }
      await doc.save()
    }
  }
  console.log(`⭐  ${commentCount} commentaires`)

  // Purchases & Orders
  const paidDocs = docDocs.filter(d => !d.isFree && d.purchases > 0)
  let orderCount=0, purchaseCount=0
  for (const client of clientDocs) {
    const numOrders = rand(1,3)
    for (let o=0; o<numOrders; o++) {
      const items = [...paidDocs].sort(()=>Math.random()-0.5).slice(0, rand(1,3))
      if (!items.length) continue
      const amount = items.reduce((s,d)=>s+d.price, 0)
      const usePromo = Math.random() > 0.7
      const discount = usePromo ? Math.round(amount*0.15*100)/100 : 0
      const order = await Order.create({
        userId:client._id,
        items: items.map(d=>({documentId:d._id,authorId:d.authorId,title:d.title,coverUrl:d.coverUrl,price:d.price,authorName:d.authorName})),
        amount, discount, finalAmount: amount-discount,
        status:'confirmed', paymentStatus:'paid',
        promoCode: usePromo ? 'ETUDIANT20' : '',
        createdAt: ago(rand(1,180)),
      })
      orderCount++
      for (const doc of items) {
        try {
          await Purchase.create({ userId:client._id, documentId:doc._id, authorId:doc.authorId, amount:doc.price, status:'completed', createdAt:order.createdAt })
          if (!client.library?.includes(doc._id)) {
            await User.findByIdAndUpdate(client._id, { $addToSet:{library:doc._id} })
          }
          purchaseCount++
        } catch {}
      }
    }
  }
  console.log(`🛒  ${orderCount} commandes, ${purchaseCount} achats`)

  // Disputes
  for (let i=0;i<6;i++) {
    const client = pick(clientDocs)
    const doc = pick(paidDocs)
    await Dispute.create({
      clientId:client._id, documentId:doc._id, authorId:doc.authorId,
      type:pick(['order','document','other']),
      reason:pick(['Document non conforme','Accès impossible','Contenu incomplet','Problème paiement']),
      description:`J'ai acheté "${doc.title}" et je rencontre un problème. Merci de traiter ma demande.`,
      status:pick(['open','open','in_review','resolved']),
      createdAt:ago(rand(1,60)),
    })
  }
  console.log('🚨  6 signalements')

  console.log('\n✅  Seed terminé !\n' + '─'.repeat(50))
  console.log('🔑  Comptes :')
  console.log('   admin@documind.dz  / Admin@2025')
  console.log('   meziani@documind.dz / Author@2025')
  console.log('   cherif@gmail.com   / Reader@2025')
  console.log('─'.repeat(50))

  await mongoose.disconnect()
  process.exit(0)
}
seed().catch(e=>{ console.error('❌',e); process.exit(1) })