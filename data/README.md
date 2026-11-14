# Données linguistiques de KORA

KORA ne redistribue aucun corpus tiers. L’extension contient uniquement une petite mémoire de traduction et un glossaire dont les entrées ont été compilées pour le parcours financier.

## Hiérarchie de confiance

1. **Adamawa Fulfulde camerounais (`fub`)**
   - Tourneux & Konaï, vocabulaire contemporain du téléphone et des transferts d’argent, CC BY 4.0.
   - SIL English–Fulfulde Dictionary, 11 190 entrées.
   - SIL, vocabulaire quadrilingue français–anglais–fulfulde–wandala.
   - Mozilla Common Voice 27.0 `fub`, utilisé pour vérifier l’orthographe en contexte.
2. **Variétés voisines, uniquement comme pistes**
   - Manuel technique Peace Corps : concepts financiers, variété malienne.
   - SIL « Sigugo Ceede e Banki » : banque, variété nigériane `fuv`.
3. **Sources non retenues dans le produit**
   - Corpus narratif Mozilla NOODL : licence incompatible avec la génération et les dérivés.
   - Bible `fub` : protégée par le droit d’auteur.
   - Corpus Hugging Face sans licence ou `silver_unreviewed` : provenance ou qualité insuffisante.
   - OPUS/NLLB/FLORES : macro-langue `ff` ou `fuv`, pas `fub`.

## Fichiers

- `glossary.json` : terminologie, statut de validation et provenance.
- `../scripts/source-texts.json` : inventaire bilingue FR/EN des textes publics du test Safinum.
- `../src/translations.js` : mémoire FR/EN → FUB embarquée, générée puis révisée.

Les statuts `proposed` et `candidate-cross-dialect` signalent honnêtement les termes qui doivent encore être validés par un locuteur Adamawa. Ils ne doivent pas être présentés comme une norme linguistique définitive.
