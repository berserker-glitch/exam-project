# Plateforme d'Examen

Une plateforme d'examen complète basée sur le web, construite avec Node.js, MySQL et des technologies web modernes. Cette plateforme permet aux instructeurs de créer, gérer et partager des examens tandis que les étudiants peuvent passer des examens en toute sécurité et suivre leur progression.

## Fonctionnalités

### Système Utilisateur
- Inscription et authentification des utilisateurs
- Authentification sécurisée basée sur JWT
- Validation de la complexité des mots de passe
- Processus de vérification simplifié
- Gestion des profils utilisateurs

### Gestion des Examens
- Création d'examens personnalisés avec plusieurs types de questions
- Prise en charge des questions à choix multiples (QCM)
- Prise en charge des questions à réponse directe
- Gestion de la banque de questions
- Partage d'examens via des liens d'accès uniques
- Navigation en temps réel entre les questions
- Suivi des réponses et indicateurs de progression

### Expérience Étudiant
- Interface intuitive pour passer les examens
- Navigation interactive entre les questions
- Sauvegarde des réponses en temps réel
- Soumission automatique des examens
- Rapports de scores détaillés
- Historique des examens et suivi des performances

### Tableau de Bord et Analyses
- Tableau de bord utilisateur avec statistiques d'examen
- Suivi et analyse des performances
- Scores d'examen détaillés avec catégorisation
- Tendances historiques des performances

### Sécurité et Vérification
- **Géolocalisation pour les examens**: Vérification de la position géographique avant de passer un examen
- Contrôle d'accès basé sur la localisation
- Journalisation des données de localisation pour la sécurité

## Prérequis
Avant de commencer, assurez-vous d'avoir installé:
- Node.js (v14.0 ou supérieur)
- MySQL (v8.0 ou supérieur)
- npm (v6.0 ou supérieur)

## Structure du Projet
```
exam_platform/
├── backend/
│   ├── config/
│   │   ├── db.js          # Configuration de connexion à la base de données
│   │   └── config.js      # Paramètres de configuration généraux
│   ├── controllers/
│   │   ├── auth.js        # Contrôleur d'authentification
│   │   └── exams.js       # Contrôleur de gestion des examens
│   ├── middleware/
│   │   └── auth.js        # Middleware d'authentification
│   ├── routes/
│   │   ├── auth.js        # Routes d'authentification
│   │   └── exams.js       # Routes de gestion des examens
│   └── server.js          # Fichier principal du serveur
├── frontend/
│   ├── public/
│   │   ├── css/
│   │   │   └── style.css  # Feuille de style principale
│   │   ├── js/
│   │   │   ├── main.js              # Fonctionnalités principales & authentification
│   │   │   ├── create_exam.js       # Fonctionnalité de création d'examen
│   │   │   ├── take_exam.js         # Fonctionnalité de passage d'examen
│   │   │   ├── geolocation.js       # Gestion de la géolocalisation pour les examens
│   │   │   └── exams.js             # Gestion et liste des examens
│   │   └── images/                  # Ressources d'images
│   └── views/
│       ├── index.html              # Page d'accueil
│       ├── login.html              # Page de connexion
│       ├── signup.html             # Page d'inscription
│       ├── dashboard.html          # Tableau de bord utilisateur
│       ├── create_exam.html        # Page de création d'examen
│       ├── take_exam.html          # Page de passage d'examen
│       └── exams.html              # Page de liste des examens
├── database.sql                    # Schéma et configuration de la base de données
├── package.json                    # Dépendances du projet
└── README.md                       # Documentation du projet
```

## Composants Clés

### Backend
- **Système d'Authentification**: Authentification basée sur JWT avec hachage de mot de passe
- **Gestion des Examens**: Fonctionnalités de création, lecture, mise à jour et suppression d'examens
- **Traitement des Questions**: Gestion de divers types de questions et notation
- **Points d'API**: API RESTful pour toutes les fonctionnalités de la plateforme
- **Validation de Géolocalisation**: Vérification de la localisation de l'utilisateur pendant les examens

### Frontend
- **Interface Utilisateur Moderne**: Interface propre et responsive construite avec CSS3 et HTML5
- **Composants Interactifs**: Navigation dynamique entre les questions, sauvegarde des réponses en temps réel
- **Validation Côté Client**: Validation des formulaires et vérification de l'intégrité des données
- **Stockage Local**: Stockage temporaire des données d'examen pour la capacité hors ligne
- **Gestion de la Géolocalisation**: Interface pour activer et autoriser la géolocalisation

## Fonctionnalité de Géolocalisation
La plateforme utilise la géolocalisation pour:
- Vérifier l'emplacement des étudiants avant de passer un examen
- Assurer l'intégrité académique en vérifiant la présence physique
- Suivre les tentatives d'examen pour la sécurité

### Comment ça fonctionne
1. Lorsqu'un étudiant commence un examen, il doit autoriser l'accès à sa localisation
2. Le navigateur demande la permission d'accéder à la géolocalisation
3. Une fois autorisé, l'examen peut commencer
4. Les données de localisation sont enregistrées pour référence future
5. La géolocalisation est requise pour chaque session d'examen

## Dépendances
Le projet utilise les dépendances principales suivantes:
- express: Framework d'application web
- mysql2: Client MySQL pour Node.js
- bcrypt: Bibliothèque de hachage de mot de passe
- jsonwebtoken: Implémentation JWT
- dotenv: Gestion des variables d'environnement

