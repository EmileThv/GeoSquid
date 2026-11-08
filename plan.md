# GeoSquid — Project Plan

## Goal

Help an experienced GeoGuessr player learn **country-specific regional knowledge**: states, area codes, postcodes and visual clues (poles, vegetation, lamps…). Today this knowledge only exists as long pages, lists and images, like Plonk It.

Two stages:
1. **Explorer:** all the data of a country, easy to browse. Click a state on the map or in a list to see everything about it, sort and filter it, and search the clues.
2. **Course:** a Duolingo-style spaced-repetition course built on the same data. Each country is its own course, the way each language is in Duolingo.

First country: **Brazil**. Scope: everything on the Plonk It Brazil page.

Private, non-commercial use for now.

## Key decisions

| Topic | Decision |
|---|---|
| Platform | One **Svelte PWA**, for phone and desktop. |
| Backend | **None for now.** All content is static files shipped with the app. Course progress is stored on the device. A sync backend (PocketBase) can come later if needed. |
| Hosting | Free static hosting (Cloudflare Pages). The Plonk It images make it non-public, so put it behind **Cloudflare Access** (free) so only you and your friend can open it. |
| Clue content | Plonk It, licensed **CC BY-NC-SA 4.0**: credit Plonk It, stay non-commercial, and share our derived data under the same license. Third-party maps embedded in their page (e.g. the GfK postcode map) are **not** reused. |
| Facts | Built from official sources rather than Plonk It's images: **IBGE** (states, municipalities, outlines), **ANATEL** (area codes per municipality), **Correios** / open datasets (postcodes). |
| Multi-country | Every country uses the same data format, in its own folder. Adding a country means adding data, not code. |

## Tech stack

- **Frontend:** SvelteKit in static mode (`adapter-static`), TypeScript, `@vite-pwa/sveltekit`
- **Map:** country outlines stored as **TopoJSON**, drawn as SVG with **d3-geo** (it only handles the projection math; Svelte draws the `<path>` elements). No map tiles and no MapLibre: we only need flat shapes you can click.
- **Search:** MiniSearch (full-text over clues and facts)
- **Data preparation:** **mapshaper** (command line) to simplify and merge shapes, plus small scripts (Node or Python) that turn the raw sources into the app's JSON
- **Course (stage 2):** `ts-fsrs` (the FSRS spaced-repetition algorithm), with progress stored in IndexedDB (Dexie)

## Data model (per country)

```
data/brazil/
  country.json     name, macro-regions (N, NE, CW, SE, S)
  divisions.json   27 states: code (SP), name, macro-region, capital,
                   area codes (DDD), postcode ranges (CEP)
  capitals.json    27 state capitals: name, state, lat/lon, DDD → drawn as dots
  layers/
    states.topojson    state outlines              (id = state code)
    regions.topojson   macro-region outlines       (merged from states)
    ddd.topojson       area-code areas             (municipalities merged by DDD, see below)
  clues.json       visual clues: id, category, text, notes, image,
                   states: [{ code, strength: exclusive | common | rare }],
                   regions, source + license
  images/          clue photos
```

- **Municipalities are never shown in the app.** They are only raw material: each one is tagged with its area code, then neighbors with the same code are merged into one shape. The app only gets the 67 merged area-code shapes.
- **Capitals are dots**, placed from their coordinates. They need no outline.
- **Postcodes are list data, not a map layer:** each state's CEP prefix ranges, shown in the tables and the detail panel.
- A **layer** is a set of clickable areas. Each layer type (state, area code, postcode) uses the same component.
- A clue's **`strength` per state** matters: "exclusive to Pernambuco" and "rarely in Sergipe" teach very different things. This is set by hand during the clue review.
- The first draft of `clues.json` exists already: `notes/brazil-clues.json` (105 clues, state tags auto-detected → **needs review**).

## Stage 1: Explorer

### Map
- Brazil map with a **layer switcher**: states / macro-regions / area codes, plus the **27 capitals as dots** (toggle)
- Hover → name and code; click → opens the detail panel
- Optional labels on each area (state code, DDD number, CEP prefix)
- When a clue is selected, its states are highlighted on the map, colored by strength

### Lists
- **States table:** name, code, region, capital, area codes, postcode ranges, number of clues. Sortable by every column; filter by region.
- **Area codes table / postcodes table:** code → state(s), main city. Clicking a row highlights the area on the map.
- **Clue browser:** a grid of photo cards. Filter by category, state, region and strength; full-text search.

### State detail panel
- Every fact about the state, plus all its clues grouped by category
- Map and list stay in sync: selecting in one highlights in the other

### Other
- The selection is kept in the URL (`/brazil?state=PE&layer=ddd`), so you can send a link to an exact view
- Works on a phone: map on top, a bottom sheet for details

## Stage 2: Course

- **Course = country. Units = macro-regions** (Southeast, South, …), then mixed review units.
- **Exercise types**, all generated from the data:
  - State highlighted → name / code (multiple choice → typing)
  - Name or code → click on the map
  - "Is this state in the Northeast?" (yes/no)
  - Area code → click the area / pick the state
  - Postcode prefix → state
  - Clue photo → which state(s) or region
  - Telling apart similar clues (e.g. insulator types)
- **FSRS** schedules every fact and clue individually. Mistakes come back sooner. Daily goal, streak, and progress per unit.
- Your friend is already good, so add a **placement test** per unit to skip what he already knows.

---

## Timeline

Rough estimates for evenings and weekends. Each phase ends with something you can see.

### Phase 0: Setup & raw data (≈1 week)
- ✔ Git repo, SvelteKit project, folder structure (`web/`, `data-prep/`, `notes/`)
- ✔ Raw sources downloaded (`data-prep/download.sh`): IBGE outlines, municipality → DDD + capitals (kelvins/Municipios-Brasileiros), municipality → CEP ranges (98.5% coverage)
- Play with mapshaper (`npm run gui` in `data-prep/`): load the states, look at their attributes, simplify them
- ✅ *Milestone: all raw data on disk, and you know what's in it.*

### Phase 1: Data preparation (≈1–2 weeks)
- Build `states.topojson` and `regions.topojson`
- Join the DDD to municipalities, then merge by DDD → `ddd.topojson` (67 shapes)
- Extract the 27 capitals → `capitals.json`
- Summarize CEP ranges per state, then generate `divisions.json`
- **Clue review with your friend:** fix the state tags and set the strength of each one in `clues.json`. Copy the images.
- ✅ *Milestone: `data/brazil/` complete and checked.*

### Phase 2: The map (≈1–2 weeks) ✔ done (states, regions, area codes, capitals)
- Draw the states layer as SVG (d3-geo projection + Svelte `{#each}` over paths)
- Hover, click, selection; layer switcher; labels
- ✅ *Milestone: click any state, area code or postcode area on a map you drew.*

### Phase 3: Lists & detail panel (≈1–2 weeks)
- Sortable, filterable tables; state detail panel; map ↔ list sync; selection in the URL
- ✅ *Milestone: every fact is two clicks away.*

### Phase 4: Clue browser (≈1 week)
- Photo grid, filters, full-text search, highlight a clue's states on the map
- ✅ *Milestone: the Plonk It page, but searchable and on a map.*

### Phase 5: Deploy the explorer (a few days)
- PWA manifest, mobile layout, Cloudflare Pages + Access, Plonk It attribution and license notice
- ✅ *Milestone: your friend uses the explorer. Collect feedback before starting the course.*

### Phase 6: Course engine (≈2–3 weeks)
- Exercise generators from the data, the lesson screen, FSRS scheduling, progress in IndexedDB
- ✅ *Milestone: one complete unit (Southeast) playable.*

### Phase 7: Full Brazil course (≈2 weeks)
- All units, mixed reviews, placement tests, streak/daily goal, polish
- ✅ *Milestone: your friend trains Brazil daily.*

**Total: roughly 3 months to a full Brazil course; the explorer is usable after ~6–8 weeks.**

### Later
- More countries (same format: new data folder + one prep script)
- Sync progress across devices (PocketBase)
- Ask Plonk It about going public
