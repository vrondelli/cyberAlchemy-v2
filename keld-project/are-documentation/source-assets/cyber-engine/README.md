# Hero source artwork

Original transparent PNGs retained at full resolution. They are outside `public` so the
production package carries only the optimized runtime images. Original generation prompts
remain in `public/assets/cyber-engine/generation.json`.

Reproduce runtime assets with `node scripts/build-hero-assets.mjs`, using the existing
KELD video Sharp dependency. Source/output hashes and settings are in the public manifest.
This is format conversion and downsampling, with no new generated artwork.

## Open Questions

Display-quality and device validation are owned by `PAGE-PERFORMANCE.md` in the app root.
