# ARE documentation prototype 01

Status: local candidate prototype. Authority effect: none.

Current default: [protected visitor chat with reset controls](#visitor-state-and-chat-protections). The simulated conversation has been removed. Earlier sections below retain implementation history. No deployment has been performed.

A high-level introduction leads into an icon-first React Flow map. Eight property lenses emphasize contributing mechanisms. Eight conceptual components open a node-anchored floating expansion inside the canvas or a full-page explanation using the same content. Supports deep links, browser Back, keyboard activation, Escape/focus restoration, component search and textual relationships.

The hero and component canvas remain curated explanations of the work loop, not the full 43-feature documentation catalog. The default conversation section now connects to real ARE modules and GLM through a local server. Sending a message invokes the engine and model; navigating the hero or canvas does not. Component responsibilities can map to several runtime modules; the source paths in the reader are explanatory bindings.

## Run locally

From this directory:

```sh
npm run dev
```

Open <http://127.0.0.1:4193>. The server binds only to loopback and refuses to switch ports silently.

This checkout explicitly reuses the existing `workspace/runtime/node_modules` through a local ignored symlink, `node_modules -> ../../runtime/node_modules`. The package manifest declares the used versions. No dependency download or second dependency tree was needed. This is a local prototype setup, not a standalone reproducibility claim; a separately reviewed lockfile/install is required before distribution.

```sh
npm run build
node scripts/browser-proof.mjs
```

The browser check requires a running server. Its defaults use the existing local Playwright installation and Chromium. Override `ARE_PLAYWRIGHT_ROOT`, `ARE_CHROMIUM`, and `ARE_CANVAS_URL` to use another explicitly selected local setup. Screenshots and raw receipts are regenerated in ignored `evidence/`; Vite output is in ignored `dist/`.

## Construction boundary

User authorization: “so lets do the first prototype,” following the source-linked [canvas research](../../../research/are-documentation-v1/CANVAS-RESEARCH.md), icon-first correction and high-level introduction.

Exact write scope: this experiment directory, local build output and browser evidence. No ARE runtime code, product definitions, source closure, admitted profiles or existing application source is changed. This is owner-directed native prototype construction under the D65 chain, not an admitted product or an operational cutover.

Current product frontier: the first local prototype is built and mechanically verified. Runnable work: start the local viewer, explore the icon map, and rerun the build/browser checks. Next product work: user visual review and formative reader tasks; then refine the scene and expand the shared catalog.

Operational tasks and owners: site placement and publication scope remain product-owner decisions; hosting and a standalone dependency lock belong to a later implementation/distribution scope. These affect distribution, not current local evaluation. Causal blockers for the completed local prototype: none. Deferred residue: deployment, public exposure review and remote service operation. Product approval and release have not been requested or inferred from the tests.

## Validation

2026-09-16: TypeScript and Vite production build passed. The browser proof passed 24 checks, including introduction, icon-only node styling, eight lenses, nonmodal containment, selected-node visibility, reader scrolling, full-page round trip, keyboard activation, Escape/focus return, Back, deep links and mobile containment. No page/console errors or external requests were observed.

Screenshots were visually inspected. Two defects were found and fixed: lost focus after closing the reader, and an offscreen selected icon after resizing to mobile. This is mechanical UI evidence, not accessibility certification or a comprehension study. The expansion follows graph pan, stays within the canvas, and reserves no sidebar width. Source content is curated; automated checks do not establish every product claim.

## Scroll-led hero — motion experiment 02

The current hero is a pinned, dark blue-and-silver stage with four transformations: holographic assembly, selected context, traced feedback and an eight-icon component composition. Anime.js staggers persistent particles and calibration ticks, draws SVG paths, and moves a tracer along the feedback path. Native scroll controls a reversible timeline. Chapter buttons provide direct navigation; reduced-motion mode exposes all chapters in normal document flow.

[The experiment report](MOTION-EXPERIMENT.md) records the DomainSpec Core ontology consulted, the exact source bindings, hypotheses, before/after visual evidence and limitations. [The source ledger](motion-source-ledger.json) preserves IDs, URLs and source digests.

Anime.js 4.5.0 remains locally vendored with MIT license and SHA-256 provenance in `src/vendor/`. No shared Workspace dependency is changed and no runtime CDN is used. The original combined hologram remains as historical evidence at `public/assets/brain-engine-hologram.png`; the current animation uses the separate generated assets described below.

Run `node scripts/hero-proof.mjs` against the local server for the current motion checks. Earlier hero checks/screenshots are historical; current evidence is regenerated under `evidence/`. This is a visual and behavioral prototype, not an engine evaluation or a comprehension study.

## Subtle motion

The introduction has independent slow counter-rotating schematic rings, a gentle hologram float, and a soft aura pulse. “Pause ambient motion” freezes those effects while the existing scroll-driven story remains available.

The canvas shows moving dashed signals on connections within the selected property and gently pulses the relevant icons. “Pause signal motion” stops both. Signals are explicitly illustrative; they do not represent live engine execution. Both views respect changes to `prefers-reduced-motion`.

`node scripts/motion-proof.mjs` passed 15 rendered-motion checks covering movement, pause/resume, property scope and reduced motion. Existing browser and hero checks remain separate regression evidence.

## Holographic cyber engine and projected brain

The opening starts with three independently animated, transparent image sections: base, cylinder block and intake. Scroll assembles them, then briefly crossfades to a complete cyber engine. Its central emitter lights up, a blue projection beam expands upward, and a detailed holographic brain forms above it. Reverse scrolling restores the separated parts. Ambient motion, pause controls and later context/feedback/map chapters remain available.

The engine itself is made of blue holographic energy. Five assets were generated with the built-in image_gen tool and copied unchanged to `public/assets/cyber-engine/`. [Generation provenance and full prompts](public/assets/cyber-engine/generation.json) record the final assets and limitations. The earlier SVG engine and combined raster are no longer used by the hero.

These are artistic V12-like forms, not dimensionally consistent CAD or a mechanical simulation. The short crossfade reconciles differences between the independently generated sections and the complete engine. The projection beam and reveal are animated in the browser; the raster assets themselves do not articulate internally.

`node scripts/assembly-proof.mjs` passed 16 checks covering asset loading and genuine transparency, separated starting positions, assembly before projection, beam-before-brain timing, final placement, reverse scrolling, chapter shortcut, mobile overflow and runtime errors. Current screenshots are in `evidence/projection-*.png`. These checks verify behavior, not visual preference or engineering accuracy.

## Selected brand mark

The owner selected concept 05-C from the imagegen form studies: three separated strokes forming an A. `src/BrandMark.tsx` is a hand-built SVG interpretation for the shared header, introduction and final component scene. The final scene assembles the three strokes on the existing reversible timeline. `public/assets/are-mark.svg` supplies the browser icon. Dark and light backgrounds use different foreground colors for contrast.

This is the prototype’s selected visual identity, not a trademark-registration claim. The source concept was generated with the built-in image_gen tool during the 05/09 exploration; the vector intentionally removes raster texture and glow for small-size readability.

## Component icon family

`src/ComponentIcon.tsx` owns the eight shared SVG geometries used in canvas nodes, readers and the final animated map. Blue accents identify a selected route, incoming information, a source connection or a next action. The [comparison sheet](http://127.0.0.1:4193/icon-family.html) presents the current artwork on light and dark backgrounds at 56, 24 and 16 pixels. The sheet is a static review artifact; update it when changing the shared geometry. Existing reduced-motion and pause controls still apply to scene motion.

## Continuous introduction

The existing four-scene animation is followed immediately by the explanation in normal document flow. The action row beneath the mechanism offers “Go to docs” for direct canvas access. A “Continue to explanation” button scrolls to the first section, “Why is it called Agent Reasoning Engine?”. The mechanism has two successive 15% size reductions. Checkpoint navigation sits at the top left, aligned with the motion control on the right. On desktop this row fades after four seconds and returns on hover or keyboard focus; on touch screens it stays visible. the scroll hint and continue button sit below it. The explanation is always present; there is no reading-mode toggle, popup, overlay, nested scroll area or background overlap. Continuing past the last checkpoint scrolls into the startup signup-flow story. Scrolling back returns to the animation naturally. Reduced-motion visitors reach the explanation directly.

The animation timeline is bounded by its own section, so the explanation’s height does not change checkpoint positions. The main navigation remains sticky. `scripts/hero-proof.mjs` verifies animation geometry and the continuous reading flow; prior overlay screenshots are historical.

## Embedded viewport layout

The shared top navigation stays sticky on all pages, without the prototype badge. Its measured height sets the animation inset and available viewport height, including when the navigation wraps. The secondary animation header and decorative footer text are removed. Pause, explanation and chapter controls remain. Animation size is computed from viewport width and height, reserving space for controls; the explanation uses normal page scrolling in every pane.

`node scripts/pane-proof.mjs` checks 15 viewport combinations, including irregular IDE/sidebar-like panes down to 240×320 and ultrawide screens. It checks all four checkpoints, control containment and separation, and the explanation bounds. This is browser viewport evidence, not a claim of testing inside an actual IDE or Codex host.

## Open Questions

- Does the property-first entry help an unfamiliar reader explain ARE accurately?
- Does the floating expansion placement stay comfortable across larger scenes?
- Which component detail and evidence pages should be expanded first?
- Should the explorer live in Workspace or a standalone documentation site?

Research hypotheses and wider unresolved questions remain in the linked canvas research.

## Task and capability explanation paths

The lower introduction keeps the naming explanation, followed by two connected
paths implemented in [ExplanationPaths.tsx](src/ExplanationPaths.tsx):

- Follow a task: a four-moment signup launch, with linked diagrams and a visible
  distinction between selected model context and information saved outside it.
- Explore capabilities: six icon-led choices, each opening an inline explanation,
  scope statement, implementation reference, and a link to its story moment.

Construction order: inspect implementation evidence → build the task story →
connect capability readers → verify cross-links, navigation, and narrow layouts.
This is owner-directed prototype construction; publication and release remain
outside this change. There are no operational prerequisites or external services.

Evidence for the learning wording is
[interaction-learning validation](../../../implementation/agent-reasoning-engine/benchmarks/real-reasoning-v1/interaction-learning/README.md).
It describes scoped synthetic prototype validation, not independently measured
model-quality improvement. Other capability references are retained alongside the
reader data in ExplanationPaths.tsx. All story diagrams are illustrations, not
live engine traces or benchmark results.

Validation: `node scripts/explanation-paths-proof.mjs` exercises every story
moment and capability, both cross-link directions, context distinctions, and
layout at desktop, narrow sidebar, and minimum pane widths.

### Open Questions for the explanation paths

- Which live integration should supply a real correction-to-reuse demonstration?
- Which capability claims can be strengthened after independent measurements?
- Should a later documentation route preserve the selected task moment in its URL?

## Landing-page presentation

The lower introduction is a continuous product landing page: naming and value
proposition, three icon-led benefits, the task walkthrough, capability exploration,
and a closing documentation action. Both exploration sections stay in the page;
the path shortcuts and story/capability links scroll to the relevant section.
Desktop uses wider, two-column story layouts; narrow panes stack text and diagrams.
No decorative card grid or new raster assets are introduced. The implementation
scope statements and the explanation-path open questions above still apply.

Section palette: the naming introduction stays icy blue, the task walkthrough
and capabilities use progressively lighter navy-blue bands, and the closing docs
action uses pale blue. Section divider lines span the full viewport. Labels, headings, and diagram accents reinforce the
section boundaries; meaning does not depend on color alone. No new open questions
are introduced beyond the explanation-path questions above.

## Shared demonstration (current presentation)

The separate story and capability bands are superseded by a single shared stage,
starting at the context-management moment. Four explicit actions alter prepared
visual states; six capability shortcuts select the matching task moment and its
scope explanation. Applied states persist while exploring and can be reset per
moment. There are no live model calls. The task controls and capability shortcuts
remain directly accessible rather than requiring a scrolling sequence.

See [implementation plan](SHARED-DEMO-PLAN.md) and
[research rationale](PRESENTATION-RESEARCH.md). The revised browser proof checks
content changes, resets, all mappings, keyboard/reduced-motion use and narrow panes.

## Five hero background studies

Open `/background-options.html` for a visual comparison. The opt-in query values
`?background=halo|grid|light|signals|particles` preview the five backgrounds behind
the actual hero. Without the query, the selected particle surface is used.
The variants use original CSS/SVG and a Canvas 2D particle surface; no new libraries or external
assets were imported. Animated variants honor the existing pause and reduced-motion
settings. `node scripts/background-options-proof.mjs` refreshes comparison images
and checks loading, narrow layout, pause behavior, and reduced motion.

Open question: which direction should become the default? Research remains in
[HERO-BACKGROUND-RESEARCH.md](HERO-BACKGROUND-RESEARCH.md).

## Particle surface depth

The selected default uses perspective-scaled dots, forward flow, rolling waves,
and a sparse foreground layer. Mouse parallax eases gently toward the pointer;
touch input does not steer it. The canvas caps drawing resolution at 1.5 device
pixels, reduces density in narrow panes, and targets about 30 updates per second.
It suspends while paused, offscreen, in a hidden tab, or under reduced motion,
with observer/listener cleanup on unmount.

`node scripts/particle-depth-proof.mjs` checks actual rendered movement, frozen
pixels while paused, resume, offscreen suspension, reduced motion, and narrow sizing.
Open question: tune motion intensity after viewing on physical mobile hardware;
these local browser checks are not a device-performance benchmark.

## Invisible enclosure flow (current default)

The floor-style particle surface is replaced by persistent particles moving around
an engine keep-clear region within an unseen six-face enclosure. Tangent steering
softens the corners; contact correction and damped reflection retain brief wall
redirections. Depth changes size, opacity and restrained parallax. Short per-particle
trails clarify movement without painting a persistent boundary. This is procedural
art-directed motion, not a full fluid simulation. See BOUNDED-FLOW-PLAN.md for scope
and open questions. `node --test scripts/particle-flow.test.mjs` checks containment,
core exclusion, contact response, bounded history and deterministic initialization.

The latest field spans the full hero background rather than the space between its
caption and buttons. Density is 1,100 points on wider screens and 360 on narrow
screens. Only points are drawn: trajectory strokes and per-frame trail history
have been removed. Containment, engine exclusion, pause and reduced motion remain.

The current motion is a distributed particle field, superseding global circulation:
each point drifts gently around its own seeded anchor with independent phase and
frequency. There is no common orbit or stream direction. Density, invisible
boundary deflection, engine keep-clear space, and lifecycle controls remain.
The simulation test checks mixed rotational directions and bounded local drift.

Hero scene playback now runs automatically: an initial 0.8-second beat, 16 seconds
of scene transitions, and four-second holds after scenes 1–3. It stays at scene 4
until Replay is chosen. Chapter controls seek to completed scenes and restart the
hold; Pause animation freezes both the sequence and ambient motion. Hidden tabs,
offscreen heroes, and reduced-motion preferences suspend sequence advancement.
Scrolling now goes directly into the explanation instead of seeking the timeline.
Validation: `node scripts/autoplay-proof.mjs` checks playback, holds, navigation,
pause/resume, offscreen suspension, final stop, replay, narrow layout and reduced
motion. Open question: tune dwell durations after product review.

The backdrop now shares scene holds: particles freeze at each checkpoint and on
the final overview, then resume during transitions or replay. The engine’s subtle
scene motion remains independent. Pause animation still freezes both.


## Current explanation walkthrough

The whole task/capability section now follows the [reviewed DAG plan](WALKTHROUGH-REDESIGN-PLAN.md).
Open /#are-walkthrough for the section. Four named steps use a consistent event →
ARE contribution → next-action diagram. Reveal the result, compare before/after,
then continue. Optional capability exploration retains six distinct lenses.
The hero and role introduction remain unchanged.

Run node scripts/walkthrough-proof.mjs for the current interaction contract and
node scripts/explanation-round2-proof.mjs for retained role layout. The older
explanation-paths-proof command delegates to the current walkthrough checks.
Comprehension questions remain owned by the plan's Open Questions section.

## Historical agent conversation simulation — removed

The [simulation plan](AGENT-SIMULATION-PLAN.md) records the earlier prepared-reply experiment. Its component, stylesheet, route branch and browser test were subsequently removed at the user's request. The current page provides only the real agent chat; historical screenshots are not evidence of live engine or model execution.

## Live ARE + GLM chat

2026-09-17: the default conversation now uses actual ARE modules and live `glm-5.3-flash` responses. Open <http://127.0.0.1:4193/#are-walkthrough>. The former simulation URL now resolves to the live chat. The older documentation walkthrough remains at `?explanation=walkthrough#are-walkthrough`; it is not another agent chat.

The [construction plan](LIVE-CHAT-PLAN.md) records the user authorization, D65 boundary, module bindings, limits, and open questions. The [research](CHAT-EXPERIENCE-RESEARCH.md) remains the rationale for the chat structure.

`npm run dev` now installs a loopback Vite server middleware for `/api/are/`. It resolves the existing encrypted credential configuration at `~/.config/are/glm-flash-credential.json`. `ARE_GLM_CREDENTIAL_PATH` may select another compatible reference configuration. Never put the API key into a `VITE_` variable, browser source, or this directory. No new dependency was installed. A static-only deployment does not provide the chat backend.

A successful turn has two live model calls: structured intent interpretation, then the reply after ARE routing and context selection. The chat shows each call's reported input/output usage, route digest, selected context and omitted-message count, scoped preference quotes, and a process-memory ARE checkpoint. The browser receives completed answer text and incremental operational events, not hidden reasoning or simulated typing.

This connection supports explanations, plans, and code drafts. No shell, application files, test runner, deployment tool, or live search is attached. A route named Implement does not execute an implementation. Session preferences are contextual adaptation, not durable language learning or model training. Sessions expire after 30 idle minutes and disappear on server restart; no transcript cache directory is created.

Validation:

```sh
node --test server/chat.test.mjs
npm run build
node scripts/live-chat-proof.mjs
# Explicit live-provider test: three conversation turns, six model calls.
ARE_LIVE_CHAT_TEST=1 node scripts/live-chat-proof.mjs
# Visitor reset flow (two live turns):
ARE_LIVE_CHAT_TEST=1 node scripts/visitor-reset-proof.mjs
```

The backend passed nine tests covering real ARE routing/context/checkpoints with provider fixtures, scoped preference reuse, schema rejection, provider failure, cancellation, session isolation, context bounds, active-session deletion, and HTTP origin/input boundaries. TypeScript and the production build passed; Vite reports a non-blocking 500 kB chunk advisory. The earlier guided simulation had passed 40 checks before its later removal; that result is historical. A browser-bundle inspection found none of the server-only credential loader or provider endpoint markers.

The live browser proof passed 22 checks. Three actual turns used **2,188 provider-reported tokens** total: 598, 733, and 857. GLM retained the requested “teammates” vocabulary in a later reply, and ARE selected `CA2-ROUTE-PLAN` for the next-checks request. Each turn included real route and checkpoint receipts. The proof also checked 1440, 331, and 240 pixel layouts, browser cancellation with a separately labeled delayed fixture, reset, and the absence of browser provider calls or authorization headers. A separate initial live smoke turn used 604 tokens. These results establish a working connection, not benchmark quality or token savings.

Ignored evidence: `evidence/live-chat-first-turn.json`, `evidence/live-chat-proof.json`, and `evidence/live-chat-{1440,331,240}.png`. The live proof records actual provider usage and replies; unit tests never call the provider. Running the browser proof without the explicit live flag performs UI/lifecycle checks only.

Open questions are owned by [LIVE-CHAT-PLAN.md](LIVE-CHAT-PLAN.md#open-questions).

## Visitor state and chat protections

2026-09-17: the live chat is now discoverable through **Try ARE** in the page navigation and hero. Every new visit/tab starts fresh; the browser retains its private session capability only in memory. The simulated conversation component, stylesheet, entry point, and test have been removed. No VPS deployment, remote connection, or public exposure has been performed.

The page shows retained language preferences, routing history, current context size, and remaining turns. **Forget language** clears preferences and starts a fresh model context. **Reset routing history** clears prior intent/route decisions while keeping language preferences. **Start fresh** clears both and the visible conversation. Partial resets mark earlier messages as excluded from the model; leaving those messages in the browser does not feed them back to GLM. There are no learned routing rules in this adapter, and the interface says so.

[VISITOR-CHAT-PLAN.md](VISITOR-CHAT-PLAN.md) owns the current construction boundary, reset semantics, complete protection limits, and open questions. Server-side protections include per-session random capabilities, identity rotation, exact same-origin requests, closed input shapes, bounded I/O, cancellation, session isolation, shared turn/token allowances, and a lack of execution tools. The per-visit allowance is 20 attempts and does not reset with ARE state. The shared hourly limits are 30 turns and 100,000 tokens. Unknown usage from failed/cancelled provider dispatches consumes a conservative reservation; this is not reported as measured billing. These process-local limits are not a completed public-hosting design.

Model interpretation failures now report safe diagnostic codes and field-level validation issues through the real activity view. They do not disclose raw provider errors, credentials, or hidden reasoning and do not trigger an automatic retry or simulated answer. Live model classification can fail validation; this remains visible rather than silently choosing a route.

The production candidate is a three-container edge, public-chat, and inference-
broker split in `deploy/compose.security.yaml`. The broker's dedicated credential
file must be a regular, non-symlink file owned by UID/GID 65532 with mode 0400;
Compose file secrets retain host ownership on this local runtime. Install that
exact file before startup without printing its value:

```sh
sudo workspace/experiments/are-documentation/deploy/install-model-secret.sh /ABSOLUTE/PATH/model-api-key
ARE_MODEL_API_KEY_FILE=/ABSOLUTE/PATH/model-api-key docker compose \
  -f workspace/experiments/are-documentation/deploy/compose.security.yaml up -d
```

The chat receives no secret mount. Broker quota state is durable on its dedicated
volume; chat state remains memory-only. These local controls do not establish
provider-side retention policy or destination-pinned production egress.

Validation commands:

```sh
node --test server/chat.test.mjs
npm run build
ARE_LIVE_CHAT_TEST=1 node scripts/live-chat-proof.mjs
ARE_LIVE_CHAT_TEST=1 node scripts/visitor-reset-proof.mjs
```

Evidence is written to ignored `evidence/live-chat-proof.json`, `evidence/visitor-reset-proof.json`, and the corresponding screenshots. Session capabilities are excluded from saved receipts. The forgetting check also records an attempt receipt when it fails, so an unsuccessful model turn is not mistaken for proof of successful forgetting.

Final validation: 13 backend tests passed; TypeScript and the production build passed. The live visitor-reset proof passed 21 checks, including two isolated browser contexts, inspectable learned wording, language forgetting, fresh model history, routing/full reset, reload, and widths of 1366, 331 and 240 pixels. The final two live turns reported 984 and 771 tokens (1,755 total). After forgetting, GLM replied that it had no record of the special term; the actual context receipt contained no retained preference and only the new user message.

During verification, earlier live attempts failed intent-schema validation and one ambiguous wording instruction was interpreted incorrectly. A proof also initially inspected an asynchronous response before collecting it. The harness now awaits response evidence, and the classifier receives a JSON data envelope separating conversation content from its classification instructions. Validation still fails closed and makes no automatic repair/retry call. The passing run demonstrates the reset behavior, not perfect model interpretation. The main live-chat proof also passed its 22 checks earlier in this change; the final classifier-envelope adjustment was then covered by the backend tests and live reset proof.
