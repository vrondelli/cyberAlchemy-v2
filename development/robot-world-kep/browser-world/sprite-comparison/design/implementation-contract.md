# P00 implementation contract

## Renderer handle

The new renderer exports createSpriteWorld(options) and returns a Promise of one SpriteWorldHandle. The handle has select(id), focus(id), reset(), zoom(step), resize(width,height), diagnostics() and idempotent async dispose(). Positive zoom means zoom in. The factory resolves only after required assets, scene and input handlers are ready. Abort, asset failure and context loss reject or show a visible retry state and leave no late handle.

## Diagnostics

The read-only window.__robotWorldSprites getter reports build/session identity, Phaser version/backend, mode, canvas and CSS sizes, DPR, camera center/zoom/bounds, selected id, cursor index/playing/speed/tick/revision, source and visual robot positions, atlas frame/facing, texture/object/game counts, real and synthetic actor counts, samples, median/p95 frame intervals, long-stall counts, loaded and disposed state. No mutation API is exposed.

## Projection and sizing

World is 1280 by 768. Source maps to worldX = 640 + 80 * sourceX and worldY = 384 - 48 * sourceY. Robot feet anchor at that point. Camera starts centered at (640,384), zoom 1, bounds (128,64,1024,640), clamped to 0.75–2. Nominal sprite height is 64 world pixels; measured CSS height is evidence. Atlas poses use one shared scale from referenceHeightPx; no per-frame stretching.

## Timing and errors

Only the Phaser world update advances the copied Playback, once per render update, using raw elapsed time. Scrubbing and paused state use deterministic pose/facing; hidden pages pause without catch-up. Loading malformed metadata, missing image or context loss produces a visible error and retry preserving cursor/selection. One game is active; unmount leaves zero. The renderer uses local assets only, apart from any explicitly documented font, and never calls live agents, ontology, ARE, KEP or AlchLang.
