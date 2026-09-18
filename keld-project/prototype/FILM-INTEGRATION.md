# Film and complete illustrated legend

The landing page embeds the owner's [YouTube film](https://www.youtube.com/watch?v=ZQU8JeN6nQQ) after an explicit Play click. A local optimized copy of thumbnail v2 appears first. The external frame requests captions and inline playback; an always-visible YouTube link provides direct access. Switching to the shop removes the frame, stopping hidden playback. Offline HTML editions open YouTube in a new tab because file URLs cannot supply the web referrer expected by embedded players.

The six inline slides now contain the full prose previously confined to the illustrated-reader popup. `index.template.html` owns that story. `build.py` projects its six `.story-prose` blocks into the slideshow, preserving paragraph emphasis and quotations. The expanded scene uses the same content. This prevents three separately maintained versions of the legend.

## Rebuild and verify

Run `python3 build.py` from this directory. Serve this directory on port 4399, then run `node qa_film.mjs` (uses the existing video package's Playwright installation). Generated studio, shop, legend and offline pages all receive the update. No deployment was performed.

`QA-film.json` records responsive checks, full-prose equality, keyboard navigation, dialogs, deferred iframe loading, playback teardown on shop navigation and offline behavior. The test intercepts the YouTube frame to validate local behavior deterministically; it does not assert that YouTube played successfully. The supplied public URL resolves to the expected film title. The live headless iframe check returned no readable player status, so viewer playback remains a human check.

## Construction boundary

Owner-directed D65 candidate work, route `CA2-ROUTE-IMPLEMENT`, request `keld-landing-video-102`. Product frontier: integrate the published film and complete story into the existing static landing page. No ontology selector dependency. Operational residue: owner review and any later separately authorized deployment. No changes to checkout, license, or release authority.

## Open Questions

Confirm playback in the owner's Windows Chrome and YouTube subtitle availability; caption preferences cannot create captions missing from the uploaded video. Embedding depends on the upload's YouTube settings and viewer network. Publishing the updated landing page remains a separate action.
