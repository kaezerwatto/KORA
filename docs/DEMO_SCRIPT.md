# Script final — KORA, la finance numérique en fulfulde

La vidéo est un pitch-démo réel de moins de trois minutes. Elle utilise
uniquement `https://safinum.cm/hackathon-test`, sans paramètre jury, sans
injection et sans écran produit artificiellement. Les seuls ajouts graphiques
sont le générique, le curseur, des sous-titres courts et des transitions.

La narration structurée utilisée par le générateur est disponible dans
[`../submission/video/narration-fr.json`](../submission/video/narration-fr.json).

## 0:00–0:13 — Le besoin

**Image :** logo KORA, titre et promesse.

> Au Cameroun, une opération financière peut être disponible, mais rester
> difficile à comprendre lorsqu’elle est présentée uniquement en français ou
> en anglais. KORA apporte le fulfulde de l’Adamaoua directement dans
> l’interface, sans modifier le service financier.

## 0:13–0:32 — Installation réelle

**Image :** profil Chrome propre, page `chrome://extensions`, apparition de la
vraie carte KORA après chargement de `release/kora-unpacked`.

> Nous partons d’un profil Chrome propre. Le dossier KORA est chargé comme
> extension non empaquetée. Le manifeste, le moteur linguistique, les mémoires
> et les modèles sont embarqués. Il n’y a ni serveur de traduction, ni
> télémétrie, ni donnée de page transmise.

## 0:32–0:50 — Compte et solde

**Image :** page Safinum normale traduite; montrer le solde, le compte, le nom
et les transactions.

> Ouvrons maintenant l’environnement normal de Safinum. KORA traduit
> immédiatement les textes vers le fulfulde. Le solde reste exactement à deux
> cent cinquante mille francs C F A. Le numéro de compte, le nom d’Amina et
> chaque transaction conservent leurs valeurs d’origine.

## 0:50–1:10 — Frais et imprévu réel

**Action :** saisir `300000`, continuer, montrer l’erreur `AMOUNT_002`, puis
corriger à `25000` et poursuivre.

> Testons un imprévu réel. Nous demandons trois cent mille francs, au-delà du
> solde disponible. Safinum bloque l’étape et KORA traduit clairement l’erreur
> de solde insuffisant, tout en conservant le code et les montants. Nous
> corrigeons ensuite à vingt-cinq mille francs, et le calcul redevient
> cohérent.

## 1:10–1:30 — Bénéficiaire

**Action :** saisir les valeurs fictives, la note `Démonstration KORA`, cocher
la vérification et continuer.

> À l’étape du bénéficiaire, nous saisissons des données fictives. KORA traduit
> les consignes et l’alerte de sécurité, mais laisse strictement intacts le
> nom, le téléphone, le motif et la note. Après vérification, nous cochons la
> confirmation et poursuivons le parcours.

## 1:30–1:52 — Récapitulatif et reçu

**Action :** contrôler les valeurs, cocher, confirmer et montrer la référence
du reçu.

> Dans le récapitulatif, nous retrouvons le montant, les frais, le total, le
> bénéficiaire et son numéro. Après la dernière confirmation, Safinum produit
> le reçu simulé. La référence apparaît, et toutes les valeurs correspondent
> exactement à celles du formulaire.

## 1:52–2:16 — Validation et conclusion

**Image :** générique final KORA TEAM.

> Pour la qualité linguistique, Monsieur Jean Ernset Souroumbai a relu les
> traductions du parcours et vérifié leur fidélité selon le contexte, la
> sémantique et la terminologie financière. KORA combine cette mémoire
> contrôlée avec des modèles légers embarqués, tout en préférant conserver
> l’original lorsqu’un sens n’est pas garanti. KORA : comprendre, vérifier et
> confirmer en fulfulde.

## Garde-fous de captation

- profil Chrome temporaire et extension réellement chargée;
- aucune donnée personnelle réelle;
- URL Safinum sans `?jury=1`;
- aucune commande d’injection ou mutation artificielle;
- arrêt du rendu si une étape ou une valeur attendue est absente;
- durée finale strictement inférieure à trois minutes.
