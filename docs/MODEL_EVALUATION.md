# Évaluation des moteurs de traduction

Date : 14 novembre 2026. Machine : CPU, 8 Go de RAM, sans GPU.

## Contrainte de livraison

Le paquet Chrome doit rester inférieur à 10 Mo et le protocole interdit de collecter, stocker ou transmettre les données affichées. Aucun modèle neuronal de traduction générale évalué ne tient dans cette limite :

- Flagship `francais-fufulde` int8 : environ 78 Mo.
- DS4H `linguo_mt_en_fub` : environ 312 Mo en FP32.
- NLLB-200 600M ONNX quantifié : environ 895 Mo et cible `fuv`, pas `fub`.
- M2M-100 quantifié : environ 632 Mo et cible le macrocode `ff`.

Les grands modèles neuronaux ont donc été utilisés seulement hors extension,
sur des phrases publiques, comme outils de comparaison. KORA livré n’emploie
aucun proxy ni service distant. Il embarque son propre réseau neuronal `fub`
de 192 864 paramètres, limité à la prédiction du mot suivant et au classement
de formulations dont le sens est déterminé en amont. Un n-gramme compact sert
de repli.

## Évaluation du petit réseau KORA

Le découpage est fait par phrase : 107 phrases Common Voice sont tenues hors
entraînement. Les 262 formulations historiques de la mémoire KORA et les 386 formulations
terminologiques candidates sont utilisées uniquement dans l’entraînement et
ne gonflent pas les métriques de validation. Les candidates ont un poids
inférieur aux formulations historiques de la mémoire KORA.

- architecture : contexte de trois mots, embeddings 24, couche tanh 96;
- quantification : poids int8, biais float32;
- vocabulaire neuronal : 1 536 unités;
- taille générée : environ 273 Kio avec vocabulaire et métadonnées;
- exactitude top-1 int8 : 14,6 %;
- exactitude top-5 int8 : 34,0 %;
- paramètres : 192 864;
- arrêt anticipé : époque optimale 2, arrêt après 8 époques sur un maximum de 40;
- graine reproductible : 2026.

Ces résultats évaluent la prédiction du prochain mot, pas la fidélité d’une traduction. Le réseau n’a pas l’autorité d’accepter une phrase et ne peut contourner ni le verrou sémantique ni la conservation des valeurs.

## Recherche d’architecture

Les variantes ont été entraînées avec la même graine, le même découpage et le
même arrêt anticipé. Résultats top-1 / top-5 observés :

- contexte 2, couche 64, vocabulaire 2 048 : 12,7 % / 28,3 %;
- contexte 3, couche 64, vocabulaire 2 048 : 12,5 % / 28,2 %;
- contexte 2, couche 96, vocabulaire 2 048 : 11,4 % / 27,7 %;
- contexte 3, couche 96, vocabulaire 2 048 : 12,0 % / 29,1 %;
- contexte 3, couche 128, vocabulaire 2 048 : 10,2 % / 28,9 %;
- embeddings 32, couche 96, vocabulaire 2 048 : 12,2 % / 25,7 %;
- contexte 3, couche 96, vocabulaire 1 792 : 11,3 % / 31,5 %;
- configuration retenue, vocabulaire 1 536 : 14,6 % / 34,0 %.

La configuration retenue dépasse donc les anciennes métriques KORA tout en
restant très petite. Les 504 concepts restent couverts par la mémoire exacte;
le vocabulaire neuronal n’a pas besoin de dupliquer chaque code ou emprunt
technique pour garantir leur traduction.

## Preuve d’exécution dans le produit

Le réseau n’est pas seulement livré comme fichier. Le chemin exécuté est :

1. `translateText` produit un candidat dont le sens et les valeurs sont déjà contrôlés;
2. `scoreFubFluency` appelle `scoreNeuralFub`;
3. l’inférence JavaScript décode les poids int8 et calcule la distribution du mot suivant;
4. le score neuronal compte pour 80 % du score de fluidité, avec 20 % de repli n-gramme;
5. `rankFubCandidates` trie uniquement des candidats déjà sûrs.

La commande réelle est :

```bash
npm run model:demo
```

Extraits observés sur les poids embarqués :

```text
o → wi'i, wii, ɗon
transfeer maa → yettaama, neldaama
kaalisi → gonɗi, yonaa
Votre paiement de 25 000 FCFA a été refusé.
→ Yoɓugol maa 25 000 FCFA salaama.
Le transfert n'a pas échoué.
→ original conservé
```

`npm test` exécute aussi directement le réseau, vérifie ses métadonnées, ses prédictions, le classement de fluidité et le rejet d’une séquence inconnue. Les tests navigateur exécutent ensuite ce même bundle sur des textes statiques et ajoutés dynamiquement.

## Comparaison sur cinq actions critiques

| Source | Sortie Flagship/DS4H observée | Référence externe `ff` | Décision KORA |
|---|---|---|---|
| Confirmer le transfert | répétition incohérente (`Ndaa koo moy…`) | `Tabintin jolngo ngoo` | `Tabitin transfeer` |
| Solde insuffisant pour effectuer ce transfert | sens incertain (`Balɗe ɗuue…`) | `Kaalis ina ŋakki…` | `Kaalisi gonɗi e konte yonaa ngam transfeer oo.` |
| Votre transfert a été envoyé avec succès | contresens religieux | `Jaltugol maa neldaama no moƴƴi.` | `Transfeer maa neldaama bee moƴƴere.` |
| Ne partagez jamais votre code secret | répétition et contresens religieux | `Hoto meeɗ renndude kode maa sirlu.` | `Taa meeɗu senndugo kod sirri maa.` |
| Vérifiez les frais avant de confirmer | phrase sans frais ni confirmation | `Ƴeewto njoɓdi ndii hade maa tabitinde.` | `Ƴeewto musakaaji hade maa tabitingo.` |

Une comparaison Google Translate vers `ff` a ensuite abouti pour cinq
libellés. Les réponses brutes et les décisions sont archivées dans
`data/corpora/google-ff-comparison.json`. Elles ne sont pas utilisées pour
entraîner ni alimenter automatiquement KORA : `ff` est un macrocode et ne
garantit pas la variété camerounaise `fub`. La colonne « Référence externe
`ff` » provient d’une mémoire publique distincte, utilisée seulement comme
contrepoint linguistique. Aucun de ces services n’est intégré ni requis à
l’exécution.

## Résultats

### Flagship `francais-fufulde`

- Avantage : petit modèle camerounais et exécution CPU.
- Échec : répétitions longues, nombreux contresens et forte empreinte de textes religieux.
- Conclusion : impropre à une action financière où une erreur est majeure.

### DS4H `linguo_mt_en_fub`

- Avantage : cible déclarée `fub`, BLEU publié 17,43.
- Échec : les cinq sorties critiques sont incorrectes ou incomplètes; corpus d’entraînement non documenté.
- Conclusion : exclu du produit.

### Références `ff`

Une mémoire publique a fourni des candidats grammaticalement plus cohérents, mais elle vise le macrocode `ff`, pas nécessairement l’Adamawa `fub`. Ces candidats ont seulement servi à confronter le vocabulaire. Les actions critiques ont ensuite été adaptées au vocabulaire camerounais sourcé et verrouillées dans la mémoire locale.

## Choix final

La solution sous 10 Mo la plus sûre reste déterministe pour le sens, avec un classement neuronal pour la fluidité :

1. mémoires FR/EN → FUB pour Safinum et les intentions web/financières courantes;
2. gabarits qui protègent les valeurs variables;
3. glossaire compositionnel exigeant 100 % de couverture pour le contenu financier critique et 80 % pour le reste;
4. classement neuronal, puis repli n-gramme, des seuls candidats déjà sûrs;
5. conservation de l’original si la confiance ou l’intégrité est insuffisante.

Ce choix privilégie l’intégrité et l’absence de contresens plutôt qu’une couverture artificielle produite par un modèle non fiable.
