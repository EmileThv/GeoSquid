"""Builds the app's clue data for Brazil.

Inputs:
  ../notes/brazil-clues.json   clue texts extracted from the saved Plonk It page
  ../notes/GeoSquid            the saved Plonk It page itself (to find each photo's sizes)
  ../notes/GeoSquid_files/     the photos
  brazil-clue-tags.json        hand-reviewed state/region tags + strength

Output (in ../web/static/data/brazil/):
  clues.json                   the clues with their tags
  clues/<id>.webp              one photo per clue, ~800px wide
                               (clues.json has each one's width and height)

Run with: npm run clues   (or: python3 build-clues.py)
"""

import json
import re
import shutil
from pathlib import Path

from PIL import Image

HERE = Path(__file__).resolve().parent
NOTES = HERE.parent / "notes"
OUT = HERE.parent / "web" / "static" / "data" / "brazil"

# Images on the Plonk It page that come from third parties (not covered by
# Plonk It's license): the text of these clues is kept, the image isn't.
THIRD_PARTY_IMAGES = {"cepcodes", "brasil-c-c3-b3digos-de-c3-a1rea-ddd"}
TARGET_WIDTH = 800
STRENGTHS = {"exclusive", "common", "rare"}
STATES = set("AC AL AP AM BA CE DF ES GO MA MT MS MG PA PB PR PE PI RJ RN RS RO RR SC SP SE TO".split())
REGIONS = {"N", "NE", "CO", "SE", "S"}

extracted = json.loads((NOTES / "brazil-clues.json").read_text(encoding="utf-8"))
tags = json.loads((HERE / "brazil-clue-tags.json").read_text(encoding="utf-8"))
tags.pop("_about", None)

# Every clue needs a reviewed tag entry, and every tag entry a clue
ids = [c["id"] for c in extracted["clues"]]
missing, unknown = set(ids) - set(tags), set(tags) - set(ids)
assert not missing, f"clues without tags: {sorted(missing)}"
assert not unknown, f"tags for unknown clues: {sorted(unknown)}"

# Each <img> on the page lists all sizes of the same photo in its srcset:
# "file_002.webp 450w, file_004.webp 600w, …". Map displayed file → sizes.
html = (NOTES / "GeoSquid").read_text(encoding="utf-8")
sizes: dict[str, list[tuple[int, str]]] = {}
for srcset, src in re.findall(r'<img srcset="([^"]+)" src="([^"]+)"', html):
    options = []
    for part in srcset.split(","):
        path, width = part.strip().rsplit(" ", 1)
        options.append((int(width.rstrip("w")), Path(path).name))
    sizes[Path(src).name] = sorted(options)


def pick(src: str) -> str:
    """The smallest size at least TARGET_WIDTH wide (else the largest)."""
    options = sizes.get(src, [(0, src)])
    wide_enough = [o for o in options if o[0] >= TARGET_WIDTH]
    return (wide_enough[0] if wide_enough else options[-1])[1]


(OUT / "clues").mkdir(parents=True, exist_ok=True)
for old in (OUT / "clues").glob("*.webp"):
    old.unlink()

clues = []
for c in extracted["clues"]:
    states, regions = {}, {}
    for key, strength in tags[c["id"]].items():
        assert strength in STRENGTHS, (c["id"], strength)
        if key.startswith("@"):
            assert key[1:] in REGIONS, (c["id"], key)
            regions[key[1:]] = strength
        else:
            assert key in STATES, (c["id"], key)
            states[key] = strength

    image, image_size = None, None
    if c["id"] not in THIRD_PARTY_IMAGES:
        source = NOTES / "GeoSquid_files" / pick(c["image"])
        if source.exists():
            shutil.copyfile(source, OUT / "clues" / f"{c['id']}.webp")
            image = f"clues/{c['id']}.webp"
            # Width and height, so the app can reserve the photo's space
            # before it arrives (no text jumping down)
            with Image.open(source) as im:
                image_size = list(im.size)

    clues.append(
        {
            "id": c["id"],
            "category": c["category"],
            "text": c["text"],
            "note": c["notes"] or None,
            "image": image,
            "imageSize": image_size,
            "states": states,
            "regions": regions,
        }
    )

data = {
    "source": "https://www.plonkit.net/brazil",
    "license": "CC BY-NC-SA 4.0",
    "attribution": "Plonk It",
    "clues": clues,
}
(OUT / "clues.json").write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")

with_images = sum(1 for c in clues if c["image"])
tagged = sum(1 for c in clues if c["states"] or c["regions"])
size = sum(f.stat().st_size for f in (OUT / "clues").glob("*.webp")) / 1e6
print(f"{len(clues)} clues ({tagged} tied to states/regions), {with_images} photos, {size:.1f} MB")
