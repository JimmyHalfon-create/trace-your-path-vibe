# TRACE - Dossier de Présentation

## 📍 Concept

**TRACE** est une application mobile innovante qui permet aux utilisateurs de laisser des messages géolocalisés anonymes partout dans le monde. Chaque "trace" est une empreinte digitale éphémère laissée à un endroit précis, accessible uniquement par les personnes physiquement présentes à proximité.

---

## 🎯 Vision

Transformer le monde en une toile narrative interactive où chaque lieu raconte une histoire, où les pensées et les émotions sont ancrées dans des coordonnées géographiques, créant ainsi une cartographie émotionnelle et collective de notre planète.

---

## ✨ Fonctionnalités Principales

### 1. **Création de Traces Anonymes**
- **Messages texte** : jusqu'à 280 caractères
- **Messages vocaux** : enregistrements audio de 8 secondes maximum
- **Géolocalisation automatique** : chaque trace est ancrée à l'endroit exact de création
- **Anonymat total** : aucune identification de l'auteur n'est stockée

### 2. **Visualisation Globale**
- **Globe 3D interactif** : navigation fluide sur une carte du monde en 3D
- **Markers géolocalisés** : visualisation de toutes les traces mondiales
- **Interface intuitive** : zoom, rotation, déplacement libre

### 3. **Découverte de Proximité**
- **Détection automatique** : notifications quand vous approchez d'une trace
- **Rayon de 50 mètres** : accès aux traces uniquement à proximité
- **Compteur en temps réel** : nombre de traces accessibles autour de vous

### 4. **Lecture Multimédia**
- **Lecture audio native** : playback optimisé pour mobile
- **Player intégré** : contrôles play/pause directement sur la carte
- **Support multi-format** : WebM, MP4, audio WAV

---

## 🛡️ Sécurité & Confidentialité

### Anonymat Garanti
- Aucun compte utilisateur requis
- Aucune donnée personnelle collectée
- Impossible de tracer l'auteur d'une trace
- Aucun historique de création conservé

### Protection des Données
- **RLS (Row Level Security)** : politiques de sécurité strictes au niveau base de données
- **Traces immuables** : impossible de modifier une trace après création
- **Modération admin uniquement** : seuls les administrateurs peuvent supprimer des contenus inappropriés
- **Stockage sécurisé** : fichiers audio protégés et isolés

---

## 🏗️ Architecture Technique

### Frontend
- **React 18** avec TypeScript
- **Vite** pour un build ultra-rapide
- **Tailwind CSS** pour un design responsive
- **Mapbox GL** pour la visualisation 3D du globe
- **Three.js / React Three Fiber** pour les effets 3D

### Backend
- **Supabase** (PostgreSQL + Auth + Storage)
- **Edge Functions** serverless
- **Real-time subscriptions** pour les mises à jour live
- **Storage buckets** pour les fichiers audio

### Mobile
- **Capacitor** pour le build natif iOS/Android
- **Plugin Native Media Player** pour la lecture audio
- **Geolocation API** pour le positionnement précis
- **Local Notifications** pour les alertes de proximité

---

## 📱 Expérience Utilisateur

### Workflow Simplifié

1. **Ouverture de l'app** → Géolocalisation automatique
2. **Visualisation du globe** → Découverte des traces mondiales
3. **Bouton "+" flottant** → Création d'une nouvelle trace
4. **Choix du format** → Texte ou Voix
5. **Publication instantanée** → La trace apparaît sur le globe
6. **Notifications de proximité** → Alertes quand vous approchez d'une trace

### Interface Épurée
- Design minimaliste et moderne
- Couleurs douces et apaisantes
- Navigation intuitive
- Feedback visuel immédiat
- Animations fluides

---

## 🌍 Cas d'Usage

### Personnel
- Laisser un message à un endroit qui vous est cher
- Immortaliser un souvenir de voyage
- Partager une émotion avec des inconnus futurs

### Artistique
- Créer des installations narratives géolocalisées
- Œuvres d'art participatives et éphémères
- Performance sonore dans l'espace urbain

### Communautaire
- Messages d'espoir dans des lieux symboliques
- Capsules temporelles collectives
- Témoignages historiques géolocalisés

### Touristique
- Découverte de récits locaux
- Guides audio participatifs
- Partage d'expériences authentiques

---

## 📊 Données & Statistiques

### Métriques Clés (à venir)
- Nombre total de traces créées
- Nombre de traces par pays/ville
- Taux de découverte de proximité
- Ratio traces vocales vs texte
- Carte de chaleur des zones actives

---

## 🚀 Roadmap

### Phase 1 - MVP ✅
- [x] Création de traces texte et vocales
- [x] Visualisation sur globe 3D
- [x] Détection de proximité
- [x] Notifications mobiles
- [x] Sécurité et anonymat

### Phase 2 - Enrichissement 🔄
- [ ] Filtres de découverte (par date, type)
- [ ] Historique des traces découvertes (local uniquement)
- [ ] Partage de position de trace
- [ ] Thèmes visuels personnalisables
- [ ] Support multilingue

### Phase 3 - Communauté 🔮
- [ ] Système de "likes" anonymes
- [ ] Traces éphémères (auto-destruction après X jours)
- [ ] Collections thématiques
- [ ] API publique pour développeurs
- [ ] Version web progressive (PWA)

---

## 🎨 Identité Visuelle

### Palette de Couleurs
- **Primaire** : Ambre chaleureux (#fbbf24)
- **Secondaire** : Tons neutres et apaisants
- **Accents** : Dégradés subtils
- **Mode sombre** : Support natif

### Typographie
- Police moderne et lisible
- Hiérarchie claire
- Accessibilité WCAG AA

### Icône
- Cercle avec croix géographique
- Symbolise un point sur une carte
- Couleur ambre distinctive

---

## 📄 Mentions Légales & Conformité

### RGPD
- Aucune donnée personnelle collectée
- Pas de cookies de tracking
- Géolocalisation volontaire et temporaire
- Droit à l'oubli (suppression admin si nécessaire)

### CGU
- Contenu inapproprié interdit
- Modération par équipe admin
- Responsabilité des utilisateurs

### Open Source
- Code disponible sous licence MIT (à définir)
- Contributions communautaires bienvenues

---

## 👥 Équipe & Contact

### Développement
- Architecture & développement fullstack
- Design UI/UX
- Sécurité & infrastructure

### Contact
- Email : [contact@trace-app.com]
- GitHub : [repository link]
- Discord : [community link]

---

## 💡 Pourquoi TRACE ?

Dans un monde hyper-connecté mais paradoxalement déconnecté du territoire, **TRACE** propose une expérience unique : celle de lier le digital au physique, l'éphémère au permanent, l'anonymat à l'authenticité.

Chaque trace est une bouteille à la mer moderne, un graffiti numérique respectueux, une preuve de passage qui ne laisse aucune empreinte carbone mais une empreinte émotionnelle.

**TRACE** n'est pas un réseau social. C'est une carte du monde des émotions humaines.

---

*Version 1.0 - Octobre 2025*
