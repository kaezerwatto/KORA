# Validation linguistique

## Langue

- Nom : fulfulde de l’Adamaoua.
- Code ISO 639-3 : `fub`.
- Écriture : latine.
- Caractères vérifiés : `ɓ`, `ɗ`, `ƴ`, `ŋ`.

## Méthode

Chaque traduction suit les étapes suivantes :

1. identification du concept financier français et anglais;
2. recherche prioritaire dans une source camerounaise `fub`;
3. comparaison avec le dictionnaire SIL et les phrases Common Voice;
4. consultation prudente d’une variété voisine uniquement si le terme manque;
5. préférence pour un emprunt réellement compris au Cameroun plutôt qu’un néologisme non attesté;
6. contrôle automatique des valeurs financières;
7. comparaison FR→FUB et EN→FUB : les deux sources doivent aboutir à la même phrase.

La provenance et le statut de chaque terme sont disponibles dans [`../data/glossary.json`](../data/glossary.json).

## Sources principales

- Tourneux & Konaï, *L’impact de la téléphonie mobile sur le fulfulde du Cameroun septentrional*, CC BY 4.0.
- SIL, *English–Fulfulde Dictionary*, 11 190 entrées, Cameroun.
- SIL, *Vocabulaire de base en quatre langues*.
- Mozilla Common Voice 27.0, Adamawa Fulfulde, CC0.

Le manuel financier Peace Corps et le livret bancaire nigérian servent uniquement de listes de concepts. Leurs formes ne sont pas reprises automatiquement comme du `fub`.

## Actions critiques verrouillées

| Français | Anglais | Sortie KORA |
|---|---|---|
| Effectuer un transfert | Make a transfer | `Waɗ transfeer` |
| Confirmer le transfert | Confirm transfer | `Tabitin transfeer` |
| Annuler | Cancel | `Haaytin` |
| Continuer | Continue | `Jokku` |
| Retour | Back | `Rutto` |
| Vérifier | Check | `Ƴeewto` |
| Frais de transfert | Transfer fees | `Musakaaji transfeer` |
| Solde disponible | Available balance | `Kaalisi gonɗi e konte` |

Les alertes sont traduites comme des phrases complètes. Elles ne sont jamais réduites à un simple titre.

## Contrôles automatiques

- 92 paires françaises et anglaises couvertes;
- sept erreurs et alertes identiques dans les deux directions;
- nombres, devises, téléphones, comptes, noms et références inchangés;
- rejet de toute traduction qui perd une valeur protégée;
- conservation de l’original si aucun remplacement sûr n’est possible.

## Comparaison de moteurs

Deux modèles téléchargeables ont été exécutés sur cinq phrases financières critiques. Les deux ont produit des répétitions ou des contresens. Ils ont été exclus de l’extension. La comparaison détaillée figure dans [`MODEL_EVALUATION.md`](MODEL_EVALUATION.md).

## Limite déclarée

La mémoire n’a pas encore fait l’objet d’une validation finale par un comité de locuteurs de Ngaoundéré, Garoua et Maroua. Les termes `proposed` et `candidate-cross-dialect` sont donc des choix de prototype documentés, pas une norme.

Avant un déploiement bancaire réel :

1. faire relire chaque action et alerte par au moins deux locuteurs `fub`;
2. effectuer un test de compréhension avec des utilisateurs;
3. résoudre les divergences régionales;
4. versionner et signer le glossaire validé.
