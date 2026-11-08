# SCards — Project Plan

## Goal

An app to organize a physical trading card collection: know what you own, **where it physically is**, and check it from anywhere, including offline.

User stories:
- "I have too many cards, they are difficult to keep organized."
- "It's hard to retrieve a card I know I have."
- "I have no practical way to know what cards I have while I'm not at home."

First target game: **Riftbound**. Other games (e.g. MTG) may come later, so game-specific code stays isolated. We do **not** design for MTG's catalog size now.

## Key decisions

| Topic | Decision |
|---|---|
| Platforms | A single **PWA**: one web app for phone (Android + iPhone, installed to home screen) and desktop. No native app, no Apple fee, no Electron. |
| Scanner | **Not in v1.** Fast manual entry is the priority. A scanner can be added to the PWA later (camera + in-browser OCR) without changing the architecture. |
| Backend | **PocketBase** (single binary: SQLite + auth + REST API + realtime). Hosted by us for friends; anyone can self-host the same binary. |
| Offline | **Local-first.** The full Riftbound catalog and the user's collection are stored on the device. Search and browsing work fully offline; edits sync when online. |
| Catalog source | [OpenRift API](https://openrift.app/developers) `/api/v1/catalog` (free, no key, full catalog in one ~750 KB compressed response, EN/ZH/FR/KO). Imported into our own database by a script that sends a `User-Agent` with contact info and uses `ETag` caching. The app never calls the API directly. The importer is an adapter, so switching to Riot's official API later only means rewriting it. |
| Card images | Linked from the source rather than hosted (OpenRift asks not to mirror images in bulk). Long term, Riot's policy requires images and text to come from the **official Riot Riftbound API**. |
| Riot policy | Products serving players must be registered on the [Riot Developer Portal](https://developer.riotgames.com/policies/riftbound) (a prototype link is accepted). Must show Riot's "Legal Jibber Jabber" disclaimer, display official card text, never imply endorsement, and never store metagame stats (win rates etc.). |
| Languages | App UI translated from day one (all strings in translation files). Card language is a field on each collection entry. Card names can be stored per language. |

## Tech stack

- **Frontend:** SvelteKit (static/SPA mode) + `@vite-pwa/sveltekit` (service worker, manifest)
- **Local storage:** IndexedDB via Dexie.js (catalog + collection + outbox of pending changes)
- **Search:** in-memory fuzzy search over the catalog (MiniSearch or Fuse.js). About 1,000 cards is small enough to search entirely on the device.
- **i18n:** Paraglide (or i18next)
- **Backend:** PocketBase (auth, collection storage, catalog storage, sync endpoint)
- **Import job:** a small script (TS/Node) that pulls the catalog from Riftcodex and upserts it into PocketBase. Run whenever a new set releases.
- **Hosting (free):** the frontend is built as a static SPA and served by PocketBase itself (`pb_public/`), so there is only **one process to host**.
  - Primary: a machine at mom's place + **Cloudflare Tunnel**. In order of preference: the existing NAS (if it can run Docker) → an old Android phone (Termux) → buy the cheapest option (Pi Zero 2 W if it must use Wi-Fi, used thin client if it can be wired). Hosted at `scards.<your-domain>`. No port forwarding, free HTTPS, and the existing website on the domain is untouched.
  - Fallbacks: Oracle Cloud Always Free VM, PocketHost free tier, Azure for Students credit.
  - Local-first makes a weak server acceptable: if it's down, users still see and edit their collection, and changes sync later.
  - Backups: PocketBase's built-in backups, copied off the machine (e.g. Backblaze B2 free 10 GB, or another drive).

## Data model

```
Game          id, code ("riftbound"), name
Set           id, game, code, name, release_date
Card          id, game, canonical name, type, game_attributes (JSON)
Printing      id, card, set, collector_number, variant (normal/foil/alt-art/signed/...),
              rarity, image_url, game_attributes (JSON)
CardName      card, language, name                     -- localized names, searchable

User          (PocketBase auth)
Location      id, user, name, kind (binder/box/deck/other), parent (nullable)
CollectionEntry
              id, user, printing, language, finish, condition,
              quantity, location, notes, updated_at
```

- Shared fields (name, set, number, rarity, image) are real columns, so search, filters and entry modes are game-agnostic.
- Riftbound-only stats (energy, might, power, domain…) live in `game_attributes`. A small **per-game config** says which attributes to display and filter on.
- Adding a game later = **one importer + one config file**.

## Offline & sync

- On first launch (and when a catalog update is detected), download the full Riftbound catalog into IndexedDB. Afterwards, only download changes.
- Collection edits are written locally first and appended to an **outbox**. When online, the outbox is pushed to PocketBase, then remote changes are pulled.
- Conflict rule: **last write wins per collection entry** (using `updated_at`). Good enough for one user on a few devices.
- iOS caveat: Safari may delete storage for PWAs that aren't installed. Encourage installing to the home screen; the server copy is the backup.

## Fast collection entry (core UX)

Entering a whole collection the first time must be painless.

1. **Set checklist:** pick a set and see a grid of all its cards. Tap to add 1, long-press to set a quantity.
2. **Number entry:** pick a set once, then type collector numbers on the numeric keypad (`12, 45, 45, 201`).
3. **Keyboard search:** type a few letters, press Enter to add, repeat. Fuzzy matching, with recent sets ranked first.
4. **Sticky session settings:** language, condition, finish and **location** are set once per entry session and applied to every card added.
5. **Undo instead of confirmations**, plus a running counter ("142 cards added this session").
6. Later: **rough entry** ("~400 bulk commons, Box 4") and **CSV import** from other apps.

## Mobile polish (so the PWA doesn't look cheap)

- `display: standalone`, matching `theme-color`, proper icons and splash screen
- Mobile-first layout: bottom navigation, bottom sheets, large touch targets, nothing that only works on hover
- Respect safe areas (`env(safe-area-inset-*)`)
- An in-app "Add to Home Screen" guide for iPhone, since iOS never shows an install prompt

## Out of scope for v1

Card scanner · other games · prices / market value · trading between users · deck building · native apps

---

## Timeline

Rough estimates for a solo developer working evenings and weekends. Each phase ends with something you can try.

### Phase 0 — Setup & checks (a few days)
- ~~Choose the framework~~ → Svelte. ~~Pick the catalog source~~ → OpenRift.
- Set up the hosting: home machine + Cloudflare Tunnel on a subdomain (requires the domain's DNS to be on Cloudflare).
- Check that Riftcodex covers every current set, variant and language you need. If it doesn't, compare with Scrydex or the LoL wiki.
- Read Riot's fan content policy regarding card images.
- Create the git repo and the project skeleton (SvelteKit app, PocketBase folder, import script folder).

### Phase 1 — Catalog (≈1 week)
- Create the PocketBase schema: Game, Set, Card, Printing, CardName.
- Write the Riftcodex import script, run it, and spot-check the data (variants, collector numbers, images).
- ✅ *Milestone: the full Riftbound catalog is in your own database.*

### Phase 2 — App skeleton (≈1 week)
- Mobile-first layout, navigation, PWA manifest + service worker
- i18n set up with English + French
- Login / signup through PocketBase
- ✅ *Milestone: an installable, empty app on your phone.*

### Phase 3 — Offline catalog & search (≈1 week)
- Download the catalog into IndexedDB, with a check for catalog updates
- Fuzzy search, card detail page, browsing by set
- ✅ *Milestone: search every Riftbound card in airplane mode.*

### Phase 4 — Collection & locations (≈1–2 weeks)
- CRUD for locations (binders, boxes, decks, nesting)
- CRUD for collection entries, plus a collection view with filters (set, location, rarity…)
- Initially this saves directly to the server (online only).
- ✅ *Milestone: you can record your own cards and see where each one is.*

### Phase 5 — Fast entry modes (≈2 weeks)
- Sticky session settings, set checklist, number entry, keyboard search, undo, session counter
- ✅ *Milestone: entering a full binder takes minutes. Start using it for your real collection.*

### Phase 6 — Offline edits & sync (≈1–2 weeks)
- Write edits locally first, using the outbox, push/pull sync and last-write-wins
- Test: edit on the phone while offline, then on the desktop, and check that both converge
- ✅ *Milestone: the app works fully offline.*

### Phase 7 — Deploy & friends beta (≈1 week)
- Home server + PocketBase (serving the built frontend) + Cloudflare Tunnel on `scards.<your-domain>`, with off-machine backups
- iPhone install guide, polish on real devices (Android + iPhone)
- Register the app on the Riot Developer Portal and apply for a Riftbound API key; add the Legal Jibber Jabber disclaimer
- Invite your playgroup and collect feedback
- ✅ *Milestone: v1 in your friends' hands.*

**Total: roughly 2–3 months to v1.**

### After v1 (pick based on feedback)
- CSV import / export
- Rough bulk entry
- Self-hosting guide (a single binary + a short README)
- More UI languages and localized card names
- Card scanner
- A second game (MTG)
