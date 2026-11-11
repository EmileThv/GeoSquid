"""Builds the word list for sync codes ("boussole-cerisier").

Input:
  raw/lexique/Lexique383.tsv   Lexique 3.83 (see download.sh), CC BY-SA 4.0

Output:
  ../web/src/lib/server/sync-words.json   2048 common French nouns

A sync code is two of these words. 2048 × 2048 ≈ 4 million codes: with the
server allowing only a few failed guesses per hour, that's far too many to
try. The list is shared with the app under the same license as Lexique
(CC BY-SA 4.0), credited in the output file.

Rules for a word:
- a common noun, singular, its own lemma (no plurals or verb forms)
- 8 to 15 letters, letters only (no hyphen, no apostrophe)
- unique once accents are removed (codes are typed without accents)
- not on the BLOCKED list below (rude, sad, violent or sensitive words)
The 2048 most frequent (books + film subtitles) are kept.

Run with: npm run sync-words   (or: python3 build-sync-words.py)
"""

import csv
import json
import unicodedata
from pathlib import Path

HERE = Path(__file__).resolve().parent
SOURCE = HERE / "raw" / "lexique" / "Lexique383.tsv"
OUT = HERE.parent / "web" / "src" / "lib" / "server" / "sync-words.json"
COUNT = 2048

# Words (without accents) a sync code should never contain. A word is
# blocked if it equals one of these or starts with one of the STEMS.
BLOCKED = set("""
connerie salopard salopette emmerdeur emmerdement branleur couillon enculeur
crapule ordure saloperie excrement cadavre meurtre meurtrier assassin
assassinat massacre suicide execution bourreau tortionnaire torture genocide
terroriste terrorisme attentat explosion bombardement fusillade
prostituee prostitution maquereau proxenete drogue drogue cocaine heroine
toxicomane alcoolique ivrogne cancer leucemie maladie malade agonie
funerailles enterrement cercueil cimetiere fantome demon diable satan
cauchemar chagrin tristesse souffrance douleur misere pauvrete esclave
esclavage prisonnier prison detenu criminel criminalite delinquant voleur
violence violeur victime blessure blessee handicape infirme aveugle
juif juive musulman chretien catholique protestant religion allemand
anglais americain francais italien espagnol russe chinois japonais arabe
africain africaine immigre immigration etranger etrangere negre nazisme
nazi fasciste communiste socialiste politique president gouvernement
ministre depute election elections parlement policier gendarme militaire
soldat sergent caporal lieutenant capitaine colonel general commandant
divorce adultere maitresse amant amoureux sexualite nudite baiser
derriere poitrine excitation cocu vieillard vieillesse mademoiselle
monsieur madame
abattoir aberration abomination accouchement agresseur agression agressivite
algerien anarchiste andouille apocalypse arquebuse arrestation atrocite
autopsie autrichien avortement baionnette blaspheme braguette braquage
bresilien britannique calomnie calvaire cambriolage cambrioleur canaille
capitalisme carabine catechisme charogne christianisme clochard
cochonnerie communisme corniaud corruption coupable crucifix damnation
debauche decollete defaillance deshonneur desespere desespoir desolation
detonateur detonation detresse dictateur dictature disgrace dynamite
epidemie erection escroquerie europeen evangile explosif fanatique fantasme
fascisme fossoyeur foutaise gangster gonzesse grossesse guillotine
gynecologue hemorragie heretique homicide humiliation hypocrite hysterie
ignorant imbecile impuissance incapable infarctus infection infirmite
inquisition israelien jouissance kidnapping malediction malfaiteur malheureux
maquisard matraque mexicain micheton miserable mitraillette mitrailleur
morphine munition nationalisme obscenite overdose penetration perquisition
persecution pneumonie polonais portugais pourriture pradelle preservatif
prostitue psychopathe puanteur racaille rebellion reddition repression
republicain revolutionnaire sicilien socialisme sovietique supplice
synagogue torpille traumatisme trahison tuberculose vacherie virginite
virginie vulgarite mauviette hypocrisie insomnie migraine allergie
anesthesie thanksgiving soldatesque
barbarie bourrique cannibale diarrhee erotisme harcelement infidele
insurrection irlandais marxisme mercenaire ossement pouffiasse promiscuite
sacrilege tyrannie trouillard clandestinite psychiatrie mausolee perfidie
infraction guibolle proletariat democrate expulsion purgatoire perversion detournement
""".split())
STEMS = ("sex", "porn", "pedo", "pede", "homo", "lesb", "viol", "nazi", "suicid",
         "merd", "chi", "pisse", "pute", "putain", "bordel", "cul", "couill",
         "bite", "branl", "encul", "salop", "con", "crev", "mort", "tue", "tuer",
         "racis", "esclav", "terror", "bomb", "fusil", "pistolet", "revolver",
         "cocain", "hero", "drog", "alcool", "cancer", "sida", "chimio")

# Stems above that also start harmless words: those words stay allowed
ALLOWED = set("""
connaissance confiance conversation condition conscience construction
conference consequence contraire concours concert conseil conseiller
console consigne conflit confort confusion congres connexion conquete
contact conteneur continent contrat controle convoi copain couverture
contenu concierge concombre confiture confiserie constellation consultation
conteur contrebasse convive coquillage chirurgien chimiste chiffre
chiffon chimie chirurgie chiendent chicoree chignon chipolata culture
cultivateur culbute cuisine hirondelle heroisme mortier tuile tuyau
""".split())


def plain(word: str) -> str:
    """'éléphant' → 'elephant'"""
    return "".join(
        c for c in unicodedata.normalize("NFD", word) if unicodedata.category(c) != "Mn"
    )


def blocked(word: str) -> bool:
    p = plain(word)
    if p in ALLOWED:
        return False
    return p in BLOCKED or p.startswith(STEMS)


def main() -> None:
    freq: dict[str, float] = {}
    with SOURCE.open(encoding="utf-8") as f:
        for row in csv.DictReader(f, delimiter="\t"):
            w = row["ortho"]
            if row["cgram"] != "NOM" or row["islem"] != "1" or row["nombre"] == "p":
                continue
            if not (8 <= len(w) <= 15) or not w.isalpha() or not w.islower():
                continue
            if blocked(w):
                continue
            score = float(row["freqlemlivres"] or 0) + float(row["freqlemfilms2"] or 0)
            freq[w] = max(score, freq.get(w, 0))

    words: list[str] = []
    seen: set[str] = set()
    for w in sorted(freq, key=lambda w: (-freq[w], w)):
        if plain(w) in seen:
            continue
        seen.add(plain(w))
        words.append(w)
        if len(words) == COUNT:
            break
    assert len(words) == COUNT, f"only {len(words)} words"

    OUT.parent.mkdir(parents=True, exist_ok=True)
    data = {
        "source": "Lexique 3.83, http://www.lexique.org (New, Pallier et al.)",
        "license": "CC BY-SA 4.0",
        "words": sorted(words, key=plain),
    }
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=0) + "\n", encoding="utf-8")
    print(f"Done: {len(words)} words in {OUT.relative_to(HERE.parent)}")


if __name__ == "__main__":
    main()
