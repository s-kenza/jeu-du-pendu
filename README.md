# Hangman Game - React Multiplayer

![Game Logo](back/assets/logo.png)

## 📋 Présentation du projet

Ce projet est un jeu du Pendu multijoueur développé avec React et Socket.IO. Il s'agit d'une application fullstack permettant aux joueurs de s'affronter en temps réel dans des parties de pendu.

## 🎮 Fonctionnalités

### Système d'authentification complet
- Inscription avec vérification d'email
- Connexion sécurisée avec JWT
- Système de vérification d'email par token

### Expérience de jeu
- Mode multijoueur en temps réel
- Création et rejoindre des salles de jeu
- Chat entre joueurs
- Système de points et classement
- Animation et effets visuels lors des victoires

### Interface utilisateur
- Design moderne avec Tailwind CSS et DaisyUI
- Animations avancées avec Framer Motion
- Mode clair/sombre
- Composants interactifs avec effets visuels

## 🛠️ Technologies utilisées

### Frontend
- **React** avec **TypeScript**
- **Tailwind CSS** et **DaisyUI** pour le design
- **Framer Motion** pour les animations
- **Socket.IO Client** pour la communication en temps réel
- **Formik** et **Yup** pour la gestion des formulaires
- **React Router DOM** pour la navigation
- **Canvas Confetti** pour les effets de célébration

### Backend
- **Fastify** pour l'API REST
- **Sequelize** avec MySQL pour la base de données
- **Socket.IO** pour la communication en temps réel
- **JWT** pour l'authentification
- **Bcrypt** pour le hashage des mots de passe
- **Nodemailer** et **MJML** pour les emails
- **Swagger** pour la documentation de l'API

### Infrastructure
- **Docker** pour la conteneurisation
- **MySQL** pour la base de données
- **Mailcatcher** pour le développement des emails

## 🚀 Installation

### Prérequis
- Node.js 18+ 
- Docker et Docker Compose
- Git

### Étapes d'installation

1. **Cloner le dépôt**
   ```bash
   git clone https://github.com/s-kenza/game-react.git
   cd game-react
   ```

2. **Configuration de l'environnement**
   
   Créez un fichier `.env` dans le dossier `back` avec les informations suivantes :
   ```
   APP_FRONT_URL=http://localhost:5173
   DB_HOST=localhost
   DB_USER=kenza
   DB_PASSWORD=kenza
   DB_NAME=game_react
   MAIL_TOKEN=votre_token_email
   ```

   Créez un fichier `.env` dans le dossier `front` avec :
   ```
   VITE_BACKEND_URL=http://localhost:3000
   ```

3. **Démarrer les services Docker**
   ```bash
   cd back
   docker-compose up -d
   ```

4. **Installer les dépendances du backend**
   ```bash
   cd back
   npm install
   ```

5. **Installer les dépendances du frontend**
   ```bash
   cd front
   npm install
   ```

6. **Lancer le backend**
   ```bash
   cd back
   npm run dev
   ```

7. **Lancer le frontend**
   ```bash
   cd front
   npm run dev
   ```

8. **Accéder à l'application**
   - Frontend: [http://localhost:5173](http://localhost:5173)
   - Backend API: [http://localhost:3000](http://localhost:3000)
   - Documentation API: [http://localhost:3000/documentation](http://localhost:3000/documentation)
   - PHPMyAdmin: [http://localhost:8080](http://localhost:8080)
   - Mailcatcher: [http://localhost:1080](http://localhost:1080)

## 👥 Comment jouer

### Création de compte
1. Accédez à l'application et inscrivez-vous en remplissant le formulaire
2. Vérifiez votre boîte mail pour confirmer votre compte (ou consultez Mailcatcher)
3. Connectez-vous avec vos identifiants

### Jouer en multijoueur
1. Une fois connecté, accédez au tableau de jeu
2. Vous pouvez créer une nouvelle partie ou rejoindre une partie existante
3. Une fois dans une partie, attendez qu'un autre joueur vous rejoigne
4. Devinez les lettres du mot à tour de rôle
5. Le premier joueur à deviner le mot ou le dernier joueur à ne pas avoir fait trop d'erreurs gagne

## 📱 Captures d'écran

*(Les captures d'écran seraient à ajouter ici)*

## 🔗 Architecture du projet

### Structure des dossiers

```
├── back/                   # Backend de l'application
│   ├── src/                # Code source
│   │   ├── assets/         # Ressources (SQL, images)
│   │   ├── controllers/    # Contrôleurs de l'API
│   │   ├── models/         # Modèles de données
│   │   ├── routes/         # Routes de l'API
│   │   ├── templates/      # Templates d'emails
│   │   ├── bdd.js          # Configuration de la base de données
│   │   ├── seed.js         # Données initiales
│   │   └── server.js       # Point d'entrée du serveur
│   └── docker-compose.yml  # Configuration Docker
├── front/                  # Frontend de l'application
│   ├── public/             # Ressources publiques
│   └── src/                # Code source
│       ├── assets/         # Images et ressources
│       ├── components/     # Composants React
│       │   ├── auth/       # Composants d'authentification
│       │   ├── context/    # Contextes React (Auth, Socket)
│       │   ├── game/       # Composants du jeu
│       │   ├── magicui/    # Composants d'UI animés
│       │   └── ui/         # Composants d'UI basiques
│       └── lib/            # Utilitaires
```

## 📝 Documentation API

Une documentation complète de l'API est disponible à l'adresse [http://localhost:3000/documentation](http://localhost:3000/documentation) une fois le serveur démarré.

## 🤝 Contributeurs

- [s-kenza](https://github.com/s-kenza) - Développeur principal

## 📄 Licence

Ce projet est sous licence MIT.

---

Développé avec ❤️ par Kenza SCHULER
