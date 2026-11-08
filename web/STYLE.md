# GeoSquid style guide

**Reference: Football Manager 24's interface, with much less information.** GeoSquid is a dark app shell with a sidebar, a top bar and square-edged panels. Calm and useful first, with a little squid personality.

Dark only. Mobile-first PWA; must also work well on desktop.

## Principles

1. **Less on screen.** Each panel answers one question. Hide what isn't needed yet: capitals are off by default, and details only appear after you select something.
2. **Panels, not cards.** Content lives in panels (see below). There are no floating rounded cards and no boxes inside boxes.
3. **One primary action per screen.** It's the pink Continue-style button in the top bar. Everything else is secondary.
4. **Squids, sparingly.** The logo appears in the sidebar or phone header and doubles as the loading spinner.
5. **Little motion.** Color transitions of 150 ms or less. The only animation is the squid spinner. Respect `prefers-reduced-motion`.

## Never

- Italic text, serif fonts
- Pills (chips, buttons or toggles shaped like pills), or large rounded corners. Panels and buttons use `rounded-panel` (3px)
- Gradients, glows, blur or glass, drop shadows
- Outlines around selected map shapes (selection fades the other shapes instead)
- Emoji or decorative icons, and empty states that are only a picture
- Every button styled as primary

## App shell (`src/routes/+layout.svelte`)

- **Desktop:** a fixed sidebar (`w-56`, `bg-deep`) with the logo, nav items (icon and label) and Settings at the bottom. The active item gets `bg-reef` and a 3px pink bar on its left. Pages that don't exist yet appear in `fog` with "SOON".
- **Phone:** the sidebar is hidden and a bottom tab bar shows the first 4 nav items. The active tab gets a 2px pink bar on top. Respect `env(safe-area-inset-bottom)`.

## Page header (`PageHeader.svelte`)

- Breadcrumbs (`text-xs text-mist`) above the page title (`text-2xl font-semibold`, display font).
- Desktop: back and forward arrows on the left. Phone: the squid logo.
- The right side holds the page's main action. The Continue button is `bg-squid text-on-squid`, display font, bold, uppercase.
- An optional row of **sub-tabs** below: display font, semibold, uppercase, with a 2px pink underline on the active tab.

## Panels (`Panel.svelte`)

- A `border-line` border, `bg-panel` body, and a title strip in `bg-panel-head` (title `text-[15px] font-semibold`, with an optional action on the right).
- Grid of panels: `gap-3 p-3`, with tight gaps like Football Manager.
- Inside a panel: big display-font figures (`font-display text-4xl font-bold`), rows separated by `divide-line`, and labels in `mist`.

## Tokens (`src/app.css`)

| Token                      | Use                                                 |
| -------------------------- | --------------------------------------------------- |
| `abyss`                    | app background between panels                       |
| `deep`                     | sidebar, top bar, bottom bar                        |
| `panel` / `panel-head`     | panel body / panel title strip                      |
| `reef`                     | hover, inputs, progress track, active nav item      |
| `line`                     | borders and dividers                                |
| `ink` / `mist` / `fog`     | main text / secondary text / disabled and hints     |
| `squid` (pink)             | primary button, active nav or tab, progress, "Next" |
| `kelp` / `coral` / `lilac` | correct / wrong / info                              |

## Type

- **Barlow Semi Condensed** (`font-display`): titles, panel titles, big numbers, tabs, buttons.
- **Barlow** (`font-sans`): everything else.
- Numbers that line up: `tabular-nums`.

## Map

- Region hues: North kelp green, Northeast coral, Center-West sand, Southeast sea blue, South lilac (see `brazil.ts`).
- Hover brightens a shape. Selection fades every other shape.
- State borders: `ink` at about 45% opacity, on top of the regions and area codes.

## Icons (`Icon.svelte`)

Line icons on a 24×24 grid, `stroke-width 1.75`, drawn in `currentColor`. To add an icon, add its paths to the `ICONS` list.
