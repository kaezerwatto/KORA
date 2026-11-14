# Démonstration KORA — parcours réel Safinum

Le livrable final est
[`../release/KORA_Demo_Pitch_SAFINUM_2026.webm`](../release/KORA_Demo_Pitch_SAFINUM_2026.webm).
Il enregistre un vrai profil Chrome, l’installation de l’extension et les cinq
étapes du parcours normal Safinum. Aucun panneau jury, texte injecté ou écran
simulé n’est utilisé. Chrome applique un rendu sombre réel; le montage ajoute
une musique d’ambiance originale, des fondus, un curseur et des effets de clic
sobres sous la narration ElevenLabs Lucie.

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
5. enregistre le parcours `https://safinum.cm/hackathon-test`;
6. produit le WebM final.

La clé n’est jamais enregistrée dans le dépôt. ElevenLabs reçoit uniquement
le texte public de narration, jamais le contenu d’une page.

## Parcours visible

1. carte KORA dans `chrome://extensions`;
2. solde, compte et transactions;
3. tentative réelle de `300 000 FCFA` et erreur de solde;
4. correction à `25 000 FCFA` et calcul des frais;
5. saisie du bénéficiaire, téléphone, motif et note fictifs;
6. vérification du récapitulatif;
7. confirmation et reçu simulé.

Le script mot à mot et les timecodes sont dans
[`DEMO_SCRIPT.md`](DEMO_SCRIPT.md). La captation automatisée se trouve dans
[`../scripts/record_safinum_demo.mjs`](../scripts/record_safinum_demo.mjs).
