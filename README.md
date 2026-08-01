# 🎴 UNO - P2P Edition

[![Deploy to GitHub Pages](https://github.com/gab371/uno-p2play/actions/workflows/deploy.yml/badge.svg)](https://github.com/gab371/uno-p2play/actions/workflows/deploy.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-red.svg)](https://opensource.org/licenses/MIT)

**UNO P2Play** est un jeu de cartes multijoueur Peer-to-Peer standalone basé sur WebRTC, jouable directement dans votre navigateur sans serveur intermédiaire.

Retrouvez toutes les règles officielles du célèbre jeu UNO ainsi que des règles maison personnalisables (*house rules*) dans une interface moderne, dynamique et fluide.

---

## 🎮 Démo en Ligne

Jouez directement sur votre navigateur sans aucune installation :
👉 **[Jouer à la démo en ligne](https://gab371.github.io/uno-p2play/)**

---

## ✨ Fonctionnalités Clés

- **Connexion P2P via [`p2play-core`](https://github.com/gab371/p2play-core)** (≥ v0.6.6) : PeerJS, lobby partagé, chat, présence, partage de lien de salon.
- **Règles Spéciales & Maison** : Prise en charge du cumul des attaques (+2 sur +2, +4 sur +4), du bouton "UNO !", et d'autres options configurables.
- **Design Moderne & Coloré** : Animations dynamiques de cartes, retours visuels clairs des couleurs choisies (Joker/+4) et effets sonores intégrés.
- **Tchat & Historique en Direct** : Discussion P2P via `p2play-core/chat` pour suivre le déroulement de la partie et échanger avec vos adversaires.
- **Hub P2Play** : Build lib montable dans [hub-p2play](https://github.com/gab371/hub-p2play).

---

## 🛠️ Lancement Local

### Prérequis
- **Node.js** (v20 ou supérieur recommandé)
- **npm**

### Instructions

1. **Cloner le projet** :
   ```bash
   git clone https://github.com/gab371/uno-p2play.git
   cd uno-p2play
   ```
2. **Installer les dépendances** :
   ```bash
   npm install
   ```
3. **Lancer le serveur de développement** :
   ```bash
   npm run dev
   ```
4. **Ouvrir dans le navigateur** :
   Ouvrez `http://localhost:5173/` (ou le port indiqué par Vite).
   *Pour tester à deux sur la même machine, ouvrez un deuxième onglet ou un autre navigateur.*

5. **Compiler pour la production** :
   ```bash
   npm run build
   ```

---

## 🏛️ Architecture du Projet

Le projet suit des principes stricts de séparation des responsabilités pour garantir la testabilité et la maintenabilité :
- **`/src/core`** : Moteur de jeu pur (validation des cartes, effets de pioche, inversion de sens, gestion du bouton UNO) écrit en TypeScript pur, sans aucune dépendance UI ou réseau.
- **Réseau** : [`p2play-core`](https://github.com/gab371/p2play-core) (`usePeer`, `P2PlayLobby`, présence, chat) — pas de `PeerManager` local.
- **`/src/hooks`** : Custom hooks liant l'état de jeu réactif et les événements réseau au cycle de vie de React.
- **`/src/components`** : Composants d'interface (cartes UNO, plateau, sélecteur de couleur, tchat).

Dépendance typique :
```json
"p2play-core": "github:gab371/p2play-core#v0.6.6"
```

---

## 📄 Licence

Ce projet est distribué sous licence MIT.
