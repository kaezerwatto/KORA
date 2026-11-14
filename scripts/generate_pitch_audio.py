"""Generate the French narration used by the SAFINUM pitch video."""

from pathlib import Path

from gtts import gTTS


ROOT = Path(__file__).resolve().parent.parent
OUTPUT = ROOT / "submission" / "audio"

SEGMENTS = [
    (
        "01-probleme.mp3",
        """Au Cameroun, comprendre un solde, des frais ou une alerte de sécurité
        peut devenir difficile lorsque le service financier n’est disponible
        qu’en français ou en anglais. KORA répond à ce problème avec une
        extension Chrome qui traduit l’interface vers le fulfulde de
        l’Adamaoua, sans modifier le site.""",
    ),
    (
        "02-activation.mp3",
        """L’utilisateur ouvre cette popup volontairement simple et choisit
        Fulfulde. La traduction démarre immédiatement sur la page ordinaire.
        Tout s’exécute localement : aucun texte, aucune saisie et aucune donnée
        financière ne quittent l’appareil. Français ou English restaure le
        contenu original.""",
    ),
    (
        "03-integrite.mp3",
        """Voici le tableau de bord Safinum traduit. Le solde de deux cent
        cinquante mille francs C F A, le numéro de compte, les dates et les
        transactions sont strictement identiques. À l’étape des frais, KORA
        traduit les explications, mais les montants et les calculs restent
        entièrement gérés par Safinum.""",
    ),
    (
        "04-dynamique.mp3",
        """Le défi exige aussi de gérer le contenu ajouté après le chargement.
        Nous injectons volontairement solde insuffisant avec deux fautes.
        KORA détecte la mutation, rapproche le texte d’un sens financier unique
        et affiche Kaalisi yonaa. En cas d’ambiguïté, l’extension conserve
        l’original plutôt que d’inventer.""",
    ),
    (
        "05-architecture.mp3",
        """Le fonctionnement repose sur une chaîne explicable. Le content
        script observe le D O M. Le moteur protège d’abord les noms, numéros,
        devises, montants et références. Les mémoires françaises et anglaises
        fournissent ensuite le sens. Enfin, les modèles locaux classent
        uniquement des formulations sûres et fluides en fulfulde.""",
    ),
    (
        "06-modele-tests.mp3",
        """KORA embarque cinq cent quatre concepts financiers, un correcteur
        testé sur mille deux cent cinquante-deux fautes et un modèle neuronal
        quantifié de cent quatre-vingt-cinq mille cent vingt paramètres, avec
        repli n-gramme. Vingt-sept tests unitaires, les tests popup, pages,
        Safinum et U B A vérifient le comportement et l’intégrité.""",
    ),
    (
        "07-conclusion.mp3",
        """Le prototype est reproductible depuis le dépôt public et fonctionne
        sans serveur, sans G P U, sans A P I de traduction et sans télémétrie.
        KORA rend la finance numérique plus accessible tout en gardant les
        valeurs sensibles sous le contrôle de l’utilisateur. KORA : traduire
        les mots, protéger l’opération.""",
    ),
]


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    for filename, text in SEGMENTS:
        cleaned = " ".join(text.split())
        gTTS(text=cleaned, lang="fr", slow=False).save(str(OUTPUT / filename))
        print(f"Generated submission/audio/{filename}")


if __name__ == "__main__":
    main()
