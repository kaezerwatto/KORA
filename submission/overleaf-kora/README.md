# Dossier technique KORA — package Overleaf

Ce dossier contient le source LaTeX complet du livrable SAFINUM, ses schémas
TikZ et tous les assets nécessaires. Il ne dépend d’aucun fichier extérieur
au ZIP.

## Import dans Overleaf

1. Créer un nouveau projet avec **Upload Project**.
2. Importer `KORA-Dossier-Technique-Overleaf.zip`.
3. Vérifier que le document principal est `main.tex`.
4. Choisir le compilateur **XeLaTeX** afin de conserver correctement
   l’alphabet fulfulde (`ɓ`, `ɗ`, `ƴ`, `ŋ`, `ɲ`).
5. Compiler.

## Valeurs à modifier

Les métadonnées sont centralisées dans `config.tex`.

- lien du dépôt : commande `\RepoURL`;
- lien public de la vidéo MP4 : commande `\DemoVideoURL`;
- date, équipe, e-mails, téléphone et validateur : commandes suivantes.

Avant le dépôt, ouvrez le lien de la vidéo depuis une fenêtre privée.

## Structure

```text
main.tex                 préambule, charte graphique et couverture
config.tex               métadonnées et liens éditables
sections/                contenu modulaire du dossier
assets/                  logos, popup, illustrations et polices Noto
README.md                ce guide
```

Les diagrammes d’architecture sont en TikZ et restent vectoriels dans le PDF.
Les assets PNG et les polices Noto sont intégrés au ZIP pour assurer une
compilation autonome; la notice de licence Noto accompagne les fichiers.
