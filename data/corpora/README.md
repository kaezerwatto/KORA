# Corpus financiers fournis au projet

Ce dossier conserve les deux fichiers transmis à KORA comme inventaires de
domaines. Ils ne constituent pas, à eux seuls, un corpus parallèle de
traduction.

| Fichier | Lignes | Entrées | SHA-256 |
|---|---:|---:|---|
| `corpus_terminologique_financier_volume_1.txt` | 1 247 | 220 termes, 58 exemples | `00fc1ce8ebc743df3d2f9b91c334979db8560c045463d928feac7068df8374ac` |
| `corpus_finance_transactionnelle_volume_2.txt` | 1 612 | 292 termes, 147 exemples | `ad29d42bf514432108a9f826a8022ed5219fe0e186a9fc5654b98098d3fc9b69` |

## Provenance et licence

Les fichiers ont été fournis à l’équipe KORA le 14 novembre 2026. Ils ne
déclarent ni auteur, ni URL d’origine, ni licence. Ils sont donc conservés dans
le dépôt pour la traçabilité du travail, mais ne sont pas présentés comme des
ressources linguistiques libres de tiers.

## Politique d’intégration

- Les définitions françaises servent à désambiguïser les concepts.
- Elles ne sont jamais traitées comme des exemples `fub`.
- Les 512 phrases de la matrice synthétique du volume 2 sont exclues de
  l’entraînement : 32 associent explicitement une réussite à une cause d’échec,
  et plusieurs autres contiennent des accords français incorrects.
- Les identifiants API, événements, codes HTTP et clés techniques restent
  inchangés dans les pages.
- Chaque équivalent `fub` porte un statut de provenance dans
  `financial-terminology-candidates.json`.
- Une formulation candidate n’est pas décrite comme validée tant qu’elle n’a
  pas fait l’objet d’une revue linguistique explicite.

`index.json` contient l’inventaire vérifiable des sections et des 512 libellés,
soit 504 concepts après déduplication. Il est régénéré par
`scripts/index_financial_corpora.mjs`, qui reconnaît une entrée uniquement
lorsqu’un libellé numéroté est suivi d’une ligne `Définition :`; les acronymes
et codes en majuscules ne sont donc plus confondus avec des sections.
