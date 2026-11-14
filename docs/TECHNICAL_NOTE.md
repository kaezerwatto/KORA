# Note technique — KORA

## 1. Problème traité

KORA rend une interface financière française ou anglaise compréhensible en fulfulde Adamawa (`fub`) sans demander au fournisseur de modifier son application. La solution est une extension Chrome Manifest V3 autonome.

## 2. Architecture

### Content script

Le content script est chargé à `document_idle` sur la page normale. Il :

1. collecte temporairement les nœuds texte avant toute mutation;
2. ignore scripts, styles, SVG, code, canvas, iframe et contenu éditable;
3. classe chaque texte comme valeur protégée ou texte traduisible;
4. applique la cascade mémoire → gabarit → glossaire → original;
5. ajoute `lang="fub"` et conserve l’original pour la réversibilité;
6. surveille les changements avec `MutationObserver`.

Un second passage sur les éléments interactifs empêche les frameworks réactifs de laisser un bouton non traduit lors d’un changement d’étape.

### Popup

La popup permet uniquement :

- l’activation et la désactivation;
- la sélection `Fulfulde`, `Français` ou `English`;
- l’affichage de l’état de l’onglet actif.

Après une action réussie, elle se ferme afin de rendre immédiatement le focus
à la page. Les raccourcis natifs comme `Ctrl+A` restent donc disponibles.
Seules les préférences de langue et d’activation sont enregistrées avec
`chrome.storage.local`.

## 3. Cascade de traduction

### Mémoire bilingue

La mémoire historique du parcours et du domaine financier est complétée par
les libellés dédupliqués des deux corpus financiers fournis. Chaque concept
possède deux clés source :

```text
français ─┐
          ├─ même sortie fub
anglais ──┘
```

Les erreurs et alertes publiques sont couvertes explicitement. Les entrées
étendues portent un statut de provenance; les codes API restent inchangés.
Voir `docs/FINANCIAL_CORPORA.md`.

### Gabarits

Avant traduction, les valeurs sensibles deviennent des jetons :

```text
Votre transfert de 25 000 FCFA est en attente.
Votre transfert de ⟪KORA_0⟫ est en attente.
Transfeer maa ⟪KORA_0⟫ ɗon e fadde.
Transfeer maa 25 000 FCFA ɗon e fadde.
```

Le remplacement final restitue la valeur originale caractère pour caractère.

### Glossaire compositionnel

Pour une phrase inédite, les termes financiers connus sont remplacés sans générer de contenu nouveau. Si aucun terme ne correspond, KORA conserve l’original. Cette stratégie évite les hallucinations.

## 4. Verrou d’intégrité

### Éléments jamais modifiés

- valeurs et propriétés de `input`, `textarea` et `select`;
- `checked`, `selected`, `name`, `id`, `type`, `min`, `step`;
- contenu `contenteditable`;
- URL, courriel, compte, téléphone, référence et date;
- nom complet et valeur précédemment saisie;
- texte alphanumérique opaque comme `DSAFDF`.

### Contrôle après traduction

Toutes les valeurs sensibles extraites de l’original doivent apparaître à l’identique dans le résultat. Sinon, la traduction est rejetée.

Les valeurs saisies sont gardées seulement dans un `Set` en mémoire de l’onglet afin de les reconnaître au récapitulatif et au reçu. Elles ne sont ni écrites sur disque, ni envoyées au service worker, ni transmises.

## 5. Contenu dynamique

KORA combine :

- `MutationObserver` sur les enfants et caractères;
- écoute des événements `click`, `change` et `input`;
- rescan de sécurité toutes les 500 ms lorsque l’onglet est visible;
- traitement idempotent grâce aux enregistrements original/traduction.

Ce mécanisme couvre les étapes montées par Vue, les calculs de frais, les erreurs et les textes ajoutés après chargement.

## 6. Accessibilité

- l’ordre de tabulation et les éléments interactifs d’origine sont conservés;
- aucun bouton ni formulaire n’est cloné;
- `aria-label`, `placeholder` et `title` traduisibles sont pris en charge;
- chaque texte traduit reçoit `lang="fub"`;
- l’original est disponible au survol et au focus clavier;
- le popup dispose de focus visibles, contrastes élevés et régions `aria-live`;
- les caractères `ɓ`, `ɗ`, `ƴ`, `ŋ` sont encodés en UTF-8.

## 7. Permissions

```json
{
  "permissions": ["storage", "activeTab", "scripting"]
}
```

Le content script est déclaré pour les pages HTTP/HTTPS afin de démontrer la réutilisabilité. Aucune permission réseau, aucun service externe et aucun code distant ne sont employés.

## 8. Tests

### Unitaires

- détection FR/EN;
- égalité de sortie FUB entre les deux sources;
- protection des huit catégories de valeurs;
- préservation des espaces et montants;
- sept erreurs bilingues;
- couverture de la mémoire historique et de l’inventaire financier importé;
- contenu inédit par gabarit et glossaire.
- conservation exacte des codes API et identifiants techniques;
- sélection complète de page et de champ par `Ctrl+A`.

### Live

Le test Puppeteer charge réellement l’extension sur Safinum Pay :

- tableau de bord;
- contenu dynamique;
- frais et montant;
- bénéficiaire et champs;
- récapitulatif;
- reçu;
- bascule anglaise;
- contrôle des montants, compte, téléphone, référence et nom.
- page UBA Cameroon réelle et couverture de ses principaux libellés visibles.

## 9. Faisabilité

L’archive livrée reste très inférieure à 10 Mio. Elle fonctionne sans GPU,
serveur ou connexion de traduction. La conception peut être étendue à d’autres
langues camerounaises en remplaçant les fichiers de mémoire, le glossaire et
le modèle de langue.
