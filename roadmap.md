# Feuille de route

## Administration — demandes actuelles
- [ ] Suspendre dès le premier signalement et permettre le rétablissement après examen.
- [ ] Ajouter une vue carte avec sélection des traces et état de suspension.
- [ ] Vérifier les règles et les écrans ; accès connecté non vérifiable sur le Supabase externe.

## Android — lancement
- [ ] Compte développeur Google Play : identité envoyée (vérification en cours, plusieurs jours) ; reste à valider : accès à un appareil Android (vrai téléphone + app Play Console) puis numéro de téléphone — **blocage : attend Google / utilisateur**
- [ ] Préparer la build signée (keystore + signature dans `android/app/build.gradle`, AAB de release)
- [ ] Créer l'app dans la Play Console (nom, description, URL confidentialité https://trace-on.app/privacy, captures)
- [ ] Programme de test fermé : 12 testeurs minimum, inscrits 14 jours d'affilée — **blocage : attend la liste d'e-mails de l'utilisateur**
- [ ] Après les 14 jours : demander la publication

## iOS — en attente
- [ ] Réponse d'Apple sur la soumission 1.0 (build 9, correction crash iPadOS 27) — **blocage : attend Apple**
