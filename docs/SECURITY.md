# Sécurité, confidentialité et intégrité

## Modèle de menace

Le risque majeur n’est pas une attaque réseau : c’est une traduction qui modifie silencieusement un montant, un bénéficiaire, une référence ou une action financière.

## Mesures

- Aucun `fetch`, WebSocket, API distante ou télémétrie.
- Aucun contenu de page dans `chrome.storage`.
- Seules deux préférences sont conservées : extension activée et langue source.
- Aucun `innerHTML`, remplacement d’élément, clonage ou réécriture de formulaire.
- Aucune modification de `value`, `checked`, `selected`, `name`, `id`, `type`, `min` ou `step`.
- Permissions limitées à `storage` et `activeTab`; le content script est déclaré sur les pages web pour permettre l’adaptation indépendante.

## Valeurs protégées

Les expressions suivantes sont reconnues avant traduction :

- montants et devises : `25 000 FCFA`, `1.5%`;
- téléphones : `+237 6 99 12 34 56`;
- comptes : `CM 001 2345 6789 01`;
- références : `SAF-2026-LCIFIB`;
- dates;
- courriels et URL;
- noms complets;
- toute valeur actuellement saisie dans un champ.

## Politique de repli

Si une valeur masquée manque dans le résultat, KORA refuse le résultat et laisse l’original. Dans un contexte financier, une absence de traduction est préférable à une information fausse.

## Limites

- La détection de noms propres est prudente et peut laisser certains titres non traduits.
- Le glossaire compositionnel peut produire une phrase mixte sur un contenu totalement hors domaine.
- KORA est un outil d’accessibilité, pas un dispositif d’autorisation de transaction ni une traduction financière certifiée.
