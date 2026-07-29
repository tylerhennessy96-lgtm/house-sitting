# House sitting

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
| `door-operation.mp4` | Short clip of the front door being opened and locked |
| `door-poster.jpg` | Still frame shown before that video is played |
| `feeder-operation.mp4` | Clip of the automatic fish feeder being set up |
| `feeder-poster.jpg` | Still frame shown before that video is played |

No build step, no dependencies. Open `index.html` in a browser and it works.

## Before adding any phone video

**Phone videos carry the GPS coordinates of where they were filmed.** The
original `door operation.mov` had this house's location written into it, so
committing it as-is would have published the address to a public repo.

`door-operation.mp4` is a re-encode with that metadata stripped:

```bash
avconvert --preset Preset640x480 --multiPass \
  --source "door operation.mov" --output door-operation.mp4 --replace
```

`avconvert` filters privacy-sensitive metadata by default — don't pass
`--disableMetadataFilter`. To check what a file is carrying:

```bash
mdls "some video.mov" | grep -iE "latitude|longitude"
```

`.mov` files are gitignored so the originals can't be committed by accident.
Both source clips carried the same coordinates.

The re-encodes are also far smaller (26 MB → 6 MB, 41 MB → 5.6 MB). For
anything longer, `shrink.swift`-style export with a `fileLengthLimit` gives
a predictable size where the fixed presets don't:

```swift
let export = AVAssetExportSession(asset: asset,
                                  presetName: AVAssetExportPreset640x480)!
export.fileLengthLimit = 5_500_000
export.metadata = []                       // drop all source metadata
export.shouldOptimizeForNetworkUse = true  // start playing while downloading
```

**Let the preset do the scaling.** Building an
`AVMutableVideoComposition(propertiesOf:)` and then setting a smaller
`renderSize` does *not* scale the picture down — the layer instructions still
map to the source's full frame, so the output is **cropped** to that window.
It looks like a zoomed-in video. This bit us once; the giveaway was that the
poster (taken from the original) showed a wider shot than the video itself.

After re-encoding, always compare a frame from the middle of both files:

```bash
# same timestamp from source and output — they should frame identically
swift attimes.swift "source.mov"  ./out_orig 10.0
swift attimes.swift "encoded.mp4" ./out_enc  10.0
```

Both videos use `preload="none"` with a `poster`, so a visitor downloads only
the still (~30 KB) unless they press play. Keep it that way — the page is
otherwise well under 100 KB.

**Also check what's in shot.** These were filmed indoors, and the feeder clip
has a framed family photograph visible at the start and end. That was a
deliberate call to publish, not an oversight — worth re-checking before
swapping in any replacement footage.

## The live site

<https://tylerhennessy96-lgtm.github.io/house-sitting/>

Served by GitHub Pages from `main` at the repo root. To change anything, edit
and push — the rebuild takes a minute or two:

```bash
git add -A
git commit -m "what changed"
git push
```

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
