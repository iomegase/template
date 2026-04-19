 # Channel Manager — Design Spec
**Date:** 2026-04-19  
**Projet:** Transformation du template Next.js en PWA Channel Manager  
**Statut:** Approuvé

---

## 1. Contexte

Transformer le starter dashboard existant (Next.js 16, Prisma, PostgreSQL, Stripe, NextAuth) en une plateforme SaaS channel manager permettant :
- Aux propriétaires de logements de synchroniser leurs calendriers OTA (Airbnb, Booking, Vrbo…)
- Aux vacanciers de réserver en direct
- Au super admin (propriétaire de la plateforme) de percevoir 10% de commission sur chaque réservation

---

## 2. Modèle économique

- **Commission** : 10% sur chaque réservation directe via Stripe Connect
- **Split automatique** : 90% propriétaire / 10% plateforme à chaque paiement
- **Caution** : Payment Intent séparé, configurable par logement, capturé manuellement par le propriétaire après séjour (auto-libération J+7)

---

## 3. Rôles

| Rôle | Accès | Description |
|------|-------|-------------|
| `super_admin` | `app.taplateforme.com` | Propriétaire de la plateforme, gère les workspaces, perçoit 10% |
| `admin` | `app.taplateforme.com` + site public | Propriétaire de logement(s), gère ses biens et réservations |
| `user` (guest) | `jean.taplateforme.com` | Vacancier, réserve et consulte sa réservation |

---

## 4. Architecture

### Approche retenue
Extension modulaire du template existant (Option C). Réutilisation complète de : auth, billing (adapté Stripe Connect), users, settings, super-admin.

### Routing multi-tenant (Vercel)
```
taplateforme.com              → landing + inscription
app.taplateforme.com          → dashboard admin/super-admin
[slug].taplateforme.com       → site public du propriétaire
[custom-domain].com           → même site, domaine custom (CNAME Vercel)
```

Le middleware Next.js lit le hostname, identifie le workspace, injecte le contexte tenant.

### Stack technique
- **Framework** : Next.js 16, React 19, TypeScript strict
- **Auth** : NextAuth 5 (credentials + JWT)
- **DB** : PostgreSQL via Prisma 7
- **Paiements** : Stripe Connect (Express Accounts)
- **Stockage photos** : Cloudflare R2 (S3-compatible, pas de frais egress)
- **Emails** : Resend
- **PDF** : `@react-pdf/renderer` (composants JSX → PDF, idéal pour templates React)
- **iCal** : `node-ical` (parse) + `ical-generator` (export)
- **PWA** : `@ducanh2912/next-pwa` + manifest.json
- **Hosting** : Vercel (Cron Jobs pour sync iCal)
- **Langues** : FR + EN (`next-intl`)
- **Devises** : EUR, GBP (multi-currency Stripe)

---

## 5. Modèle de données

### Nouveaux modèles Prisma

```prisma
model Workspace {
  id               String    @id @default(cuid())
  slug             String    @unique
  name             String
  ownerId          String
  owner            User      @relation(fields: [ownerId], references: [id])
  stripeAccountId  String?   // Stripe Connect Express
  billingStatus    BillingStatus @default(inactive)
  logoUrl          String?
  primaryColor     String?
  properties       Property[]
  domain           CustomDomain?
  settings         WorkspaceSettings?
  blogPosts        BlogPost[]
  createdAt        DateTime  @default(now())
  updatedAt        DateTime  @updatedAt
}

model Property {
  id              String          @id @default(cuid())
  workspaceId     String
  workspace       Workspace       @relation(fields: [workspaceId], references: [id])
  slug            String
  name            String
  description     Json            // { fr: "...", en: "..." }
  type            PropertyType
  status          PropertyStatus  @default(draft)
  address         String
  city            String
  country         String
  latitude        Float?
  longitude       Float?
  maxGuests       Int
  bedrooms        Int
  bathrooms       Int
  pricePerNight   Decimal
  currency        String          @default("EUR")
  cleaningFee     Decimal         @default(0)
  depositAmount   Decimal         @default(0)
  minNights       Int             @default(1)
  seoTitle        String?
  seoDescription  String?
  faqItems        Json?           // [{ question: "...", answer: "..." }]
  photos          PropertyPhoto[]
  amenities       PropertyAmenity[]
  calendarFeeds   CalendarFeed[]
  calendarBlocks  CalendarBlock[]
  bookings        DirectBooking[]
  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt
  @@unique([workspaceId, slug])
}

model PropertyPhoto {
  id          String   @id @default(cuid())
  propertyId  String
  property    Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  url         String
  caption     String?
  order       Int      @default(0)
  createdAt   DateTime @default(now())
}

model PropertyAmenity {
  id         String   @id @default(cuid())
  propertyId String
  property   Property @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  key        String
}

model CalendarFeed {
  id          String     @id @default(cuid())
  propertyId  String
  property    Property   @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  source      OTASource
  url         String
  lastSyncAt  DateTime?
  syncStatus  SyncStatus @default(pending)
  createdAt   DateTime   @default(now())
}

model CalendarBlock {
  id          String        @id @default(cuid())
  propertyId  String
  property    Property      @relation(fields: [propertyId], references: [id], onDelete: Cascade)
  startDate   DateTime
  endDate     DateTime
  source      BlockSource
  bookingId   String?
  booking     DirectBooking? @relation(fields: [bookingId], references: [id])
  summary     String?
  createdAt   DateTime      @default(now())
}

model DirectBooking {
  id                      String         @id @default(cuid())
  reference               String         @unique
  propertyId              String
  property                Property       @relation(fields: [propertyId], references: [id])
  checkIn                 DateTime
  checkOut                DateTime
  nights                  Int
  guestName               String
  guestEmail              String
  guestPhone              String
  guestCount              Int
  pricePerNight           Decimal
  cleaningFee             Decimal
  platformFee             Decimal
  ownerAmount             Decimal
  totalAmount             Decimal
  currency                String
  status                  DirectBookingStatus
  stripePaymentIntentId   String?
  stripeTransferId        String?
  depositAmount           Decimal?
  depositPaymentIntentId  String?
  depositStatus           DepositStatus   @default(none)
  depositReleasedAt       DateTime?
  depositCapturedAmount   Decimal?
  specialRequests         String?
  extras                  Json?
  calendarBlocks          CalendarBlock[]
  messages                Message[]
  contract                RentalContract?
  createdAt               DateTime        @default(now())
  updatedAt               DateTime        @updatedAt
}

model Message {
  id          String        @id @default(cuid())
  bookingId   String
  booking     DirectBooking @relation(fields: [bookingId], references: [id])
  senderRole  MessageSender
  content     String
  readAt      DateTime?
  createdAt   DateTime      @default(now())
}

model RentalContract {
  id          String        @id @default(cuid())
  bookingId   String        @unique
  booking     DirectBooking @relation(fields: [bookingId], references: [id])
  pdfUrl      String
  generatedAt DateTime      @default(now())
  signedAt    DateTime?
}

model CustomDomain {
  id          String    @id @default(cuid())
  workspaceId String    @unique
  workspace   Workspace @relation(fields: [workspaceId], references: [id])
  domain      String    @unique
  verified    Boolean   @default(false)
  verifiedAt  DateTime?
  createdAt   DateTime  @default(now())
}

model BlogPost {
  id             String         @id @default(cuid())
  workspaceId    String?        // null = article plateforme (super_admin)
  workspace      Workspace?     @relation(fields: [workspaceId], references: [id], onDelete: Cascade)
  authorId       String
  author         User           @relation(fields: [authorId], references: [id])
  title          String
  slug           String
  excerpt        String?
  content        String         // HTML riche (éditeur WYSIWYG)
  coverImageUrl  String?
  status         BlogPostStatus @default(draft)
  publishedAt    DateTime?
  seoTitle       String?
  seoDescription String?
  tags           String[]
  createdAt      DateTime       @default(now())
  updatedAt      DateTime       @updatedAt
  @@unique([workspaceId, slug])
}

enum PropertyType    { apartment house villa chalet studio loft other }
enum PropertyStatus  { draft active archived }
enum OTASource       { airbnb booking vrbo homeaway manual }
enum SyncStatus      { pending syncing synced error }
enum BlockSource     { airbnb booking vrbo homeaway direct manual }
enum MessageSender   { owner guest }
enum DepositStatus   { none held released captured expired }
enum BlogPostStatus  { draft published archived }
enum DirectBookingStatus {
  pending payment_pending paid cancelled refunded
}
```

---

## 6. Feature modules

### Nouveaux modules (`src/features/`)

#### `properties/`
- CRUD logement (nom, description FR/EN, type, capacité, tarifs, caution)
- Upload photos → Cloudflare R2 (max 20 photos par logement)
- Gestion des amenités (liste prédéfinie + custom)
- Statut draft/active/archived
- Preview du site public

#### `calendars/`
- Ajout/suppression d'URLs iCal par logement (Airbnb, Booking, Vrbo…)
- Job de sync toutes les 15min via Vercel Cron → parse iCal → upsert CalendarBlocks
- Génération de l'URL iCal export (à coller dans les OTA)
- Vue calendrier mensuel (disponibilités + blocages par source)
- Blocage manuel de dates

#### `bookings-public/`
- Widget disponibilités (calendrier public)
- Formulaire réservation : dates, nb voyageurs, options, demandes spéciales
- Récapitulatif prix détaillé
- Checkout Stripe (loyer + caution séparés)
- Email confirmation automatique (propriétaire + vacancier)
- Page "ma réservation" (lien par email, sans compte obligatoire)

#### `messaging/`
- Fil de messages par réservation (propriétaire ↔ vacancier)
- Notification email à chaque nouveau message (Resend)
- Badge messages non lus dans le dashboard propriétaire

#### `documents/`
- Génération PDF bail locatif à la confirmation de paiement
- Template : nom propriétaire, nom vacancier, logement, dates, montants
- Stockage R2, téléchargeable par les 2 parties
- Historique des contrats par réservation

#### `domains/`
- Sous-domaine auto : `{slug}.taplateforme.com`
- Ajout domaine custom + instructions CNAME
- Vérification DNS via Vercel API
- Middleware routing par hostname → inject workspace context

#### `ota-sync/`
- Vercel Cron (toutes les 15min) : sync tous les CalendarFeeds actifs
- Retry avec backoff exponentiel (3 tentatives)
- Alertes email si sync échoue 3x consécutives
- Log : lastSyncAt, syncStatus, nb événements importés

#### `pwa/`
- `manifest.json` dynamique par workspace (nom, couleurs, icône)
- Service Worker : cache offline des données de réservation
- `@ducanh2912/next-pwa`
- Prompt d'installation sur mobile

#### `blog/`
- CRUD articles pour super_admin (articles plateforme) et admin (articles workspace)
- Éditeur rich text (TipTap ou Lexical)
- Gestion des tags, image de couverture (upload R2), statut draft/published
- Champs SEO par article : titre SEO, meta description
- URL : `taplateforme.com/blog/[slug]` (super_admin) et `jean.taplateforme.com/blog/[slug]` (admin)
- Sitemap automatique incluant les articles publiés

#### `seo/`
- `sitemap.xml` dynamique par workspace (logements + articles de blog)
- `robots.txt` par workspace
- Composant `<SeoHead>` : Open Graph, Twitter Card, meta title/description
- JSON-LD structured data sur les pages logement (`LodgingBusiness`, `Accommodation`, `FAQPage`)
- JSON-LD `LocalBusiness` sur la page d'accueil du workspace
- Fil d'Ariane (Breadcrumbs) sur toutes les pages publiques
- GEO : structure de contenu optimisée pour les moteurs IA (headings hiérarchiques, FAQ structurées, résumés explicites)

### Modules existants adaptés

| Module | Adaptation |
|--------|-----------|
| `billing/` | Stripe Connect Express au lieu de Stripe standard |
| `projects/` | Renommé `workspaces/` + slug pour routing multi-tenant |
| `settings/` | Étendu : branding workspace (logo, couleur primaire) |

---

## 7. Flux de paiement Stripe Connect

### Onboarding propriétaire
1. Propriétaire crée son compte → KYC Stripe Express (géré par Stripe)
2. `stripeAccountId` sauvegardé dans `Workspace`

### Réservation vacancier
```
Calcul :
  nuitées × pricePerNight + cleaningFee + options
  platformFee = total × 10%
  ownerAmount = total - platformFee

Payment Intent [1] — Loyer (Stripe Connect)
  amount: totalAmount
  transfer_data.destination: workspace.stripeAccountId
  transfer_data.amount: ownerAmount
  → 90% vire automatiquement au propriétaire

Payment Intent [2] — Caution (séparé)
  amount: property.depositAmount
  capture_method: manual
  → bloqué sur carte, non débité
```

### Gestion caution post-séjour
- Propriétaire : bouton "Gérer la caution" dans dashboard
- Options : restituer tout / retenir montant partiel / retenir tout
- Auto-libération J+7 après checkout via Vercel Cron si aucune action

---

## 8. Internationalisation

- **Langues** : Français (défaut) + Anglais
- **Lib** : `next-intl`
- **Scope** : interface plateforme + site public + emails
- **Devises** : EUR (défaut) + GBP, configurable par workspace
- **Conversion** : prix stockés dans la devise du logement, affichés dans la devise du visiteur via Stripe Currency Conversion

---

## 9. PWA

- Installable par tous les rôles (admin, vacancier)
- Manifest dynamique par workspace (couleurs du propriétaire)
- Cache offline : calendrier, réservations à venir, messages
- iOS Safari supporté (limitations push notifications partielles)

---

## 10. Décomposition en sous-projets

Ce projet est trop large pour un seul plan d'implémentation. Ordre recommandé :

| Phase | Contenu | Priorité |
|-------|---------|----------|
| **A** | Multi-tenant routing + Workspaces | Fondation |
| **B** | Properties CRUD + photos R2 | Core |
| **C** | Calendriers iCal sync + export | Core |
| **D** | Funnel réservation directe + Stripe Connect | Revenue |
| **E** | Caution Stripe + documents PDF | Revenue |
| **F** | Messaging + emails | UX |
| **G** | Domaines custom + Vercel API | Scale |
| **H** | i18n + multi-devises | Scale |
| **I** | PWA + service worker | Polish |
| **J** | Blog (super_admin + admin) + SEO/GEO | Growth |

---

## 11. SEO & GEO Strategy

### SEO (Search Engine Optimization)

**Super admin (taplateforme.com) :**
- Blog pour cibler des requêtes génériques : "channel manager location vacances", "synchroniser Airbnb Booking", "créer site réservation directe"
- Pages de destination par cas d'usage (villas, appartements, chalets)
- Meta tags + Open Graph sur toutes les pages

**Admin (jean.taplateforme.com) :**
- Blog local pour cibler des requêtes de destination : "que faire à Nice en juillet", "activités autour du Mont Blanc"
- Page logement optimisée avec title/description configurables
- FAQ sur chaque logement (réponses aux questions fréquentes → featured snippets)
- Structured data `LodgingBusiness` + `Accommodation` pour Rich Results Google

**Technique :**
- `sitemap.xml` dynamique (pages + logements + articles) soumis à Google Search Console
- `robots.txt` configuré par workspace
- URLs propres et canoniques (pas de duplicates)
- Images optimisées avec `alt` text systématique (Next.js Image)
- Core Web Vitals : LCP < 2.5s, CLS < 0.1 (Next.js SSR + R2 CDN)

### GEO (Generative Engine Optimization)

Optimiser pour ChatGPT, Perplexity, Google SGE, et autres moteurs IA :

- **JSON-LD complet** : `LodgingBusiness`, `Accommodation`, `FAQPage`, `BreadcrumbList`, `LocalBusiness`
- **Structure de contenu** : H1 > H2 > H3 hiérarchique, une idée par paragraphe
- **FAQ structurées** : configurables par propriétaire sur chaque logement (Q&A explicites)
- **Résumés explicites** : premier paragraphe de chaque page résume le contenu (utilisé par les IA pour extraire les réponses)
- **Entités nommées** : ville, région, type de logement, équipements — répétés naturellement dans le contenu
- **llms.txt** : fichier de contexte plateforme lisible par les LLMs (standard émergent)

---

## 12. Hors scope MVP

- API officielles OTA (Airbnb Connect, Booking Connectivity) — après lancement
- Signature électronique du bail — v2
- Avis/reviews vacanciers — v2
- Application mobile native — non nécessaire (PWA suffit)
- Multi-staff par workspace — v2
