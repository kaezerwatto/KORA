# Démonstration KORA — moins de 3 minutes

Le livrable final se trouve dans
[`../release/kora-pitch-demo.webm`](../release/kora-pitch-demo.webm). Il est
construit à partir de captures réelles du site Safinum avec KORA chargée, puis
narré en français. Le script de rendu est reproductible :

```bash
npm run submission:capture
npm run submission:video
```

La génération de la voix demande `gTTS` dans `.venv`. Ce composant sert
uniquement à produire le fichier de présentation : il n’est ni embarqué ni
appelé par l’extension.

## 0:00–0:25 — problème

« Une interface bancaire en français ou en anglais peut exclure un utilisateur qui parle surtout fulfulde. KORA ajoute une couche d’accessibilité sans modifier le service financier. »

Présenter KORA et le problème d’accès linguistique aux services financiers.

## 0:25–0:55 — traduction immédiate

Montrer la popup puis le tableau de bord réellement traduit :

- solde et compte inchangés;
- actions et avertissement traduits;
- popup KORA indiquant traitement local.

Expliquer que Français ou English restaure l’original.

## 0:55–1:35 — intégrité du parcours

Effectuer un transfert de `25 000 FCFA` :

1. frais et total;
2. bénéficiaire et téléphone non traduits;
3. note saisie inchangée;
4. récapitulatif;
5. reçu.

Insister sur la référence et les montants identiques.

## 1:35–1:58 — contenu inédit

Ajouter dynamiquement : « Votre transfert de 9 500 FCFA est en attente. »

Montrer la traduction instantanée sans rechargement et la conservation exacte de `9 500 FCFA`.
Injecter ensuite `sodle insufisant` : KORA corrige les deux fautes et affiche
`Kaalisi yonaa`, sans modifier le champ source.

## 1:58–2:20 — architecture et sécurité

Montrer le flux popup → DOM → moteur → mémoires → modèles et rappeler
qu’aucun contenu de page n’est transmis.

## 2:20–fin — innovation et preuves

« KORA est locale, sans collecte et très loin de la limite de 10 Mio. Son
verrou financier refuse toute traduction qui perd un montant, un numéro ou
une référence. Son réseau neuronal `fub`, quantifié en int8, prédit les mots
suivants uniquement pour classer les formulations déjà sûres. »

Terminer sur les 504 concepts, 1 252 cas orthographiques, 27 tests unitaires,
les tests Safinum/UBA, le logo KORA et le dépôt public.
