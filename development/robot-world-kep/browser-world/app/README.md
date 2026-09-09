# Robot World browser prototype

Local B1 scene candidate. See [the plan](../PLAN.md) and the current [B1 review](../checkpoints/B1/v1/REVIEW.md) for evidence and limitations. This observer presents the pinned recorded fixture; it does not run live agents or KEP exchanges.

## Run

Use a compatible Linux Node/npm pair; this workspace currently has Node 26.8.1 under `/home/vrondelli/.nvm/versions/node/v26.8.1/bin`. The default shell's `npm` resolves to Windows, so prepend the Linux Node bin directory for these commands:

```bash
export PATH="/home/vrondelli/.nvm/versions/node/v26.8.1/bin:$PATH"
npm ci
npm test
npm run build
npm run preview
```

Run from this `app/` directory. Preview uses `http://127.0.0.1:16340/` with a strict port. `npm run dev` uses the same loopback port for development; use only one of the two servers at a time. No public network bind or cloud resource is required.

The dependency lock pins the installed versions. The browser starts with the final recorded frame; Replay returns to the beginning. Drag the world to orbit, scroll to zoom, select a crew card or robot, and use Focus/Reset to change the view. Space plays/pauses while the canvas is focused; 1/2 select robots and R resets the camera. Timeline and speed use native accessible controls. Backgrounding the page pauses playback.

## Source boundaries

`session.ts` verifies bounded input, exact selected fixture hash and shape before exposing frozen frames. `playback.ts` owns presentation time and never changes the source. `world.ts` owns the engine, assets, camera, and render loop. React subscribes to cursor state changes rather than every rendered frame.

The seven source models remain under the prior Unity preparation package. `../tools/prepare-assets.py` creates browser derivatives without changing mesh topology, sharing deduplicated images and preserving source hashes. Existing derivative revisions are not overwritten by that script. The scene adds small instanced gravel, a paved apron, workbench components, and cables; these decorations do not create simulation events. Robot portraits are actual offscreen model renders.

Babylon's documented environment map is saved locally with its source URL and digest. DM Sans is requested from Google Fonts with a system-font fallback. Assets and fixture data are local. Package installation has no access to simulation credentials.

`window.__robotWorld` is a read-only diagnostics snapshot for browser QA. Where a browser implements the optional page-scoped WebMCP API, `read_colony_snapshot` exposes the currently selected recorded frame. Registration is feature-detected and removed at teardown; unsupported browsers use the normal interface. No live inference or simulation command is registered.

Open questions: [BQ1–BQ3](../PLAN.md#open-questions). B1 is a visual review, and does not establish the B3 local product candidate or later network functionality.
