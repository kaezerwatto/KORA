# Description de la solution

## Nom

**KORA — comprendre, vérifier, confirmer en fulfulde**

## Résumé

KORA est une extension Chrome qui traduit localement les interfaces financières françaises et anglaises vers le fulfulde de l’Adamaoua (`fub`). Elle s’intègre à une page existante sans API, hook ou modification du service cible.

Sa particularité est un verrou d’intégrité financière : les montants, frais, totaux, devises, noms, téléphones, comptes, références et données saisies ne sont jamais traduits. Toute traduction qui ne conserve pas une valeur est rejetée.

KORA couvre le parcours complet Safinum Pay, ses erreurs et ses alertes. Elle détecte aussi les contenus ajoutés après chargement. Pour un texte inédit, elle combine des gabarits à valeurs protégées et un glossaire financier sourcé. Elle préfère conserver l’original plutôt que produire un contresens.

## Contribution technique propre

- analyse générique du DOM d’une page non modifiée;
- verrou local des données financières;
- moteur bilingue FR/EN → FUB déterministe;
- traduction dynamique idempotente compatible avec Vue;
- retour instantané au texte original;
- interface accessible et lecture optionnelle;
- tests automatisés sur l’environnement Safinum réel.

## Confidentialité

KORA n’utilise aucun serveur de traduction. Le paquet ne contient aucun traceur et n’envoie aucune donnée. Seules deux préférences non sensibles sont conservées localement.

## Faisabilité

- archive : environ 43 Kio;
- matériel : tout ordinateur exécutant Chrome;
- réseau : nécessaire uniquement pour ouvrir le service financier;
- installation : extension non empaquetée en moins d’une minute;
- adaptation : remplacement de la mémoire et du glossaire pour une autre langue nationale.

## Limites

Le glossaire doit être relu par des locuteurs de plusieurs zones Adamawa avant un usage bancaire en production. Les textes généraux non financiers peuvent rester dans leur langue originale si aucun remplacement sûr n’existe.
