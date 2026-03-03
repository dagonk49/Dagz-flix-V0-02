# DagzFlix Changelog

## V0,006 — Admin, Télémétrie & UX Premium

### 🔴 Mission 1 : Télémétrie + DagzRank V3
- **POST /api/telemetry/click** — Enregistre les clics utilisateur (fire & forget)
- **POST /api/media/rate** — Notation 1-5 étoiles par utilisateur (upsert)
- **GET /api/media/rating** — Récupère la note utilisateur + moyenne globale
- **handleMediaProgress** — Enrichi avec télémétrie watch (cumul temps regardé)
- **DagzRank V3** — Algorithme réécrut : 7 couches de scoring
  - Genres favoris (30 pts), affinité historique (15 pts), note communautaire (15 pts)
  - Fraîcheur (10 pts), bonus télémétrie personnelle (15 pts), bonus collaboratif (15 pts)
  - Pénalités : déjà vu, rejeté, genres détestés
- **loadTelemetryData()** — Agrège les events watch/rate + notes globales depuis MongoDB

### 🔵 Mission 2 : Contrôle Parental + Sécurité
- **Collection MongoDB `users`** — Rôles (admin/adult/child), maxRating, timestamps
- **getUserProfile()** — Récupère le profil utilisateur depuis `users`
- **applyParentalFilter()** — Filtre les contenus selon le rôle enfant
  - Bloque genres Horror/Erotic/Thriller, contenu adulte, certifications R/NC-17/18+
- **handleAuthLogin** — Upsert user profile à la connexion (rôle admin/adult/child)
- **handleAuthSession** — Expose le rôle dans la réponse session
- Filtrage intégré dans : handleSearch, handleDiscover, handleMediaLibrary, handleRecommendations
- **GET /api/admin/users** — Liste tous les utilisateurs (admin-only)
- **POST /api/admin/users/update** — Modifie le rôle d'un utilisateur (admin-only)

### 🟢 Mission 3 : Panneau Admin
- **app/admin/page.js** — Page d'administration complète
  - Table des utilisateurs avec avatar, nom, ID Jellyfin, dernière connexion
  - Sélecteur de rôle (Administrateur/Adulte/Enfant) avec icônes Crown/User/Baby
  - Sauvegarde individuelle avec bouton Save + loader
  - Toast animé (succès/erreur) avec AnimatePresence
  - Stagger animation sur les lignes du tableau
  - Design dark épuré, responsive, cohérent avec DagzFlix
- **auth-context.js** — Route /admin autorisée dans le guard

### 🟡 Mission 4 : UI/UX Premium + Micro-animations
- **MediaCard** — Télémétrie de clic fire & forget, stagger variants (cardVariants)
  - whileTap scale 0.98, animation d'entrée par index
- **MediaDetailView** — Composant StarRating interactif (5 étoiles)
  - Hover preview, clic pour noter, affiche note perso + moyenne globale
  - Stagger animation sur le casting (PersonCards)
- **api.js** — TTLs cache ajoutés : media/rating (30s), admin/users (15s), telemetry (0)

### Fichiers modifiés
- `app/api/[[...path]]/route.js` — ~2500 lignes (nouvelles fonctions + intégrations)
- `components/dagzflix/MediaCard.jsx` — Télémétrie + stagger
- `components/dagzflix/MediaDetailView.jsx` — StarRating + stagger casting
- `app/admin/page.js` — NOUVEAU
- `lib/auth-context.js` — Route admin
- `lib/api.js` — Cache TTLs

---

## Feb 27, 2026 - Major Refactor + Feature Completion

### Completed
- **Codebase Refactoring**: Split monolithic `page.js` (726 lines) into 16 modular files:
  - `lib/api.js` - Cache system + API helpers
  - `lib/constants.js` - Genres, moods, eras, durations
  - 14 component files in `components/dagzflix/`
  - Slim orchestrator `page.js` (~100 lines)

- **Bug Fixes**:
  - Fixed DB_NAME in `.env` (was `your_database_name`, now `dagzflix`)
  - Fixed French character rendering (Unicode escapes → UTF-8)
  - Fixed saga/collection state persistence between navigations (proper state reset)
  - Fixed back button (now uses navigation history stack instead of always returning to dashboard)

- **New Features**:
  - "Continue Watching" row on dashboard (`/api/media/resume` endpoint)
  - Navigation history tracking for smart back button
  - Added `data-testid` attributes to all interactive elements

- **Backend**:
  - Added `/api/media/resume` endpoint for Jellyfin resume items
  - Streaming uses Direct Play URLs (no proxy, no timeout)
  - All 14 backend tests passing

- **Frontend**:
  - Login flow, UI rendering, French text, glassmorphism all verified
  - Responsive design tested on desktop/tablet/mobile

### Previous Work (before refactor)
- Initial MVP with setup wizard, login, dashboard
- All backend API endpoints for Jellyfin/Jellyseerr proxy
- DagzRank recommendation algorithm
- Le Magicien (Wizard) discovery feature
- Smart Button for Play/Request/Pending
- Video Player with Direct Play
- Collection/Saga display
- Client-side caching
