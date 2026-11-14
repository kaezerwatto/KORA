# Stratégie de test

## Tests automatiques

`npm test` vérifie :

- détection français/anglais;
- parité des deux directions vers la même traduction `fub`;
- sept erreurs et alertes Safinum;
- catalogue complet des textes publics;
- masquage et restauration des valeurs;
- protection des données saisies;
- contenu financier inédit traité par gabarit ou glossaire.
- formes Adamawa corrigées (`-go`, `yonaa`);
- intentions financières générales et seuil de confiance.
- petit réseau neuronal `fub` quantifié, prédiction du mot suivant, score de fluidité et repli n-gramme;
- popup dark avec interrupteur et sélecteur FUB/FR/EN;
- restauration réelle FR/EN et retour vers Fulfulde via les messages d’extension;
- traduction du libellé d’une option sans modification de sa valeur technique;
- conservation des saisies, notamment `Payment for services`;
- ajout de nœuds, remplacement de texte, attributs dynamiques, Shadow DOM ouvert et iframe;
- traduction dynamique du message `hello mon frere qui est tu`.
- fermeture de la popup après action et restitution immédiate du focus;
- `Ctrl+A` sur toute la page traduite et dans un champ de formulaire;
- principaux libellés visibles d’une page UBA Cameroon reproduite localement;
- couverture bilingue de chaque libellé financier importé;
- conservation stricte des codes HTTP, événements et identifiants API.

## Test Chrome en direct

`npm run test:live` :

1. lance Google Chrome avec l’extension unpacked;
2. ouvre l’environnement Safinum de test;
3. ajoute réellement `hello mon frere qui est tu` après chargement et contrôle sa traduction;
4. vérifie le tableau de bord et les valeurs canoniques;
5. injecte après chargement « Votre transfert de 9 500 FCFA est en attente. »;
6. parcourt les cinq étapes jusqu’au reçu;
7. contrôle nom, téléphone, montants, référence et intégrité des données enregistrées;
8. ouvre une seconde page, bascule Safinum en anglais et confirme la traduction vers le même `fub`.

Un contrôle séparé ouvre aussi `https://www.ubacameroon.com/`, vérifie les
principaux blocs visibles et sélectionne le document puis un champ avec
`Ctrl+A`. La traduction n’installe aucun gestionnaire clavier et ne modifie pas
la sélection native.

Résultat de référence :

```text
LIVE PASS: French journey, dynamic content, form values and receipt integrity.
LIVE PASS: English source switched and translated to the same fub interface.
UBA LIVE PASS: translated homepage, page selection 1942 characters, field selection 10/10.
```

## Matrice manuelle avant remise

- Types : Compte Safinum, Mobile Money, autre banque.
- Montants : `0`, `25 000`, supérieur au solde, seuils minimum/maximum des frais.
- Erreurs : `AMOUNT_001`, `AMOUNT_002`, `BENEFICIARY_001`, `SECURITY_001`, `SECURITY_002`, `NETWORK_001`, `CONFIRM_001`.
- Accessibilité : clavier seul, focus visible, zoom 200 %, thème sombre, lecteur d’écran.
- Cycle de vie : activation, suspension, restauration, rechargement et changement FR/EN.

## Taille

`npm run package` produit aussi `release/kora-unpacked`, directement chargeable dans Chrome, et échoue au-delà de 10 Mio. La taille exacte du ZIP courant est affichée par la commande de packaging.
