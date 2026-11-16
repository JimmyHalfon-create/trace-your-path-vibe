# Feuille de route

## Sécurité — demande actuelle
- [x] Refuser le dépôt texte si l’analyse IA est absente, en panne ou invalide ; tests de refus réussis et create-trace déployé. Dépôt réel avec IA non vérifié.
- [x] Corriger les dépendances embarquées : aucune vulnérabilité connue sur 55 dépendances de production ; verrouillages Bun et npm synchronisés.
- [ ] Traiter 11 alertes des outils de préparation (10 modérées, 1 élevée) — migration de l’outil Vite et compatibilité à vérifier avant changement majeur.
- [x] Réserver les lectures atomiquement ; seuils 60/61 et 300/301 vérifiés en base avec annulation des données de test, erreurs bloquantes testées, lecture réelle 200 et distance dépassée 403 après déploiement.
- [x] Réduire les droits inutiles sans supprimer les accès nécessaires à la carte et à l’administration ; 13 avertissements avant, 10 après, dont 9 accès/protections intentionnels vérifiés.
- [x] Harmoniser Confidentialité et Support en français et en anglais ; pages vérifiées sur ordinateur et téléphone, 8 tests réussis et refus des lectures publiques directes confirmé.
- [ ] Protection contre les mots de passe compromis — blocage confirmé : nécessite Supabase Pro ; pas d’achat demandé.

## Administration — demandes actuelles
- [x] Suspendre dès le premier signalement et permettre le rétablissement après examen ; signalements existants suspendus aussi.
- [x] Ajouter une vue carte avec sélection des traces et état de suspension.
- [x] Tests de règles et vérification visuelle isolée ordinateur/téléphone, accès public protégé.
- [ ] Vérifier le parcours complet avec un administrateur connecté — blocage : session de test indisponible sur le Supabase externe.

## Android — lancement
- [ ] Compte développeur Google Play : app créée le 16/11 (nom TraceOn, package `com.jimmy.traceyourpath`, française, gratuite) ; reste la confirmation d'identité demandée par la console et la validation du numéro de téléphone — **blocage : attend Google / utilisateur**
- [ ] Terminer la configuration exigée avant tout test fermé : fiche Play Store (nom, descriptions, icône 512, visuel 1024×500, 2 captures), politique de confidentialité https://trace-on.app/privacy, public 18+, classification, sécurité des données — contenu prêt dans `/mnt/documents/Play-Store-TraceOn-a-remplir.md`
- [ ] Passer `compileSdkVersion` et `targetSdkVersion` de 35 à 36 dans `android/variables.gradle` (exigence Google depuis le 31/08/2026) et vérifier l'app
- [ ] Préparer la build signée (keystore + signature dans `android/app/build.gradle`, AAB de release)
- [ ] Programme de test fermé : 12 testeurs minimum, inscrits 14 jours d'affilée — **blocage : attend la liste d'e-mails de l'utilisateur**
- [ ] Après les 14 jours : demander la publication

## iOS — en attente
- [x] Build 11 approuvée pour l’App Store, non publiée ; build 13 disponible pour les testeurs externes.
- [ ] Préparer une nouvelle build TestFlight avec les correctifs des dépendances natives — blocage : compilation et envoi sur le Mac de l’utilisateur.
