# KORA

KORA est une extension Chrome Manifest V3 qui rend les interfaces financières compréhensibles en **fulfulde de l’Adamaoua (`fub`)** à partir du français ou de l’anglais.

Elle fonctionne directement sur une page existante, sans API fournie par le site, sans modifier son code source et sans transmettre les données affichées.

## Installer la version jury

1. Ne pas sélectionner le ZIP dans Chrome : Chrome exige un dossier contenant directement `manifest.json`.
2. Utiliser directement le dossier `release/kora-unpacked`, ou décompresser [`release/kora-extension.zip`](release/kora-extension.zip).
3. Ouvrir `chrome://extensions`.
4. Activer **Mode développeur**.
5. Cliquer **Charger l’extension non empaquetée**.
6. Choisir `release/kora-unpacked` — pas le fichier ZIP.
7. Ouvrir ou actualiser [Safinum Pay](https://safinum.cm/hackathon-test).

KORA traduit automatiquement la page. Le popup permet de suspendre la traduction, de forcer FR/EN ou de relancer l’analyse du contenu dynamique.

## Capacités

- français → `fub` et anglais → `fub`;
- cinq étapes Safinum : solde, frais, bénéficiaire, récapitulatif, reçu;
- sept erreurs et alertes publiques;
- contenu ajouté après le chargement via `MutationObserver`;
- mémoire embarquée Safinum et web financier (connexion, carte, paiement, dépôt, retrait, crédit, erreurs);
- gabarits sémantiques pour les montants imprévus et composition avec seuil de confiance;
- restauration complète du texte original;
- zéro requête réseau et zéro télémétrie;
- ZIP final : environ **43 Kio**, très inférieur à la limite de 10 Mio.

## Garantie d’intégrité

KORA ne modifie jamais :

- les valeurs de `input`, `textarea` et `select`;
- les noms et notes saisis;
- les montants, frais, totaux et devises;
- les numéros de compte et de téléphone;
- les références de transaction;
- les dates et pourcentages.

Les valeurs mixtes sont masquées, la phrase est traduite, puis les valeurs sont restaurées octet pour octet. Si le contrôle échoue, le texte original est conservé.

## Développer

Prérequis : Node.js 20+ et Google Chrome.

```bash
npm install
npm test
npm run build
npm run test:live
npm run package
```

La dernière commande produit le ZIP de livraison et `release/kora-unpacked`, dossier directement sélectionnable dans Chrome. Elle échoue automatiquement si le ZIP dépasse 10 Mio.

## Architecture

```text
Page existante
  └─ TreeWalker + MutationObserver
       ├─ classifieur de données protégées → texte intact
       ├─ mémoire Safinum + intentions financières générales
       ├─ gabarits sémantiques avec valeurs masquées
       └─ couverture 100 % si critique, ≥ 80 % sinon → repli prudent
            └─ contrôle d’intégrité → rendu ou original
```

Le modèle neuronal évalué pour préparer le corpus n’est pas livré : son format quantifié pèse environ 80 Mo et violerait la limite du ZIP. Le moteur exécuté devant le jury est entièrement embarqué et déterministe.

## Documentation

- [Architecture et flux](docs/ARCHITECTURE.md)
- [Sécurité et confidentialité](docs/SECURITY.md)
- [Sources et validation linguistique](docs/LINGUISTIC_VALIDATION.md)
- [Tests et démonstration](docs/TESTING.md)
- [Script vidéo de trois minutes](docs/DEMO.md)

## Limite linguistique

Le corpus a été construit à partir de ressources `fub` camerounaises, de terminologie financière documentée et de comparaisons automatiques. Une validation finale par des locuteurs de Ngaoundéré, Garoua ou Maroua reste nécessaire avant un déploiement bancaire réel.

## Licence

Code : MIT. Les ressources linguistiques restent soumises à leurs licences respectives; KORA ne redistribue aucun corpus audio, livre ou modèle tiers.
