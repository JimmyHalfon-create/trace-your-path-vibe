# Feuille de route

## Sécurité — demande actuelle
- [x] Réduire les droits inutiles sans supprimer les accès nécessaires à la carte et à l’administration ; 13 avertissements avant, 10 après, dont 9 accès/protections intentionnels vérifiés.
- [x] Harmoniser Confidentialité et Support en français et en anglais ; pages vérifiées sur ordinateur et téléphone, 8 tests réussis et refus des lectures publiques directes confirmé.
- [ ] Protection contre les mots de passe compromis — blocage : réglage hébergé du Supabase externe à activer par son propriétaire, aucun outil disponible pour le modifier ici.

## Administration — demandes actuelles
- [x] Suspendre dès le premier signalement et permettre le rétablissement après examen ; signalements existants suspendus aussi.
- [x] Ajouter une vue carte avec sélection des traces et état de suspension.
- [x] Tests de règles et vérification visuelle isolée ordinateur/téléphone, accès public protégé.
- [ ] Vérifier le parcours complet avec un administrateur connecté — blocage : session de test indisponible sur le Supabase externe.

## Android — lancement
- [ ] Compte développeur Google Play : identité envoyée (vérification en cours, plusieurs jours) ; reste à valider : accès à un appareil Android (vrai téléphone + app Play Console) puis numéro de téléphone — **blocage : attend Google / utilisateur**
- [ ] Préparer la build signée (keystore + signature dans `android/app/build.gradle`, AAB de release)
- [ ] Créer l'app dans la Play Console (nom, description, URL confidentialité https://trace-on.app/privacy, captures)
- [ ] Programme de test fermé : 12 testeurs minimum, inscrits 14 jours d'affilée — **blocage : attend la liste d'e-mails de l'utilisateur**
- [ ] Après les 14 jours : demander la publication

## iOS — en attente
- [ ] Réponse d'Apple sur la soumission 1.0 (build 9, correction crash iPadOS 27) — **blocage : attend Apple**
