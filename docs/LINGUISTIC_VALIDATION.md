# Sources et validation linguistique

## Variété cible

KORA cible le fulfulde de l’Adamaoua, ISO 639-3 `fub`, écrit en caractères latins avec `ɓ`, `ɗ`, `ƴ`, `ŋ` et `ɲ`. Les corpus `ff`, `fuv`, `fuf` et `ffm` ne sont pas fusionnés silencieusement avec `fub`.

## Responsable de la validation linguistique

**M. Jean-Ernest SOUROUMBAI** assure la responsabilité de la validation linguistique du projet. Une formulation n’est marquée comme validée dans les données qu’après une revue explicite et traçable, phrase par phrase.

## Sources prioritaires

1. H. Tourneux et G. H. Konaï, *L’impact de la téléphonie mobile sur le fulfulde du Cameroun septentrional*, CC BY 4.0 — vocabulaire mobile et transferts d’argent local.
2. SIL, *English–Fulfulde Dictionary*, `fub`, 11 190 mots.
3. SIL, *Vocabulaire de base en quatre langues*, français–anglais–fulfulde Adamawa–wandala.
4. H. Tourneux et collaborateurs, dictionnaires du Diamaré et ressources grammaticales.
5. Mozilla Common Voice 27 `fub`, CC0 — contrôle orthographique et prononciation.
6. Manuel technique Peace Corps — uniquement comme inventaire de concepts financiers; ses formes maliennes ne sont pas reprises sans adaptation.

## Ressources évaluées mais non intégrées

- Flagship `francais-fufulde` : modèle camerounais, mais sorties très instables sur les libellés bancaires.
- DS4H `linguo_mt_en_fub` : BLEU publié 17,43, mais corpus non documenté.
- NLLB-200 : cible `fuv_Latn`, pas `fub`.
- Google Traduction : cinq réponses `ff` ont été relevées le 14 novembre 2026
  pour comparaison. Elles ne sont pas importées automatiquement, car la cible
  Google est le macrocode `ff` et non une garantie de variété `fub`.
- PanLex `fub` : 2 457 associations sens-expression et taille compatible, mais non embarqué. La licence officielle actuelle est CC BY-NC-SA 4.0 alors qu’un miroir annonce CC0; une autorisation écrite est nécessaire avant tout usage potentiellement commercial.
- Dictionnaire SIL `fub` : 11 190 entrées, mais son contrat interdit l’extraction et l’incorporation dans KORA sans autorisation écrite.
- Corpus Mozilla narratif NOODL : licence incompatible avec l’entraînement et les dérivés.
- Bible `fub` : protégée par droit d’auteur, non redistribuée.
- FredMike23 et TransFula : provenance ou qualité insuffisantes pour servir de vérité linguistique.

## Comparaison de cinq actions critiques

Les sorties d’une mémoire publique `ff` ont servi de comparaison, pas de source unique. Le macrocode `ff` ne garantit pas l’Adamawa `fub`; KORA vise donc une terminologie cohérente avec le contexte camerounais :

- « Effectuer un transfert » : référence `Waɗde mbayliigu`; KORA `Waɗugo transfeer`.
- « Confirmer le transfert » : référence `Tabintin jolngo ngoo`; KORA `Tabitin transfeer`.
- « Annuler » : référence `Willugo`; KORA `Haaytin`.
- « Vérifiez toujours le nom et le numéro du bénéficiaire… » : référence `Waɗde sahaa kala ƴeewto innde e limoore naftortooɗo oo hade maa tabitinde jolngo.`; KORA `Ƴeewto innde e lamba jaɓoowo sahaa fuu, hade maa tabitingo transfeer.`
- « Votre transfert a été envoyé avec succès. » : référence `Jaltugol maa neldaama no moƴƴi.`; KORA `Transfeer maa neldaama bee moƴƴere.`

Pour chaque concept, KORA privilégie cohérence, impératif clair et terminologie identique sur les cinq écrans. Les sorties modèles répétitives ou bibliques ont été rejetées.

Une deuxième comparaison vérifiable porte sur `compte courant`,
`bénéficiaire`, `solde insuffisant`, `transaction en attente` et
`transfert effectué`. Les réponses Google, les formes KORA et la décision
associée se trouvent dans
[`../data/corpora/google-ff-comparison.json`](../data/corpora/google-ff-comparison.json).
Les divergences confirment qu’une sortie `ff` ne doit pas être assimilée sans
revue à l’Adamawa `fub`.

## Corrections Adamawa intégrées

Les commandes et compléments verbaux gardent les formes Adamawa en `-go`
(`waɗugo`, `tabitingo`, `huutoreego`) à la place des infinitifs occidentaux
en `-de`. Les noms de concepts emploient la forme nominale en `-ugol` :
`Yoɓugol njulaagu` désigne le paiement marchand, tandis que `Yoɓugo
njulaagu` reste une instruction « payer le marchand ».

La note de revue linguistique fournie au projet le 14 novembre 2026 a entraîné
les corrections suivantes :

- `Compte bloqué` → `Konte uddaaɗo`;
- `Date de valeur` → `Ñalngu kiisaangu`;
- `Découvert autorisé` → `Kaalisi ɓeydaaɗi yamiraaɗi`;
- `Paiement récurrent` → `Yoɓugol lortotoongol`;
- `Paiement sans contact` → `Yoɓugol tawa meemaaka`;
- remboursement marchand → `Ruttinangol kaalisi`;
- remboursement de prêt → `Yoɓugol nyamaande`;
- rétrofacturation → `Ruttinangol kaalisi yoɓaaɗi`.

Ces corrections sont tracées dans les `sources` des entrées concernées. Elles
améliorent le corpus d’entraînement, mais les entrées qui étaient candidates
restent candidates jusqu’à une validation native explicite. `Kaalisi yonaa`
exprime « l’argent ne suffit pas »; la forme affirmative/future `yonay` est
interdite dans les alertes d’insuffisance. Valider et confirmer restent deux
actions distinctes : `jaɓugo` et `tabitingo`.

## Statuts terminologiques

- `attesté` : trouvé dans une source camerounaise `fub`;
- `recoupé` : présent dans plusieurs ressources fulfulde;
- `emprunt local` : mot technique francophone couramment intégré (`baŋki`, `telefon`, `transfeer`);
- `à valider` : formulation compositionnelle non encore relue par un locuteur.

## Limite

La validation automatique ne remplace pas un locuteur. Avant production, faire relire toutes les actions critiques et alertes par au moins deux locuteurs de l’Adamaoua, puis réaliser un test de compréhension sans montrer le texte français.
