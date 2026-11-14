# Script vidéo — 3 minutes

## 0:00–0:20 — Problème

> « Les services financiers camerounais sont souvent disponibles uniquement en français ou en anglais. KORA est une extension Chrome qui traduit une interface existante vers le fulfulde de l’Adamaoua, sans modifier le service financier. »

Montrer Safinum Pay en français puis `chrome://extensions` avec KORA chargée.

## 0:20–0:40 — Activation

Ouvrir la popup et choisir **Fulfulde**.

> « Tout fonctionne localement. Aucune donnée affichée ou saisie ne quitte l’appareil. »

Montrer le tableau de bord traduit. Survoler un texte pour afficher l’original.

## 0:40–1:10 — Solde et frais

Montrer :

- `250 000 FCFA`;
- `CM 001 2345 6789 01`;
- les quatre transactions.

Lancer le transfert et changer le montant ou le type d’opération.

> « KORA traduit les instructions mais ne touche jamais aux montants, à la devise ou aux calculs de Safinum. »

## 1:10–1:35 — Bénéficiaire

Saisir ou conserver :

- Jean-Paul Mbarga;
- `+237 6 99 12 34 56`;
- un motif et une note.

> « Les champs restent strictement intacts. La valeur saisie est reconnue au récapitulatif sans être traduite, stockée ou transmise. »

## 1:35–1:55 — Récapitulatif et reçu

Montrer côte à côte oralement :

- montant;
- frais;
- total;
- bénéficiaire;
- téléphone;
- référence.

Confirmer puis montrer le reçu.

> « Les mêmes valeurs sont conservées du formulaire jusqu’au reçu. »

## 1:55–2:20 — Contenu inédit et erreurs

Déclencher une erreur ou une alerte de sécurité. Dans le panneau d’évaluation
Safinum, saisir :

```text
sodle insufisant
```

> « KORA corrige les fautes seulement lorsqu’un sens unique est identifié.
> Les messages critiques utilisent ensuite les mémoires et gabarits contrôlés.
> Si le sens n’est pas garanti, l’original est conservé. »

## 2:20–2:40 — Anglais

Basculer Safinum Pay en anglais.

> « La même extension détecte l’anglais et produit la même interface en fulfulde Adamawa. »

Montrer `Make a transfer` traduit vers la même action fulfulde.

## 2:40–3:00 — Innovation et conclusion

> « KORA pèse environ 254 kilo-octets, fonctionne sans GPU, serveur ni API de
> traduction, respecte la confidentialité et peut être adapté à d’autres
> langues camerounaises avec une nouvelle mémoire validée. KORA ne traduit pas
> seulement les mots : elle protège l’opération financière. »

Terminer sur la popup sombre, le logo KORA et le dépôt GitHub.

## Checklist avant enregistrement

- fenêtre Chrome à 100 % de zoom;
- aucune donnée personnelle réelle;
- extension reconstruite avec `npm run package`;
- parcours remis à zéro;
- popup épinglé;
- notifications et autres onglets fermés;
- durée cible : 2 min 50 s.
