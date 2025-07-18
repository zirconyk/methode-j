# 📚 Méthode J - Révision Espacée

> Application Android de révision espacée intelligente pour étudiants en pharmacie et sciences de la santé

[![Build APK](https://github.com/VOTRE_USERNAME/methode-j/actions/workflows/build-apk.yml/badge.svg)](https://github.com/VOTRE_USERNAME/methode-j/actions/workflows/build-apk.yml)

## 🎯 Description

**Méthode J** est une application mobile qui implémente la technique de révision espacée avec un algorithme adaptatif basé sur vos performances. Plus votre note est élevée, plus l'intervalle entre les révisions s'allonge, optimisant ainsi votre temps d'étude.

## ✨ Fonctionnalités

### 🧠 **Algorithme intelligent**
- **Coefficients exponentiels** basés sur vos notes (0.2x à 2.5x)
- **Intervalles adaptatifs** : 1, 7, 14, 30, 90, 180, 365 jours
- **Seuil éliminatoire** configurable (défaut : 9/20 pour pharmacie)
- **Pondération historique** : 70% note actuelle + 30% moyenne des 3 dernières

### 📚 **Gestion des UE**
- **30 couleurs** pour différencier vos matières
- **Paramètres personnalisables** par UE (CC, période pré-examen)
- **Dates d'examen** avec planning de révision automatique
- **Types de cours** : cours individuels et synthèses d'annales

### 🎮 **Gamification**
- **Système de points** selon vos performances
- **9 badges différents** (streak, excellence, persévérance)
- **Niveaux** basés sur vos points accumulés
- **Streak** de jours consécutifs de révision

### 📱 **Interface moderne**
- **Thème sombre** professionnel et stylé
- **Dashboard** avec progression quotidienne
- **Calendrier mensuel** avec visualisation des révisions
- **Animations** fluides et motivantes

### 🔔 **Notifications intelligentes**
- **Rappels quotidiens** à 7h30 (configurable)
- **Notifications pré-examen** automatiques
- **Alertes de badges** et achievements

### 📊 **Statistiques avancées**
- **Graphiques de progression** avec courbes d'évolution
- **Distribution des notes** avec histogrammes
- **Statistiques par période** (semaine, mois, semestre)
- **Export des données** (JSON/CSV)

## 📲 Installation

### Téléchargement direct
1. Rendez-vous dans la section [**Releases**](https://github.com/VOTRE_USERNAME/methode-j/releases)
2. Téléchargez le fichier `methode-j-release.apk`
3. Activez "Sources inconnues" dans les paramètres Android
4. Installez l'APK et profitez ! 🚀

### Build automatique
L'APK est automatiquement généré à chaque commit via GitHub Actions.

## 🛠️ Technologies

- **React Native 0.71.8** - Framework mobile cross-platform
- **SQLite** - Base de données locale
- **React Navigation** - Navigation native
- **React Native Calendars** - Composant calendrier
- **React Native Chart Kit** - Graphiques interactifs
- **React Native Push Notification** - Notifications locales

## 🎓 Cas d'usage

### Pour les étudiants en pharmacie
- **Gestion des UE** avec CC et examens terminaux
- **Période pré-examen** configurable (1-3 semaines)
- **Seuil éliminatoire** adapté (9/20 à Lyon)
- **Synthèses d'annales** intégrées

### Pour tous les étudiants
- **Révision espacée** scientifiquement prouvée
- **Optimisation du temps** d'étude
- **Suivi de progression** motivant
- **Export des données** pour analyse

## 📈 Algorithme de révision

```
Coefficient = f(note, seuil_éliminatoire, seuil_base)

Si note ≤ 9/20  : coefficient = 0.2 - 0.4 (révision intensive)
Si note = 12/20 : coefficient = 1.0 (intervalle de base)
Si note ≥ 16/20 : coefficient = 1.5 - 2.5 (révision espacée)

Prochaine_révision = Intervalle_base × Coefficient
```

## 🤝 Contribution

Les contributions sont les bienvenues ! N'hésitez pas à :
- Signaler des bugs via les [Issues](https://github.com/VOTRE_USERNAME/methode-j/issues)
- Proposer des améliorations
- Soumettre des Pull Requests

## 📄 Licence

Ce projet est sous licence ISC - voir le fichier [LICENSE](LICENSE) pour plus de détails.

## 👨‍💻 Auteur

Développé avec ❤️ pour optimiser l'apprentissage des étudiants en sciences de la santé.

---

**⭐ N'oubliez pas de mettre une étoile si ce projet vous aide dans vos études !**