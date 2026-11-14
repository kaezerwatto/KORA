# Script final — KORA, la finance numérique en foufouldé

La vidéo est un pitch-démo réel de moins de trois minutes sur
`https://safinum.cm/hackathon-test`. Les quatre slides éditoriales structurent
le récit; toutes les autres images proviennent d’un vrai profil Chrome, de la
vraie popup KORA et du parcours Safinum exécuté avant le montage. Aucun
bandeau ne masque l’interface.

La source mot à mot utilisée par ElevenLabs est
[`../submission/video/narration-fr.json`](../submission/video/narration-fr.json).

## 0:00–0:08 — Ouverture KORA × SAFINUM

**Image :** logos KORA et SAFINUM, promesse et illustration de la solution.

> KORA rend la finance numérique plus accessible en foufouldé de l’Adamaoua.
> Voici notre pitch-démo réel pour le SAFINUM Innovate Challenge 2026.

## 0:08–0:30 — Problème, solution et cas d’usage

**Image :** slide illustrée présentant la barrière linguistique, la traduction
locale FR/EN vers foufouldé et le parcours financier protégé.

> Le problème est simple : une interface bancaire existe, mais le français ou
> l’anglais peut empêcher l’utilisateur de comprendre une action sensible.
> KORA apporte le foufouldé directement dans la page, sans modifier le service.
> Le cas d’usage est concret : consulter son compte, calculer des frais,
> vérifier un bénéficiaire et confirmer un transfert simulé, tout en gardant
> noms, numéros et montants strictement intacts.

## 0:30–0:46 — Préparation et installation réelle

**Action :** activer réellement le mode développeur dans
`chrome://extensions`, afficher le chemin `release/kora-unpacked`, puis la
carte KORA chargée.

> Commençons par la préparation. Dans Chrome, nous activons réellement le mode
> développeur, puis nous chargeons le dossier release, kora-unpacked. La carte
> KORA apparaît. Son moteur, ses mémoires et ses modèles sont embarqués ; aucun
> texte financier n’est envoyé à un serveur.

## 0:46–1:05 — Étape 1 sur 5 : langue et compte

**Action :** montrer Safinum en français avec son URL, ouvrir la vraie popup,
cliquer `Fulfulde`, afficher la page traduite, contrôler les valeurs, puis
lancer le transfert.

> Première étape : la langue et le compte. Safinum s’ouvre d’abord en français
> dans la barre du navigateur. J’ouvre la vraie popup KORA et je choisis
> foufouldé. La page se traduit immédiatement. Le solde reste à deux cent
> cinquante mille francs C F A ; le numéro de compte, le nom d’Amina et chaque
> montant restent inchangés. Nous lançons ensuite le transfert simulé.

## 1:05–1:29 — Étape 2 sur 5 : frais et première erreur

**Action :** sélectionner une autre banque, saisir progressivement `300000`,
déclencher `AMOUNT_002`, corriger progressivement à `25000`, puis poursuivre
avec `500 FCFA` de frais et `25 500 FCFA` de total.

> Deuxième étape : le type d’opération, le montant et les frais. Nous
> sélectionnons une autre banque, puis saisissons progressivement trois cent
> mille francs. Premier comportement d’erreur : Safinum refuse ce montant
> supérieur au solde. KORA traduit le message de solde insuffisant, mais
> conserve le code AMOUNT zéro zéro deux et toutes les valeurs. Nous corrigeons
> à vingt-cinq mille francs ; les frais deviennent cinq cents francs et le
> total vingt-cinq mille cinq cents.

## 1:29–1:51 — Étape 3 sur 5 : bénéficiaire et sécurité

**Action :** saisir visiblement les données fictives, tenter de continuer sans
vérification, montrer `SECURITY_001`, cocher la case, puis poursuivre.

> Troisième étape : le bénéficiaire. Nous saisissons visiblement Jean-Paul
> Mbarga, son téléphone, le motif Paiement de services et une note fictive. Ces
> saisies restent exactement dans leur forme originale. Deuxième comportement
> d’erreur : si nous continuons sans confirmer la vérification, Safinum affiche
> l’alerte de sécurité SECURITY zéro zéro un, traduite en foufouldé. Nous
> vérifions alors le bénéficiaire, cochons la case et poursuivons.

## 1:51–2:08 — Étape 4 sur 5 : récapitulatif

**Action :** contrôler montant, frais, total, identité, téléphone et référence,
cocher la confirmation, puis valider.

> Quatrième étape : le récapitulatif. Nous retrouvons vingt-cinq mille francs,
> cinq cents francs de frais, le total de vingt-cinq mille cinq cents, le
> bénéficiaire, son téléphone et la référence. Rien n’a été altéré entre les
> champs saisis et ce contrôle final. Nous cochons la confirmation, puis
> validons.

## 2:08–2:30 — Étape 5 sur 5 : reçu et retour réel

**Action :** montrer le reçu, ouvrir un nouveau transfert, utiliser `Retour` et
retrouver le tableau de bord.

> Cinquième étape : le reçu et le retour. Safinum génère la confirmation
> simulée avec la même référence et les mêmes valeurs. Nous ouvrons ensuite un
> nouveau transfert, puis utilisons Retour pour retrouver le tableau de bord.
> Le site de test réinitialise volontairement chaque simulation à deux cent
> cinquante mille francs ; KORA respecte ce comportement et n’invente jamais
> un solde.

## 2:30–2:46 — Validation linguistique

**Image :** slide illustrée avec le nom exact du responsable de validation.

> Avant de conclure, parlons qualité. Monsieur Jean-Ernest SOUROUMBAI a relu
> les traductions du parcours et vérifié leur fidélité selon le contexte, la
> sémantique et la terminologie financière. KORA associe cette mémoire
> contrôlée à des modèles embarqués, tout en conservant le texte original
> lorsqu’un sens sûr n’est pas disponible.

## 2:46–2:54 — Conclusion

**Image :** logos KORA et SAFINUM, équipe, dépôt et promesse finale.

> KORA : comprendre, vérifier et confirmer en foufouldé. Une solution locale,
> privée et prête à être étendue aux services financiers camerounais.

## Garde-fous de captation

- profil Chrome temporaire et extension réellement chargée;
- mode développeur effectivement activé;
- page française, popup et sélection foufouldé réellement capturées;
- saisies fictives visibles, deux erreurs réelles et retour réel;
- contrôle préalable de chaque montant, code, référence et identité;
- arrêt du rendu si une étape ou une valeur attendue est absente;
- durée finale strictement inférieure à trois minutes et fichier sous 10 Mo.
