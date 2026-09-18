# The illustrated legend

The six generated scenes are incorporated into the existing Keld institutional
site and its full-story reader. The store is still included.

## Sequence
1. The threshold — The workshop of Keld.
2. The archive — Hoarder of Secrets.
3. The forge — Cyber Blacksmith.
4. The unmade — Keeper of the Unmade.
5. The instruments — Tools for another mind.
6. The maker's mark — Even minds need tools.

The underlying imagery is the six previously generated illustrations, not new
product photography. Fictional devices depicted in the legend are not additional
products offered for sale. The legend remains labeled as original fiction.

## Interactions
- Six thumbnail chapter tabs; previous and next buttons stop at the endpoints.
- Arrow keys, Home and End on the tab strip.
- Horizontal touch gestures on scene images advance/back; vertical gestures
  are left to the browser for scrolling.
- View scene opens a native dialog with the complete, uncropped artwork,
  caption and previous/next controls. Escape or Close returns focus to the trigger.
- Read the illustrated legend opens the complete prose interleaved with six plates.
- No autoplay, ambient audio, scroll interception or forced animations.
- Every meaningful image has alternative text. Reduced motion is respected.

## Assets and edits
`assets/legend/*.webp` are optimized images (1672 x 941) and thumbnails. The full
set is approximately 1.54 MB before embedding. Images are loaded lazily where
appropriate; selecting a chapter asks the browser to load its image immediately.
The standalone editions embed all artwork and require no internet connection.
The modular entries use relative assets and can be served by a static host.

`index.template.html` contains the visible chapter and reading-room copy.
`assets/legend/chapters.json` records the editorial metadata for reference;
it is not fetched at runtime or automatically substituted by the build.
`assets/legend.css` styles the sequence and adds a narrow-screen header fix.
`assets/legend.js` handles chapter state, the viewer, touch and keyboard input.
`build.py` creates the modular entry points and three offline editions using
only the Python standard library.

## Preserved
`assets/shop-config.js`, `assets/shop.js`, `assets/shop.css`,
`shop.fragment.html`, `shop.dialogs.html`, `assets/app.js` and `assets/styles.css`
are byte-for-byte unchanged from the hidden-shelf storefront source.
Pricing, checkout safeguards, licensing content and downloadable-delivery mode
have not been changed by the illustrated-legend update.

The $200 default, $50–$1,000 accepted range, and intentional reveal of lower prices
are preserved. Payment and actual engine delivery remain unconnected.
