# Poko

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

Aucun projet Firebase n’est créé par le code : crée-le toi-même dans la [Firebase Console](https://console.firebase.google.com/) (tu peux le nommer « Poko »).

1. Créer un projet sur Firebase Console, puis **Firestore Database > Créer une base de données** (mode Natif) si ce n’est pas déjà fait.
2. Renseigner `.env` avec les identifiants du projet.
3. Mettre à jour `.firebaserc` avec l’ID du projet : `"default": "votre-project-id"`.
4. Déployer les règles Firestore et le site :

   ```bash
   npm run build
   firebase deploy
   ```

L’app sera disponible sur l’URL de hosting Firebase (ex. `https://votre-project.web.app`).

## Héberger le code sur GitHub

1. Crée un nouveau dépôt sur [GitHub](https://github.com/new) (ex. `poko` ou `planning-poker`). Ne coche pas « Initialize with README » si le projet a déjà un commit local.

2. Dans le dossier du projet, ajoute le remote et pousse le code :

   ```bash
   git remote add origin https://github.com/olivierGM/Poko.git
   git branch -M main
   git push -u origin main
   ```

   Si le dépôt est ailleurs, remplace l’URL par la tienne.

## Stack

- React 19 + TypeScript
- Vite
- Firebase (Firestore, Hosting)
- React Router

## Licence

Projet personnel / éducatif.
