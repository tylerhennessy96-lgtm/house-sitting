# 5 Southerton — house sitting

A one-page site for whoever is looking after the house, covering
**Fri 31 July – Mon 31 August 2026**.

Open it, and it shows what needs doing today. Arrows, arrow keys, or a swipe
move between days, and the calendar jumps to any day of the stay.

## Files

| File | What it is |
|---|---|
| `index.html` | The page — all the wording lives here |
| `styles.css` | Styling (light and dark mode) |
| `app.js` | Dates, tasks, ticking, saving |

No build step, no dependencies. Open `index.html` in a browser and it works.

## Publishing to GitHub Pages

```bash
cd "5 Southerton"
git init
git add .
git commit -m "House sitting site for 5 Southerton"
git branch -M main
git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
git push -u origin main
```

Then on GitHub: **Settings → Pages → Source: Deploy from a branch → `main` / `root` → Save.**

After a minute or two it's live at
`https://YOUR-USERNAME.github.io/YOUR-REPO/`.

Note that a free GitHub Pages site is **public** — anyone with the link can
read it, and the phone number is on the page. If you'd rather it weren't
public, either remove the number from the "If you need me" section of
`index.html` and text it separately, or host it somewhere private instead.

## Changing things

**Wording** — all in `index.html`. The house notes are the `<details>` blocks
near the bottom; edit the text between the tags.

**Dates** — top of `app.js`:

```js
const START = new Date(2026, 6, 31);  // months are 0-indexed: 6 = July
const END   = new Date(2026, 7, 31);
```

**Which day the indoor plants get watered** — also top of `app.js`.
`0` is Sunday, `1` Monday, and so on:

```js
const INDOOR_PLANT_WEEKDAY = 0;
```

**Daily tasks** — the `tasksFor()` function in `app.js`. Each task is a
`title`, a `sub` line, and an `id` that must stay unique.

**Notes on particular days** — the `DAY_NOTES` object in `app.js`, keyed by
date:

```js
'2026-08-14': 'Bins go out tonight.'
```

## Ticks

Ticks are saved in the browser's own storage, on the device doing the ticking.
They're a memory aid for the sitter — they don't sync anywhere and you won't
see them from your phone. Clearing site data, or using a different browser or
device, starts fresh. There's a "Reset all ticks" button at the bottom.

If a day rained, the toggle under the tasks marks the outdoor watering as
skipped rather than outstanding.
