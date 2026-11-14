# Évaluation des moteurs de traduction

Date : 14 novembre 2026. Machine : CPU, 8 Go de RAM, sans GPU.

## Contrainte de livraison

Le paquet Chrome doit rester inférieur à 10 Mo et le protocole interdit de collecter, stocker ou transmettre les données affichées. Aucun modèle neuronal de traduction générale évalué ne tient dans cette limite :

- Flagship `francais-fufulde` int8 : environ 78 Mo.
- DS4H `linguo_mt_en_fub` : environ 312 Mo en FP32.
- NLLB-200 600M ONNX quantifié : environ 895 Mo et cible `fuv`, pas `fub`.
- M2M-100 quantifié : environ 632 Mo et cible le macrocode `ff`.

Les grands modèles neuronaux ont donc été utilisés seulement hors extension, sur cinq phrases publiques, comme outils de comparaison. KORA livré n’emploie aucun proxy ni service distant. Il embarque son propre réseau neuronal `fub` de 77 104 paramètres, limité à la prédiction du mot suivant et au classement de formulations déjà validées sémantiquement. Un n-gramme compact sert de repli.

## Évaluation du petit réseau KORA

Le découpage est fait par phrase : 107 phrases Common Voice sont tenues hors entraînement. Les formulations produit relues sont utilisées uniquement dans l’entraînement et ne gonflent pas les métriques de validation.

- architecture : contexte de deux mots, embeddings 24, couche tanh 48;
- quantification : poids int8, biais float32;
- taille générée : environ 114 Kio avec vocabulaire et métadonnées;
- exactitude top-1 int8 : 13,4 %;
- exactitude top-5 int8 : 32,6 %;
- paramètres : 77 104;
- graine reproductible : 2026.

Ces résultats évaluent la prédiction du prochain mot, pas la fidélité d’une traduction. Le réseau n’a pas l’autorité d’accepter une phrase et ne peut contourner ni le verrou sémantique ni la conservation des valeurs.

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

`npm test` exécute aussi directement le réseau, vérifie ses métadonnées, ses prédictions, le classement de fluidité et le rejet d’une séquence inconnue. Les tests navigateur exécutent ensuite ce même bundle sur des textes statiques et injectés.

## Comparaison sur cinq actions critiques

| Source | Sortie Flagship/DS4H observée | Référence externe `ff` | Décision KORA |
|---|---|---|---|
| Confirmer le transfert | répétition incohérente (`Ndaa koo moy…`) | `Tabintin jolngo ngoo` | `Tabitin transfeer` |
| Solde insuffisant pour effectuer ce transfert | sens incertain (`Balɗe ɗuue…`) | `Kaalis ina ŋakki…` | `Kaalisi gonɗi e konte yonaa ngam transfeer oo.` |
| Votre transfert a été envoyé avec succès | contresens religieux | `Jaltugol maa neldaama no moƴƴi.` | `Transfeer maa neldaama bee moƴƴere.` |
| Ne partagez jamais votre code secret | répétition et contresens religieux | `Hoto meeɗ renndude kode maa sirlu.` | `Taa meeɗu senndugo kod sirri maa.` |
| Vérifiez les frais avant de confirmer | phrase sans frais ni confirmation | `Ƴeewto njoɓdi ndii hade maa tabitinde.` | `Ƴeewto musakaaji hade maa tabitingo.` |

La tentative de comparaison avec Google Traduction a reçu HTTP 429; aucune sortie Google n’est donc revendiquée. La colonne « Référence externe `ff` » provient d’une mémoire publique distincte, utilisée seulement comme contrepoint linguistique. Aucun de ces services n’est intégré ni requis par KORA.

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
