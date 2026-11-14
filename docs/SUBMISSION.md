# Description de la solution

## Nom

**KORA — comprendre, vérifier, confirmer en fulfulde**

## Résumé

KORA est une extension Chrome qui traduit localement les interfaces financières françaises et anglaises vers le fulfulde de l’Adamaoua (`fub`). Elle s’intègre à une page existante sans API, hook ou modification du service cible.

Sa particularité est un verrou d’intégrité financière : les montants, frais, totaux, devises, noms, téléphones, comptes, références et données saisies ne sont jamais traduits. Toute traduction qui ne conserve pas une valeur est rejetée.

KORA couvre le parcours complet Safinum Pay, ses erreurs et ses alertes. Elle
détecte aussi les contenus ajoutés après chargement. Sa terminologie contrôlée
inventorie 512 libellés financiers fournis, dédupliqués en 504 concepts FR/EN,
avec un statut explicite pour chaque formulation `fub`. Pour un texte inédit,
elle combine des gabarits à valeurs protégées et un glossaire financier
sourcé. Un correcteur borné prend en charge les fautes sur 1 252 libellés
FR/EN testés, tout en refusant les correspondances ambiguës. Elle préfère
conserver l’original plutôt que produire un contresens.

## Contribution technique propre

- analyse générique du DOM d’une page non modifiée;
- verrou local des données financières;
- moteur bilingue FR/EN → FUB déterministe;
- correction orthographique multifaute, indexée sur toutes les mémoires;
- réseau neuronal `fub` int8 pour classer la fluidité des formulations sûres;
- traduction dynamique idempotente compatible avec Vue;
- retour instantané au texte original;
- popup accessible qui restitue immédiatement le focus et les raccourcis clavier;
- tests automatisés sur Safinum, une page UBA réelle et les corpus financiers.

L’environnement jury n’est pas traité spécialement : son texte est traduit
par le même analyseur DOM et le même observateur de mutations que toute page
administrative ou bancaire.

## Confidentialité

KORA n’utilise aucun serveur de traduction. Le paquet ne contient aucun
traceur et n’envoie aucune donnée. Seules trois préférences non sensibles sont
conservées localement : activation, langue d’affichage et indication de langue
source.

## Faisabilité

- archive : taille contrôlée automatiquement et très inférieure à 10 Mio;
- matériel : tout ordinateur exécutant Chrome;
- réseau : nécessaire uniquement pour ouvrir le service financier;
- installation : extension non empaquetée en moins d’une minute;
- adaptation : remplacement de la mémoire et du glossaire pour une autre langue nationale.

## Livrables

- vidéo narrée de moins de trois minutes :
  [`../release/kora-pitch-demo.webm`](../release/kora-pitch-demo.webm);
- documentation technique A4 :
  [`../release/KORA-Documentation-SAFINUM.pdf`](../release/KORA-Documentation-SAFINUM.pdf);
- extension Chrome :
  [`../release/kora-extension.zip`](../release/kora-extension.zip);
- dépôt public : <https://github.com/kaezerwatto/KORA>.

Les valeurs exactes du formulaire et les contrôles avant envoi se trouvent
dans [`../submission/SUBMISSION_CHECKLIST.md`](../submission/SUBMISSION_CHECKLIST.md).

## Limites

Le glossaire doit être relu par des locuteurs de plusieurs zones Adamawa avant un usage bancaire en production. Les textes généraux non financiers peuvent rester dans leur langue originale si aucun remplacement sûr n’existe.
