# Composants et licences

## Inclus dans l’extension

| Composant | Usage | Licence |
|---|---|---|
| Code KORA | Extension Chrome, moteur et interface | MIT |
| Mémoire KORA | Phrases du parcours et messages financiers | Projet KORA |
| Glossaire compilé | Terminologie et provenance | Métadonnées du projet; respecter chaque source citée |
| Petit modèle neuronal KORA | Classement de fluidité, poids int8 entraînés par KORA | Code MIT; Common Voice CC0 et mémoire KORA |

Le paquet inclut les petits poids KORA et leur inférence JavaScript. Il n’inclut aucun corpus brut, poids neuronal tiers, bibliothèque d’inférence ou code chargé à distance.

## Dépendances de développement

| Composant | Version | Usage |
|---|---:|---|
| esbuild | 0.28.2 | Bundle local |
| puppeteer-core | 25.17.0 | Test live dans Chrome |
| Node.js test runner | Node 24 | Tests unitaires |
| PyTorch + NumPy | environnement `.venv` | Réentraînement optionnel, hors archive |

Ces dépendances ne sont pas placées dans l’archive Chrome.

## Modèles évalués, non distribués

| Modèle | Licence annoncée | Décision |
|---|---|---|
| Flagship `francais-fufulde` | CC BY 4.0; bundle int8 CC BY-NC 4.0 | Rejeté : sorties financières non fiables et taille > 10 Mo |
| DS4H `linguo_mt_en_fub` | Apache-2.0 | Rejeté : contresens, corpus inconnu et taille > 10 Mo |
| NLLB-200 | CC BY-NC 4.0 | Rejeté : `fuv`, pas `fub`, environ 895 Mo quantifié |

## Services externes

Aucun service externe n’est utilisé à l’exécution.

Pendant le développement :

- une tentative de comparaison de cinq phrases publiques avec Google Translate a reçu HTTP 429;
- une mémoire publique `ff` a servi de référence secondaire pour cinq phrases;
- aucune donnée saisie, personnelle ou provenant d’une session de test n’a été transmise.

## Sources linguistiques

Voir [`../data/glossary.json`](../data/glossary.json) et [`VALIDATION.md`](VALIDATION.md). KORA ne redistribue pas les fichiers SIL, Common Voice, Bible, OPUS ou Mozilla NOODL.
