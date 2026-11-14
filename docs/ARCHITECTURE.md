# Architecture technique

## Contraintes

- Extension Chrome Manifest V3 évaluée sur une page normale.
- Aucun hook Safinum, aucun `data-i18n`, aucune modification du code cible.
- Français et anglais vers fulfulde Adamawa (`fub`).
- Données affichées non collectées, non stockées et non transmises.
- ZIP inférieur à 10 Mio.

## Pipeline

1. Le content script parcourt les nœuds texte avec `TreeWalker`.
2. Il collecte uniquement en mémoire vive les valeurs de formulaire pour les protéger.
3. Le classifieur exclut champs, code, SVG, noms, montants, téléphones, comptes, références et dates.
4. Une correspondance exacte est recherchée dans les mémoires Safinum et financière générale.
5. Pour un texte inédit, KORA masque les valeurs puis applique un gabarit sémantique.
6. À défaut, le glossaire remplace les expressions les plus longues en premier seulement si sa couverture atteint 100 % pour un contenu financier critique, ou 80 % pour un libellé non critique.
7. En dessous de ce seuil, KORA garde l’original au lieu d’inventer une traduction.
8. Le contrôle vérifie que chaque valeur sensible apparaît exactement autant de fois que dans l’original.
9. Le nœud texte est modifié sans remplacer son élément, ses événements ou ses propriétés.

## Contenu dynamique

Un `MutationObserver` surveille :

- nouveaux nœuds lors d’un changement d’étape;
- erreurs et alertes;
- bascule FR/EN;
- recalcul des frais;
- contenu injecté après chargement;
- attributs accessibles `aria-label`, `title` et `placeholder`.

Une table de nœuds mémorise original et traduction. Une mutation produite par KORA est reconnue et ne provoque pas de double traduction.

## Restauration

Le bouton d’arrêt restaure chaque texte et attribut uniquement s’il contient encore la traduction produite par KORA. Une modification ultérieure légitime de la page n’est donc jamais écrasée.

## Détection de langue

La mémoire bilingue est vérifiée avant l’heuristique. KORA ne dépend pas de `<html lang>`, car Safinum peut basculer sa langue sans le mettre à jour. Le popup permet de forcer `fr`, `en` ou `auto`.

## Pourquoi aucun modèle dans le ZIP

Les petits modèles pertinents testés font environ 75–80 Mo quantifiés :

- Flagship `francais-fufulde`;
- DS4H `linguo_mt_en_fub`.

NLLB quantifié approche 895 Mo et cible `fuv`, pas `fub`. Aucun modèle sérieux ne respecte 10 Mio. Le livrer aurait dégradé la reproductibilité et enfreint la contrainte de taille.
