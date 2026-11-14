# Démonstration KORA — parcours réel Safinum

Le livrable final est
[`../release/KORA_Demo_Pitch_SAFINUM_2026.webm`](../release/KORA_Demo_Pitch_SAFINUM_2026.webm).
Il enregistre un vrai profil Chrome, l’installation de l’extension et les cinq
étapes du parcours normal Safinum. Aucun panneau jury, texte injecté ou écran
simulé n’est utilisé. Le script exécute d’abord le parcours complet et contrôle
ses valeurs, puis monte les états réellement capturés sur la narration pour
supprimer les temps de chargement. Chrome applique un rendu sombre réel; le
montage ajoute une musique d’ambiance originale audible, un curseur fluide,
des clics brefs et des transitions de 360 ms inspirées du pack Slick
Slideshow. Aucun bandeau ne masque l’interface.

Le fichier final dure **2 min 20 s**, mesure **6,93 Mio**, utilise WebM
VP9/Opus en 1280×720 et reste sous la limite de 10 Mo.

## Reproduire la vidéo

Placer une clé ElevenLabs valide dans la variable locale
`ELEVENLABS_API_KEY`, puis exécuter :

```bash
npm run submission:video
```

La commande :

1. reconstruit et empaquette l’extension;
2. génère la narration française avec la voix Lucie;
3. démarre un profil Chrome propre;
4. charge réellement `release/kora-unpacked`;
5. vérifie et capture le parcours `https://safinum.cm/hackathon-test`;
6. synchronise chaque état sur la narration et produit le WebM final.

La clé n’est jamais enregistrée dans le dépôt. ElevenLabs reçoit uniquement
le texte public de narration, jamais le contenu d’une page.

## Parcours visible

1. chemin `release/kora-unpacked` et vraie carte KORA dans
   `chrome://extensions`;
2. vraie popup KORA avec état, langues et interrupteur;
3. solde, compte et transactions sur la page Safinum entière;
4. type « autre banque », `300 000 FCFA`, frais et erreur `AMOUNT_002`;
5. correction à `25 000 FCFA` avec `500 FCFA` de frais;
6. bénéficiaire, téléphone, motif et note fictifs laissés intacts;
7. récapitulatif, confirmation et reçu simulé avec référence `SAF-2026-*`;
8. retour visible au tableau de bord;
9. générique KORA–SAFINUM avec l’équipe et Jean-Ernest SOUROUMBAI.

Le script mot à mot et les timecodes sont dans
[`DEMO_SCRIPT.md`](DEMO_SCRIPT.md). La captation automatisée se trouve dans
[`../scripts/record_safinum_demo.mjs`](../scripts/record_safinum_demo.mjs).

Empreinte SHA-256 :
`185cd19d0094324b24363e17c0cad9b09065ff7ca32338e3d9f1d341c9c9aaa3`.
