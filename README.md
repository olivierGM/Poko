# PokoQC

Application web de planning poker pour vos séances de raffinement. Plusieurs participants peuvent rejoindre une session via une URL, estimer avec des cartes (Fibonacci, 20/40/100, sablier, pause), et l’hôte révèle les cartes pour tout le monde.

## Fonctionnalités

- Pas de connexion : le nom est stocké dans le navigateur (localStorage).
- Créer une session et partager l’URL ou l’ID pour que d’autres rejoignent.
- Interface type table de poker avec les participants autour.
- Cartes en bas : Fibonacci (1, 2, 3, 5, 8, 13, 21), 20, 40, 100, sablier (⏳), pause (☕).
- Cartes cachées jusqu’à ce que l’hôte clique sur « Révéler les cartes ».

## Développement local

1. Cloner le dépôt et installer les dépendances :

   ```bash
   npm install
   ```

2. Configurer Firebase : copier `.env.example` vers `.env` et renseigner les variables avec les valeurs de votre projet Firebase (Firestore + Hosting).

3. Démarrer l’app en mode dev :

   ```bash
   npm run dev
   ```

4. Ouvrir l’URL affichée (souvent `http://localhost:5173`).

## Déploiement (Firebase Hosting)

1. Créer un projet sur [Firebase Console](https://console.firebase.google.com/) et activer Firestore.
2. Renseigner `.env` avec les identifiants du projet.
3. Mettre à jour `.firebaserc` avec l’ID du projet : `"default": "votre-project-id"`.
4. Déployer les règles Firestore et le site :

   ```bash
   npm run build
   firebase deploy
   ```

L’app sera disponible sur l’URL de hosting Firebase (ex. `https://votre-project.web.app`).

## Stack

- React 19 + TypeScript
- Vite
- Firebase (Firestore, Hosting)
- React Router

## Licence

Projet personnel / éducatif.
