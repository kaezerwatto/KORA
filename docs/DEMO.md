# Démonstration KORA — parcours réel Safinum

Le livrable final est
[`../release/KORA_Demo_Pitch_SAFINUM_2026.mp4`](../release/KORA_Demo_Pitch_SAFINUM_2026.mp4).
Il enregistre un vrai profil Chrome, l’installation de l’extension et les cinq
étapes du parcours client Safinum. Le script exécute d’abord le parcours
complet et contrôle ses valeurs, puis monte uniquement les états réellement
capturés sur la narration pour supprimer les temps de chargement.

Quatre slides éditoriales encadrent la démonstration : ouverture KORA ×
SAFINUM, problème/solution/cas d’usage, validation linguistique et conclusion.
Les écrans de démonstration conservent la barre d’adresse Chrome et affichent
la page entière. Le rendu sombre, la musique d’ambiance originale, les
déplacements de souris, les clics et les transitions courtes restent
synchronisés avec la voix.

Le fichier remis dure **2 min 54,429 s**, utilise MP4 H.264/AAC en
1920 × 1080 et respecte la limite de trois minutes. Le formulaire demande
un lien vers la vidéo; la limite de 10 Mo concerne les fichiers importés.

## Reproduire la vidéo

Placer une clé ElevenLabs valide dans la variable locale
`ELEVENLABS_API_KEY`, puis exécuter :

```bash
npm run submission:video
```

La commande :

1. reconstruit et empaquette l’extension;
2. génère la narration française avec la voix Lucie;
3. démarre un profil Chrome propre et active réellement le mode développeur;
4. charge `release/kora-unpacked`;
5. ouvre Safinum en français, utilise la vraie popup pour choisir foufouldé;
6. vérifie et capture les cinq étapes, deux erreurs et le retour au tableau de
   bord;
7. synchronise chaque état sur la narration et produit la version WebM de travail.

La version MP4 remise dans `release/` est celle fournie après ce montage.

La clé n’est jamais enregistrée dans le dépôt. ElevenLabs reçoit uniquement
le texte public de narration, jamais le contenu d’une page.

## Parcours visible

1. slide d’ouverture avec les logos KORA et SAFINUM;
2. problème, réponse KORA et cas d’usage financier;
3. mode développeur réellement activé, chemin `release/kora-unpacked` et
   carte KORA dans `chrome://extensions`;
4. Safinum en français, vraie popup KORA et sélection visible de `Fulfulde`;
5. étape 1/5 : solde, compte, nom et transactions préservés;
6. étape 2/5 : sélection, saisie progressive de `300000`, erreur
   `AMOUNT_002`, correction à `25000` et `500 FCFA` de frais;
7. étape 3/5 : saisie progressive des données fictives, erreur
   `SECURITY_001`, vérification et poursuite;
8. étape 4/5 : récapitulatif et confirmation des valeurs;
9. étape 5/5 : reçu, nouveau transfert, `Retour` et tableau de bord;
10. validation par Jean-Ernest SOUROUMBAI et conclusion KORA × SAFINUM.

Le script mot à mot et les timecodes sont dans
[`DEMO_SCRIPT.md`](DEMO_SCRIPT.md). La captation automatisée se trouve dans
[`../scripts/record_safinum_demo.mjs`](../scripts/record_safinum_demo.mjs).

Empreinte SHA-256 du MP4 remis :
`1f1261a45aec4d6d7400a872d1ba4d5dfe552a4aed6697d431cc8633ef137f11`.
