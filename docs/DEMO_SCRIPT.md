# Script final — KORA, la finance numérique en foufouldé

La vidéo est un pitch-démo réel de moins de trois minutes. Elle utilise
uniquement `https://safinum.cm/hackathon-test`, sans paramètre jury, sans
injection et sans écran produit artificiellement. Les seuls ajouts graphiques
sont les génériques, le curseur, les clics et des transitions courtes. Aucun
sous-titre ni bandeau ne masque la page.

La narration structurée utilisée par le générateur est disponible dans
[`../submission/video/narration-fr.json`](../submission/video/narration-fr.json).

## 0:00–0:17 — Le besoin

**Image :** logo KORA, titre et promesse.

> Au Cameroun, un service financier peut être disponible sans être réellement
> accessible dans la langue de son utilisateur. KORA traduit localement les
> interfaces françaises et anglaises vers le foufouldé de l’Adamaoua. Voici
> une démonstration réelle, sur le parcours normal de Safinum, sans modifier
> le code du service.

## 0:17–0:34 — Installation réelle

**Image :** profil Chrome propre, page `chrome://extensions`, apparition de la
vraie carte KORA après chargement de `release/kora-unpacked`.

> Nous partons d’un profil Chrome propre. Dans la page des extensions, le mode
> développeur permet de charger le dossier release, puis kora-unpacked. La
> carte KORA apparaît réellement. Le moteur linguistique, ses mémoires et ses
> modèles sont embarqués : aucun texte financier n’est envoyé à un serveur.

## 0:34–0:48 — Popup réelle

**Image :** page Safinum entière avec la vraie popup sombre KORA.

> Sur Safinum, j’ouvre maintenant la vraie popup KORA. Elle indique clairement
> la page active, la langue d’affichage et l’état de la traduction. Un seul
> contrôle suffit pour activer ou désactiver KORA, et les boutons permettent
> de revenir au français ou à l’anglais.

## 0:48–1:04 — Compte et solde

**Image :** page Safinum normale traduite; montrer le solde, le compte, le nom
et les transactions.

> La page est traduite en foufouldé, tout en restant entièrement lisible. Le
> solde demeure exactement à deux cent cinquante mille francs C F A. Le numéro
> de compte, le nom d’Amina et les montants des opérations récentes restent
> intacts. Nous lançons maintenant un transfert simulé.

## 1:04–1:23 — Frais et imprévu réel

**Action :** saisir `300000`, continuer, montrer l’erreur `AMOUNT_002`, puis
corriger à `25000` et poursuivre.

> Testons les frais et un imprévu réel. Nous saisissons trois cent mille
> francs, au-delà du solde disponible. Safinum bloque l’étape ; KORA traduit
> l’erreur de solde insuffisant sans altérer le code ni le montant. Nous
> corrigeons à vingt-cinq mille francs. Les frais et le total sont recalculés,
> puis nous poursuivons.

## 1:23–1:39 — Bénéficiaire

**Action :** saisir les valeurs fictives, la note `Démonstration KORA`, cocher
la vérification et continuer.

> À l’étape du bénéficiaire, nous utilisons uniquement des données fictives.
> KORA traduit les consignes et l’alerte de sécurité, mais ne touche jamais
> aux saisies : Jean-Paul Mbarga, son téléphone, le motif et la note restent
> exactement tels qu’ils ont été entrés. Après vérification, nous confirmons
> et continuons.

## 1:39–1:58 — Récapitulatif, reçu et retour

**Action :** contrôler les valeurs, cocher, confirmer, montrer la référence
du reçu, puis revenir au tableau de bord.

> Le récapitulatif présente le montant, les frais, le total, le bénéficiaire et
> son numéro. Après la dernière confirmation, Safinum génère le reçu simulé
> avec sa référence. Toutes les valeurs correspondent au formulaire. Nous
> revenons enfin au tableau de bord : le parcours est complet, cohérent et
> toujours traduit.

## 1:58–2:20 — Validation et conclusion

**Image :** générique final KORA TEAM.

> Monsieur Jean-Ernest SOUROUMBAI a relu les traductions du parcours et
> vérifié leur fidélité selon le contexte, la sémantique et la terminologie
> financière. Réalisé à Yaoundé par KORA Team, ce prototype protège les
> données, préserve les valeurs et rend la finance numérique plus accessible.
> KORA : comprendre, vérifier et confirmer en foufouldé.

## Garde-fous de captation

- profil Chrome temporaire et extension réellement chargée;
- aucune donnée personnelle réelle;
- URL Safinum sans `?jury=1`;
- aucune commande d’injection ou mutation artificielle;
- arrêt du rendu si une étape ou une valeur attendue est absente;
- durée finale strictement inférieure à trois minutes.
